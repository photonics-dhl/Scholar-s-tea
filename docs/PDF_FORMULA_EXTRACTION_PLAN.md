# PDF 公式提取技术方案

> 调研日期：2026-05-21 | 适用场景：Scholar's Tea 个人知识库 PDF 上传与文本提取

---

## 一、调研结论：为什么浏览器端公式提取是"未完全解决"的问题

### 1.1 核心瓶颈：PDF 的字体编码机制

学术 PDF 中的数学公式通常使用以下方式嵌入：

- **Type 3 自定义字体**：每个数学符号是一个小型矢量图形，字符映射表（CMap）可能完全自定义
- **CID 字体子集**：LaTeX 生成的 PDF 常用 CMMI/CMSY/CMEX 等字体子集，编码与 Unicode 不对应
- **ToUnicode 表缺失或错误**：很多 PDF 的 ToUnicode CMap 不完整，导致提取时返回乱码

**结论**：无论用 pdf.js、PyMuPDF、还是 PDFium，当 PDF 缺少正确的 ToUnicode 映射时，文本提取都必然产生乱码。这不是解析库的问题，是 PDF 格式本身的缺陷。

### 1.2 现有纯浏览器方案的评估

| 方案 | 原理 | 公式支持 | 可行性 | 评估 |
|------|------|----------|--------|------|
| `pdfjs-dist` (当前在用) | 解析 PDF 对象流，提取文本 | ❌ 差 | ✅ | 基础文本 OK，公式乱码 |
| `@opendocsg/pdf2md` | 基于 pdf.js 的 Markdown 转换 | ❌ 同样差 | ✅ | 结构检测更好，但公式问题未解决 |
| `PyMuPDF WASM` (`@bentopdf/pymupdf-wasm`) | PyMuPDF 编译为 WebAssembly | ⚠️ 中等 | ⚠️ 实验性 | WASM 体积 ~30MB，加载慢，仍有字体映射问题 |
| `PDFium WASM` | Chrome PDF 引擎 WASM 版 | ⚠️ 中等 | ⚠️ 不成熟 | 主要是渲染，文本提取未完善 |
| **浏览器插件** | 调用浏览器 API 或系统工具 | ❌ 无意义 | ❌ | 插件权限仍受限，无法突破 pdf.js 的天花板 |

**关键洞察**：

> "即使是 GPT-4o 直接处理 PDF 原文件的效果，也远不如先将 PDF 转为图片再用 vision 模型处理。" — Hacker News 讨论，2025-05
>
> "传统开源工具（pdfplumber/pdfminer）的提取质量显著低于 VLM（Vision Language Model），但依赖最佳 VLM 成本高昂（GPT-4o 处理 100 万页需 $6,240）。" — olmOCR 论文 (AllenAI, 2025)

### 1.3 为什么浏览器插件不是好方案

浏览器扩展（Chrome Extension / Firefox Addon）的权限仍然**被限制在浏览器沙箱内**：

- 无法直接调用系统级 Python 脚本（Marker/MinerU）
- 无法安装原生二进制程序
- 只能使用浏览器提供的 API：
  - `chrome.tabs.captureVisibleTab`（截图）
  - 嵌入 content script 运行 JS/WASM（仍是 pdf.js 能力上限）
  - 调用外部 API（与网页直接调用没有区别）

**真正有用的"插件"**（如 Mathpix Snip）之所以效果好，是因为它们**调用云 API**（Mathpix 的服务器做 OCR），而非在浏览器本地解决。

---

## 二、三层级方案

根据效果、成本、实现复杂度，推荐以下三个层级的方案，可渐进式实施。

---

### 方案 A：增强现有提取 + Vision API 兜底（⭐ 推荐优先实施）

**核心思路**：保留现有 pdf.js 快速提取能力，对含公式的 PDF 自动切换到 Vision API 识别。

#### 2.1.1 技术架构

```
用户上传 PDF
    │
    ├─→ pdf.js 快速提取文本（<1秒）
    │       │
    │       ├─→ 质量评分 ≥ B → 直接使用文本 ✅
    │       │
    │       └─→ 质量评分 ≤ C 或 hasFormulaWarning → 触发 Vision API
    │               │
    │               ├─→ 将 PDF 每页渲染为 PNG（canvas）
    │               ├─→ 批量传给 ZCHAT Vision API（已有 gpt-5 / claude-sonnet-4-5）
    │               └─→ 返回结构化 Markdown（含 LaTeX 公式）
    │
    └─→ 合并结果 → 存入 IndexedDB → 向量化 → 知识库检索
```

#### 2.1.2 质量评分触发逻辑（已在 `pdf-extractor.ts` 中实现）

