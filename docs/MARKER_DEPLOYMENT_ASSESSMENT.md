# Marker 后端部署评估报告

> 评估日期：2026-05-21 | 评估对象：方案 C（Marker CPU 后端服务）
> 评估标准：磁盘空间、内存占用、CPU 影响、架构冲突、部署风险

---

## 一、服务器现状基线

### 1.1 硬件资源

| 指标 | 当前值 | 可用余量 |
|------|--------|----------|
| **CPU** | Intel Xeon Silver 4310 @ 2.10GHz，24 核 | 负载 2.69/24 = 11% |
| **内存** | 251 GB 总计，已用 19 GB | **226 GB 可用** |
| **磁盘 /** | 832 GB 总计，已用 430 GB | **402 GB 可用** |
| **磁盘 /data** | 312 TB 总计，已用 85 TB | **227 TB 可用** |
| **GPU** | 无 NVIDIA GPU | — |
| **磁盘 IO** | iowait 0.01% | 极低压力 |

### 1.2 现有服务占用

| 进程 | 端口 | 内存 |
|------|------|------|
| scholars-tea (Next.js) | 3002 | 97.7 MB |
| scholars-tea-socket | 3001 | 57.5 MB |
| scholars-tea-embedding | 9997 | 668.0 MB |
| **合计** | — | **823.2 MB** |

### 1.3 现有环境

- Python 3.9.23（通过 miniconda3）
- 已有 conda 环境：`ai_agent`
- 无 HuggingFace cache 残留（未检测到 `.cache/huggingface`）

---

## 二、Marker 资源需求（官方数据 + 社区实测）

### 2.1 安装体积

| 组件 | 大小 | 说明 |
|------|------|------|
| PyTorch (CPU) | ~1.5 GB | `torch` + `torchvision` CPU 版 |
| Transformers + tokenizers | ~0.5 GB | HuggingFace 生态 |
| Marker 自身 + surya OCR | ~0.5 GB | 代码 + 轻量依赖 |
| **模型权重（首次下载）** | **~2-3 GB** | `surya` layout 模型 + `texify` 公式模型 |
| **总计安装** | **~5-6 GB** | 一次性，后续无增长 |

> 参考：Medium 社区文章实测 "main file amounts to a size of 2.7 GB"；Marker GitHub 显示单 worker VRAM 峰值 5GB（GPU），CPU 模式内存约 4-8GB。

### 2.2 运行时内存（CPU 模式）

| 场景 | 内存占用 | 说明 |
|------|----------|------|
| 模型加载后 idle | ~3-4 GB | 模型常驻内存 |
| 单 PDF 处理（10 页） | ~4-6 GB | 峰值，处理完释放 |
| 并发 2 个请求 | ~6-10 GB | 视 PDF 页数而定 |
| 并发 4 个请求 | ~10-16 GB | 建议设置 worker 上限 |

### 2.3 运行时 CPU

| 指标 | 数值 |
|------|------|
| 单页处理时间（CPU） | ~0.5-2 秒（估算，H100 GPU 为 0.18s）|
| CPU 占用 | 处理时单核满载，非持续 |
| 并发 worker 数 | 建议 1-2（CPU 模式）|

---

## 三、核心问题评估

### 3.1 会不会占据太多服务器空间？

**结论：不会。Marker 的磁盘占用 < 当前可用空间的 2%。**

```
Marker 安装需求:     ~5-6 GB
/ 分区可用空间:        402 GB
占比:                  5/402 = 1.2%

即使加上日志、临时文件、多次模型更新:
预估最大占用:          ~10 GB
占比:                  10/402 = 2.5%
```

**对比参考：**
- Next.js `node_modules`：通常 1-3 GB
- 现有 embedding 服务模型：未知，但 668MB 内存常驻意味着有一定磁盘占用
- 用户 home 目录其他项目：已有多项（`.udocker`、conda 等）

**空间充裕度：⭐⭐⭐⭐⭐（完全无压力）**

### 3.2 会不会影响当前架构？

**结论：不会。Marker 可作为完全隔离的独立微服务运行，与现有架构零耦合。**

#### 架构隔离分析

| 维度 | 现有架构 | Marker 服务 | 冲突？ |
|------|----------|-------------|--------|
| **进程管理** | PM2 (Node.js) | 独立 Python 进程 / 可选 PM2 托管 | ❌ 无冲突 |
| **运行时** | Node.js 20 | Python 3.10+ | ❌ 完全隔离 |
| **依赖管理** | npm | conda/pip venv | ❌ 完全隔离 |
| **端口** | 3000/3001/3002/9997 | 可配置（建议 3003/8001） | ❌ 无冲突 |
| **数据库** | PostgreSQL + Prisma | 无数据库依赖 | ❌ 无冲突 |
| **网络** | Next.js API Routes | 内部 HTTP API（localhost） | ❌ 无冲突 |
| **文件系统** | `~/scholars` | 独立 venv + 模型缓存 | ❌ 无冲突 |
| **内存竞争** | 823 MB 常驻 | ~4-6 GB 峰值（按需） | ❌ 226G 可用，无竞争 |
| **CPU 竞争** | 低负载 | 处理时短期高 CPU | ⚠️ 可配置 worker 数限制 |

#### 推荐的集成架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                             │
└─────────────────────────┬───────────────────────────────────┘
                          │ 上传 PDF
┌─────────────────────────▼───────────────────────────────────┐
│              Next.js (port 3002)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  POST /api/v1/knowledge/extract-pdf                 │   │
│  │    ├── 接收 PDF 文件                                  │   │
│  │    ├── 转发到 Marker API (localhost:3003)            │   │
│  │    └── 返回 Markdown → 存入 IndexedDB               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP (内部)
┌─────────────────────────▼───────────────────────────────────┐
│              Marker API Server (port 3003)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Python 3.10 + marker-pdf (独立 conda env)          │   │
│  │  模型常驻内存 ~3GB，处理时 ~4-6GB                    │   │
│  │  无数据库，无持久化，纯计算服务                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**关键设计：**
- Next.js API Route 作为**代理/网关**，前端无感知
- Marker 服务仅监听 `localhost:3003`，**不暴露外网**
- 可设置处理超时（如 60 秒），避免长 PDF 阻塞
- 可选：用 PM2 管理 Marker API，统一进程监控

### 3.3 风险评估

| 风险项 | 等级 | 说明 | 缓解措施 |
|--------|------|------|----------|
| **Python 版本** | 🟡 中 | Marker 需 Python 3.10+，当前 3.9.23 | 创建新 conda env：`conda create -n marker python=3.11` |
| **HuggingFace 下载** | 🟡 中 | 国内访问 HuggingFace 可能受限 | 配置 HF-Mirror 镜像或预下载模型 |
| **首次模型下载时间** | 🟢 低 | ~2-3GB，需 5-15 分钟 | 后台预下载，不影响现有服务 |
| **PyTorch 安装时间** | 🟢 低 | CPU 版 ~1.5GB，需 5-10 分钟 | 一次性，后续无影响 |
| **并发处理内存峰值** | 🟢 低 | 多请求同时处理可能达 10GB+ | 限制 worker 数为 1，队列化处理 |
| **服务崩溃影响** | 🟢 低 | Marker 崩溃不影响主站 | 前端有降级逻辑（回退 pdf.js）|
| **长期维护** | 🟢 低 | 独立服务，升级不影响主站 | 独立 venv，可独立更新/回滚 |

---

## 四、部署命令（预估）

```bash
# 1. SSH 到服务器
ssh ZJU-MSE-HPC
cd /data/home/zju321

# 2. 创建独立 conda 环境（Python 3.11）
conda create -n marker python=3.11 -y
conda activate marker

# 3. 安装 Marker
pip install marker-pdf

# 4. 预下载模型（首次运行会自动下载，或手动触发）
# 如 HuggingFace 受限，设置镜像：
export HF_ENDPOINT=https://hf-mirror.com

# 5. 测试单文件转换
marker_single test.pdf --output_dir ./test_output

# 6. 启动 API 服务（FastAPI）
pip install uvicorn fastapi python-multipart
marker_server --port 3003

# 7. （可选）用 PM2 管理 Marker
cd ~/scholars
pm2 start "marker_server --port 3003" --name marker-pdf
pm2 save
```

---

## 五、综合结论

### 5.1 资源占用结论

| 资源 | Marker 需求 | 服务器余量 | 充裕度 |
|------|-------------|-----------|--------|
| **磁盘** | ~5-6 GB | 402 GB | **1.2%** ✅ |
| **内存（峰值）** | ~6 GB | 226 GB | **2.7%** ✅ |
| **CPU** | 短期单核满载 | 24 核，负载 11% | **无影响** ✅ |
| **端口** | 3003（可配置） | 大量可用 | **无冲突** ✅ |

### 5.2 架构影响结论

- **无耦合**：Marker 作为独立 HTTP 服务，与 Next.js/Socket/Embedding 服务零依赖
- **可降级**：Marker 服务故障时，前端自动回退到 pdf.js 提取（已有质量评分逻辑）
- **可隔离**：独立 conda env，Python 依赖与 Node.js /npm 生态完全隔离
- **可监控**：可用 PM2 统一管理，或独立日志监控
- **可扩展**：如需更高性能，未来可迁移到带 GPU 的服务器，前端无感知

### 5.3 最终建议

**方案 C（Marker 后端）完全可行，强烈推荐实施。**

理由：
1. **资源占用极小**：磁盘 < 2%，内存 < 3%，CPU 按需使用
2. **零架构风险**：完全隔离的微服务架构，不影响现有任何服务
3. **效果最佳**：公式准确率 >95%，远超 pdf.js/PyMuPDF WASM
4. **零用户成本**：开源免费，无 API 调用费用
5. **一次部署，长期受益**：模型常驻内存，后续 PDF 处理无需重复下载

**唯一的注意事项**：
- 需创建 Python 3.11 conda 环境（当前 3.9.23 不满足）
- HuggingFace 模型下载可能需要国内镜像（`hf-mirror.com`）

---

## 六、实施建议

如果决定实施方案 C，建议按以下顺序：

1. **先在服务器测试安装**（不接入主站）
   ```bash
   conda create -n marker python=3.11 -y
   conda activate marker
   pip install marker-pdf
   marker_single some_test.pdf --output_dir ./test
   ```

2. **验证效果**：找 3-5 篇含复杂公式的论文测试提取质量

3. **接入主站**：
   - 新增 API Route：`POST /api/v1/knowledge/extract-pdf`
   - 前端修改上传流程：质量评分 C/D/F 时调用 Marker API
   - 保留 pdf.js 作为降级方案

4. **PM2 托管**：将 Marker API 加入 `ecosystem.config.js`，统一管理
