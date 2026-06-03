# Marker PDF 后端基础设施文档

> 创建日期：2026-05-26 | 最后更新：2026-05-26
> 用途：记录 Marker 部署的所有基础配置，避免重复踩坑

---

## 一、服务器硬件基线

| 指标 | 数值 |
|------|------|
| **主机** | `10.72.212.33` (mu02) |
| **CPU** | Intel Xeon Silver 4310 @ 2.10GHz，24 核 |
| **内存** | 251 GB 总计 / 226 GB 可用 |
| **磁盘 `/`** | 832 GB 总计 / 402 GB 可用（系统分区） |
| **磁盘 `/data`** | 312 TB 总计 / 227 TB 可用（YRFS 分布式存储，用户数据在此） |
| **GPU** | 无 NVIDIA GPU |
| **OS** | CentOS Linux 7 (Core) |
| **GCC** | 4.8.5（⚠️ 过旧，numpy 编译需要 >= 9.3） |
| **网络代理** | `http://127.0.0.1:7890` / `socks5h://127.0.0.1:7890` |

### 关键路径

| 路径 | 说明 |
|------|------|
| `~/scholars` | Scholar's Tea 项目（symlink → `/data/home/zju321/321/DHL/Scholar's_Tea`） |
| `/data/home/zju321` | 用户 home 目录（在 `/data` 分区，227TB 可用） |
| `/data/home/zju321/miniconda3` | Miniconda 安装目录 |
| `/data/home/zju321/miniconda3/envs/ai_agent` | **旧** Marker 运行的 conda 环境（Python 3.9，已废弃） |
| `/data/home/zju321/scholars/venv-marker` | **新** Marker 运行的 uv venv（Python 3.11，推荐） |
| `/data/home/zju321/.cache/huggingface/hub` | HuggingFace 模型缓存 |

---

## 二、Python 环境管理器：uv

### 2.1 什么是 uv

**uv** 是 [Astral](https://astral.sh) 公司开发的 Python 包管理器（Rust 编写），替代 pip + venv + pyenv。特点：
- 安装速度极快（10-100x pip）
- 自动管理 Python 版本和虚拟环境
- 无需 conda，纯二进制部署

### 2.2 uv 安装位置

```
/data/home/zju321/.local/bin/uv              # uv 可执行文件
/data/home/zju321/.local/share/uv/python/    # uv 管理的 Python 解释器
```

### 2.3 uv 已安装的 Python 版本

```bash
$ uv python list

cpython-3.15.0a8-linux-x86_64-gnu            <download available>
cpython-3.14.4-linux-x86_64-gnu              <download available>
cpython-3.13.13-linux-x86_64-gnu             <download available>
cpython-3.12.13-linux-x86_64-gnu             <download available>
cpython-3.11.15-linux-x86_64-gnu             .local/share/uv/python/cpython-3.11-linux-x86_64-gnu/bin/python3.11  ✅ 已安装
cpython-3.10.20-linux-x86_64-gnu             .local/share/uv/python/cpython-3.10-linux-x86_64-gnu/bin/python3.10  ✅ 已安装
```

### 2.4 为什么从 conda 切换到 uv

| 问题 | conda (ai_agent, Python 3.9) | uv (venv-marker, Python 3.11) |
|------|------------------------------|-------------------------------|
| Python 版本 | 3.9.23（Marker 官方要求 3.10+） | 3.11.15 ✅ |
| `\|` 类型语法 | 需要手动 patch 5 个 surya 文件 | 原生支持 ✅ |
| transformers 兼容性 | 4.57.6 与 surya 0.5.0 冲突 | 待验证 |
| 环境位置 | `~/miniconda3/envs/ai_agent`（远离项目） | `~/scholars/venv-marker`（与项目一起） |
| 安装速度 | 慢 | 极快 |

---

## 三、Marker 虚拟环境（uv）

### 3.1 创建命令

```bash
cd /data/home/zju321/scholars
uv venv --python 3.11 venv-marker
source venv-marker/bin/activate
uv pip install marker-pdf
```

### 3.2 环境信息

| 属性 | 值 |
|------|-----|
| **路径** | `/data/home/zju321/scholars/venv-marker` |
| **Python** | 3.11.15 |
| **管理器** | uv 0.11.6 |
| **主要包** | marker-pdf 0.2.17, torch 2.6.0+cpu, transformers, surya-ocr, texify |

### 3.3 激活方式

```bash
# 方式一：source activate
source /data/home/zju321/scholars/venv-marker/bin/activate

# 方式二：直接用 uv run（无需显式激活）
uv run --python /data/home/zju321/scholars/venv-marker/bin/python marker_single input.pdf output