| 评级 | 条件 | 处理方式 |
|------|------|----------|
| **A** | corruptedCharRatio < 1%, 无数学字体 | 直接使用 pdf.js 文本 |
| **B** | corruptedCharRatio 1-5%, 少量数学字符 | 直接使用，附加警告 |
| **C** | corruptedCharRatio 5-15%, 有数学字体 | **用户选择**：快速模式（现有文本）或 增强模式（Vision API） |
| **D** | corruptedCharRatio 15-30%, 大量数学字体 | **默认触发 Vision API**，允许用户取消 |
| **F** | corruptedCharRatio > 30% 或 isScanned | **强制 Vision API** 或提示"请上传文本版" |

#### 2.1.3 Vision API 调用方案

利用已有的 **ZCHAT API**（`ZCHAT_API_KEY` 已配置）：

```typescript
// 伪代码
async function extractViaVision(pdfFile: File): Promise<string> {
  const pages = await renderPdfToImages(pdfFile, { dpi: 200 }) // 每页渲染为 PNG
  const chunks: string[] = []

  for (const pageImage of pages) {
    const result = await chatWithZCHATVision({
      model: 'claude-sonnet-4-5', // 或 'gpt-5'
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: pageImage.base64 },
            {
              type: 'text',
              text: `请提取这页 PDF 的全部文本内容，包括：
1. 正文文本（保持段落结构）
2. 数学公式（转换为 LaTeX 格式，用 $...$ 或 $$...$$ 包裹）
3. 表格（转换为 Markdown 表格）
4. 图表标题和说明

输出格式：纯 Markdown，不要任何解释。`
            }
          ]
        }
      ]
    })
    chunks.push(result)
  }

  return chunks.join('\n\n---\n\n')
}
```

#### 2.1.4 成本估算（ZCHAT Vision API）

| 项目 | 估算 |
|------|------|
| 单页图片大小 | ~200KB (200 DPI, 彩色 → 可压缩为灰度) |
| Vision API 成本 | 约 ¥0.01-0.03 / 页（取决于模型和压缩率） |
| 典型论文（10 页） | ¥0.10-0.30 |
| 大部头教材（300 页） | ¥3.00-9.00 |

> 注：ZCHAT 是内部聚合 API，实际价格需查最新价目表。如果成本过高，可换用 olmOCR 自建服务（见方案 C）。

#### 2.1.5 优势与局限

| 优势 | 局限 |
|------|------|
| 无需额外服务器/依赖 | Vision API 有成本（虽然不高） |
| 利用已有 ZCHAT 基础设施 | 大批量处理时可能有速率限制 |
| 公式识别准确率极高（>95%） | 需要图片渲染步骤（增加前端处理时间） |
| 可并行处理多页 | 无法处理扫描版 PDF（需 OCR + Vision） |

---

### 方案 B：PyMuPDF WASM 浏览器集成（中期优化）

**核心思路**：在浏览器中加载 PyMuPDF 的 WebAssembly 版本，作为 pdf.js 的替代/补充。

#### 2.2.1 技术可行性

- **PyMuPDF 官方文档确认**：支持 Pyodide/WASM 编译，标为 "experimental"
- **社区已有 npm 包**：`@bentopdf/pymupdf-wasm` — PyMuPDF 的 WASM 编译版本
- PyMuPDF 的文本提取质量**显著优于 pdf.js**：
  - 直接操作 PDF 内部对象流，不依赖浏览器字体渲染
  - 支持更复杂的字体解码逻辑
  - 可以提取原始字符编码并尝试多种映射策略

#### 2.2.2 实现方式

```typescript
// 动态加载 WASM（按需，不阻塞首屏）
async function extractWithPyMuPDF(file: File): Promise<string> {
  const pyodide = await loadPyodide()
  await pyodide.loadPackage('@bentopdf/pymupdf-wasm')

  const arrayBuffer = await file.arrayBuffer()
  pyodide.FS.writeFile('/input.pdf', new Uint8Array(arrayBuffer))

  const code = `
    import fitz  # PyMuPDF
    doc = fitz.open('/input.pdf')
    text = []
    for page in doc:
        text.append(page.get_text())
    '\n'.join(text)
  `

  return pyodide.runPython(code)
}
```

#### 2.2.3 WASM 体积与性能

| 指标 | 数值 |
|------|------|
| Pyodide 运行时 | ~8-10 MB |
| PyMuPDF WASM 包 | ~15-20 MB |
| 总首次加载 | ~25-30 MB（gzip 后 ~8-10 MB） |
| 加载时间 | 宽带 10-30 秒，首次使用需等待 |
| 解析速度 | 10 页论文 ~2-5 秒 |

> **策略**：只在检测到 pdf.js 提取质量差时（grade C/D/F）才动态加载 PyMuPDF WASM，避免影响正常用户。

#### 2.2.4 优势与局限

| 优势 | 局限 |
|------|------|
| 纯浏览器端，无 API 成本 | WASM 体积大，首次加载慢 |
| PyMuPDF 提取质量优于 pdf.js | 对缺少 ToUnicode 的公式仍可能乱码 |
| 无需后端服务 | 实验性支持，可能有兼容性问题 |
| 可离线使用 | 移动端/慢网用户体验差 |

---

### 方案 C：后端 olmOCR/Marker 服务（长期最佳）

**核心思路**：在服务器部署专门的 PDF 解析服务，通过 API 供前端调用。

#### 2.3.1 候选方案对比

| 工具 | 技术栈 | 模型大小 | 硬件需求 | 公式支持 | 速度 | 成本 |
|------|--------|----------|----------|----------|------|------|
| **olmOCR** | Qwen2.5-VL-7B 微调 | 7B | GPU 推荐（8GB+ VRAM） | ✅ LaTeX | ~1-2 页/秒 | 开源免费 |
| **Marker** | 轻量模型 + 规则 + LLM 辅助 | ~1-2GB | CPU 即可 | ✅ LaTeX | ~10-20 页/秒 | 开源免费 |
| **MinerU** | Layout 检测 + OCR + 多模型 | ~2-3GB | CPU/GPU | ✅ LaTeX | ~5-10 页/秒 | 开源免费 |
| **Docling** | IBM 开源，多阶段 pipeline | ~1-2GB | CPU/GPU | ⚠️ 一般 | ~5-10 页/秒 | 开源免费 |

#### 2.3.2 推荐：Marker（最佳性价比）

Marker 是当前学术 PDF 提取的最佳开源选择：

```bash
# 服务器部署（Python 3.10+）
pip install marker-pdf

# 单文件转换
marker_single input.pdf --output_dir ./output
# 输出：output/input.md（含 LaTeX 公式、表格、图片引用）
```

**部署为 API 服务**：

```python
# marker-api.py（Flask/FastAPI）
from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered
import tempfile
import os

converter = PdfConverter(artifact_dict=create_model_dict())

@app.post("/extract")
async def extract_pdf(file: UploadFile):
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(await file.read())
        rendered = converter(tmp.name)
        text, _, images = text_from_rendered(rendered)
        os.unlink(tmp.name)
        return {"markdown": text, "images": images}
```

#### 2.3.3 olmOCR（效果最佳，需 GPU）

如果需要**最高质量**的提取（特别是扫描版 PDF、手写公式、复杂表格）：

```bash
# 安装（需 CUDA GPU）
pip install olmocr

# 本地运行
python -m olmocr.pipeline ./output --pdfs input.pdf
```

- 输出包含 Markdown 结构 + LaTeX 公式 + HTML 表格
- 支持 batch 处理，适合大批量文献
- 7B 模型在 RTX 4090 上约 2-5 页/秒

#### 2.3.4 服务器资源评估

当前服务器：`10.72.212.33`，用户 `zju321`

| 方案 | 内存需求 | GPU 需求 | 部署复杂度 |
|------|----------|----------|-----------|
| Marker CPU | 4-8 GB | 无 | 低（pip install） |
| olmOCR GPU | 16 GB | 8GB+ VRAM | 中（需 CUDA 环境） |
| olmOCR CPU | 16 GB | 无（极慢） | 中 |

**建议**：先部署 Marker CPU 版本作为默认服务，olmOCR 作为可选升级。

---

## 三、综合推荐实施路线

### Phase 1：立即实施（本周）— 方案 A（Vision API 兜底）

**改动点**：

1. **PDF 上传流程增强**：
   - 上传后先用 pdf.js 提取 + 质量评分（已有）
   - 若 grade ≤ C，弹出选择框：「检测到复杂公式，建议使用增强提取（调用 Vision API，约 ¥0.02/页）」

2. **实现 `extractViaVision`**：
   - PDF → Canvas 渲染（`pdfjs-dist` 的 `render()` API）
   - Canvas → PNG base64
   - 调用 `chatWithZCHATVision` 批量处理

3. **结果合并**：
   - Vision API 返回的 Markdown 直接替代 pdf.js 文本
   - 存入 IndexedDB 的 `Document` 记录中

**预期效果**：用户上传含公式的 PDF 时，可选择获得高质量的 Markdown + LaTeX 输出。

### Phase 2：短期优化（2-4 周）— 方案 B（PyMuPDF WASM 补充）

**改动点**：