# 方式三：指定完整路径
/data/home/zju321/scholars/venv-marker/bin/python -m marker.convert input.pdf output
```

---

## 四、废弃的 conda 环境（ai_agent）

> **⚠️ 以下记录仅作参考，ai_agent 环境的 Marker 安装已废弃，请使用 uv venv。**

### 废弃原因

Python 3.9 + transformers 4.57.6 + surya-ocr 0.5.0 存在多处不兼容，需要大量手动 patch：

| Patch | 问题 | 文件 |
|-------|------|------|
| #1 | Python 3.9 不支持 `\|` 联合类型 | surya 5 个文件 |
| #2 | transformers 4.57.6 新增 `sdpa` 注意力实现 | `surya/model/ordering/decoder.py` |
| #3 | transformers 4.57.6 `PretrainedConfig` 递归初始化冲突 | 降级 transformers 到 4.45.2 |

### 保留内容

ai_agent 环境仍运行 **scholars-tea-embedding** 服务（PM2 管理，port 9997），请勿删除。

```bash
# embedding 服务配置（ecosystem.config.js）
script: '/data/home/zju321/miniconda3/envs/ai_agent/bin/python3'
args: 'scripts/embedding-server.py'
```

---

## 五、Marker 模型清单

| 模型 | HuggingFace ID | 大小 | 功能 | 状态 |
|------|---------------|------|------|------|
| **Surya Detection** | `vikp/surya_det3` | 147 MB | 检测 PDF 页面中的文本区域、表格、图片等 | ✅ 已下载 |
| **Surya Recognition** | `vikp/surya_rec2` | 898 MB | OCR 识别：将检测到的文本区域转为纯文本 | ✅ 已下载 |
| **Texify** | `vikp/texify` | 600 MB | 公式识别：将数学公式转为 LaTeX | ✅ 已下载 |
| **Surya Layout** | `vikp/surya_layout3` | 147 MB | 页面布局分析：识别标题、段落、表格等结构 | ✅ 已下载 |
| **Surya Order** | `vikp/surya_order` | 525 MB | 阅读顺序检测：确定文本的正确阅读顺序 | ✅ 已下载 |
| ~~Surya Layout (旧)~~ | ~~`vikp/surya_layout`~~ | ~~115 MB~~ | ~~旧版 layout 模型（不需要）~~ | ❌ 已删除 |

**模型总大小**：~2.3 GB

**存储路径**：`/data/home/zju321/.cache/huggingface/hub/`

**下载命令**：
```bash
source /data/home/zju321/scholars/venv-marker/bin/activate
huggingface-cli download vikp/surya_det3
huggingface-cli download vikp/surya_rec2
huggingface-cli download vikp/texify
huggingface-cli download vikp/surya_layout3
huggingface-cli download vikp/surya_order
```

---

## 六、Marker CLI 使用

### 6.1 单文件转换

```bash
source /data/home/zju321/scholars/venv-marker/bin/activate
export TORCH_DEVICE=cpu

marker_single input.pdf output_dir
# 输出：output_dir/input/input.md
```

### 6.2 选项

```bash
marker_single input.pdf output_dir \
  --output_format markdown \
  --ocr_all_pages \
  --langs zh,en
```

### 6.3 首次运行加载时间

- 首次加载 5 个模型到 CPU 内存：约 **30-60 秒**
- 模型常驻内存后：约 **4-6 GB**
- 单页 PDF 处理时间：约 **1-3 秒/页**

---

## 七、与 Next.js 集成

### 7.1 API 路由

- **路径**：`POST /api/v1/knowledge/extract-pdf`
- **源码**：`src/app/api/v1/knowledge/extract-pdf/route.ts`
- **流程**：接收 PDF → 保存临时文件 → 调用 `marker_single` CLI → 返回 Markdown

### 7.2 前端触发逻辑

- **位置**：`src/hooks/usePersonalKB.ts` 的 `uploadDocument`
- **触发条件**：`pdf-extractor.ts` 质量评级 `grade === 'poor'` 或 (`grade === 'fair'` 且 `hasFormulaWarning`)
- **降级**：Marker 失败时自动回退到 pdf.js 原始文本

### 7.3 环境变量

Marker 运行不需要额外环境变量（通过 conda activate 注入 Python 路径）。

---

## 八、已知问题与限制

| 问题 | 说明 | 解决状态 |
|------|------|----------|
| ~~Python 3.9 语法不兼容~~ | ~~surya 使用 `\|` 联合类型~~ | ~~已废弃，uv 使用 3.11~~ |
| ~~transformers 4.57.6 sdpa~~ | ~~ordering decoder 缺少 sdpa 键~~ | ~~已废弃，uv 使用 3.11~~ |
| ~~transformers 4.57.6 encoder~~ | ~~`PretrainedConfig` 递归初始化冲突~~ | ~~已废弃，uv 使用 3.11~~ |
| CentOS 7 GCC 过旧 | numpy 编译需要 GCC >= 9.3 | ✅ uv 使用预编译 wheel |
| 模型首次加载慢 | CPU 加载 5 个模型需 30-60s | ⚠️ 正常，后续缓存 |
| 无 GPU | 纯 CPU 推理，速度较慢 | ⚠️ 可接受 |

---

## 九、运维命令速查

```bash
# SSH 到服务器
ssh ZJU-MSE-HPC

# 激活 Marker 环境（uv venv）
source /data/home/zju321/scholars/venv-marker/bin/activate

# 测试 Marker
marker_single /tmp/test.pdf /tmp/marker-out

# 查看模型缓存
ls -la ~/.cache/huggingface/hub/models--vikp--*

# 清理 Marker 临时文件（如堆积）
find /tmp -name 'marker-*' -type d -mtime +1 -exec rm -rf {} + 2>/dev/null

# 查看 Marker 进程
ps aux | grep marker_single

# 重启 Next.js（如 API Route 更新后）
pm2 restart scholars-tea

# uv 常用命令
uv python list                    # 列出可用 Python 版本
uv venv --python 3.11 venv-name # 创建 venv
uv pip install package            # 安装包
uv pip list                       # 列出已安装包
uv run python script.py           # 在 venv 中运行脚本
```

---

## 十、相关文档

- `docs/PDF_FORMULA_EXTRACTION_PLAN.md` — PDF 公式提取技术方案
- `docs/MARKER_DEPLOYMENT_ASSESSMENT.md` — Marker 部署资源评估报告
- `docs/PROJECT_PROCESS.md` — 项目开发进程记录
- `.claude/project-memory/marker-pdf-deployment.md` — 项目记忆（部署决策记录）