1. 引入 `@bentopdf/pymupdf-wasm`（动态加载）
2. 在 grade C/D 时，先尝试 PyMuPDF WASM 提取
3. 若 PyMuPDF 结果质量仍差（corruptedCharRatio > 5%），再降级到 Vision API
4. 给用户三个选项：「快速提取（免费）」「增强提取（WASM，免费但慢）」「AI 识别（Vision API，精准但付费）」

### Phase 3：长期建设（按需）— 方案 C（后端 Marker 服务）

**改动点**：

1. 在服务器安装 Marker：`pip install marker-pdf`
2. 新增 API 路由：`POST /api/v1/knowledge/extract-pdf`
3. 前端上传 PDF → 后端 Marker 解析 → 返回 Markdown
4. 与现有知识库流程无缝衔接

**部署命令**：

```bash
ssh ZJU-MSE-HPC
cd ~/scholars

# 创建 Python venv
python3 -m venv venv-marker
source venv-marker/bin/activate

# 安装 Marker
pip install marker-pdf

# 测试
marker_single test.pdf --output_dir ./test_output
```

---

## 四、方案对比总表

| 维度 | 方案 A (Vision API) | 方案 B (PyMuPDF WASM) | 方案 C (Marker 后端) |
|------|---------------------|----------------------|---------------------|
| **公式准确率** | ⭐⭐⭐⭐⭐ (>95%) | ⭐⭐⭐ (~70-80%) | ⭐⭐⭐⭐⭐ (>95%) |
| **实现复杂度** | 低 | 中 | 中 |
| **用户成本** | 低（¥0.01-0.03/页） | 无 | 无 |
| **服务器成本** | 无 | 无 | 低（CPU 即可） |
| **首次加载时间** | 无额外加载 | 慢（~10-30s 下载 WASM） | 无 |
| **离线可用** | ❌ | ✅ | ❌ |
| **扫描版 PDF** | ✅（Vision 自带 OCR） | ❌ | ⚠️（Marker 对扫描版支持有限） |
| **隐私保护** | 图片上传至 ZCHAT API | ✅ 完全本地 | ✅ 本地服务器 |

---

## 五、浏览器插件方案专门评估

### 为什么不推荐开发浏览器插件

| 问题 | 说明 |
|------|------|
| **权限天花板** | 扩展无法调用系统级工具，也无法突破浏览器沙箱 |
| **用户门槛** | 需要用户手动安装、授予权限，流失率高 |
| **维护成本** | Chrome/Firefox 商店审核、版本兼容性、Manifest V3 限制 |
| **无差异化** | 扩展能做的，网页端同样能做（Web API + WASM） |
| **唯一优势场景** | 在**其他网站**（如 arXiv、Google Scholar）浏览 PDF 时一键提取 → 这需要完全不同的产品形态 |

### 如果真的要做插件

唯一有意义的场景：一个独立的**学术 PDF 助手插件**，用户在任意网页看到 PDF 链接时，点击插件按钮：
1. 下载 PDF
2. 发送到 Scholar's Tea 知识库
3. 同时提取文本/公式存入个人库

但这需要：
- Chrome Web Store 开发者账号 + 审核（2-4 周）
- 独立的插件代码仓库
- 与主站的 OAuth 认证打通

**ROI 评估**：用户量 < 100 人时不值得投入。

---

## 六、建议的下一步行动

1. **本周内**：实施方案 A（Vision API 兜底）
   - 修改 `pdf-extractor.ts` 的上传流程
   - 添加 PDF → Canvas → PNG 渲染逻辑
   - 集成 `chatWithZCHATVision` 调用
   - 测试 3-5 篇含公式的论文

2. **监控指标**：
   - Vision API 调用成功率
   - 平均处理时间（页/秒）
   - 单页成本（ZCHAT 账单）

3. **如果 Vision API 成本可接受**：方案 A 即为最终方案，无需后续投入

4. **如果 Vision API 成本过高**：部署方案 C（Marker 后端服务），将成本从 API 调用转移到服务器算力

---

## 附录：参考资源

- [olmOCR 论文](https://arxiv.org/abs/2502.18443) — AllenAI, 2025
- [olmOCR 2 博客](https://allenai.org/blog/olmocr-2) — Qwen2.5-VL-7B 微调
- [Marker GitHub](https://github.com/VikParuchuri/marker) — 开源 PDF 转 Markdown
- [MinerU GitHub](https://github.com/opendatalab/MinerU) — 字节跳动开源
- [PyMuPDF Pyodide 文档](https://pymupdf.readthedocs.io/en/latest/pyodide.html)
- [PDF to Text: A Challenging Problem](https://news.ycombinator.com/item?id=43973721) — HN 讨论
- [Best Open Source PDF to Markdown Tools 2026](https://jimmysong.io/blog/pdf-to-markdown-open-source-deep-dive)
