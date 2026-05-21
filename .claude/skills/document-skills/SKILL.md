---
name: document-skills
description: |
  文档处理技能集。用于处理 Word (docx)、PDF、PowerPoint (pptx)、Excel (xlsx) 等办公文档。
  当用户需要创建、编辑、分析文档时触发。
tags:
  - documents
  - office
  - docx
  - pdf
  - pptx
  - xlsx
---

# Document Skills

## 通用原则

1. **字体**: 专业字体 (Arial, Times New Roman, Calibri)
2. **模板**: 编辑现有文件时保留原有格式
3. **验证**: 创建后必须验证输出

---

## DOCX (Word)

使用 `docx-js` (`npm install -g docx`)

- **页面**: 显式设置大小 (docx-js 默认非 A4)
- **列表**: 使用 `LevelFormat.BULLET`，不用 unicode 符号
- **表格**: 双重宽度设置 (`columnWidths` + cell `width`)
- **图片**: 必须指定 `type` 参数

```javascript
const { Document, Packer, Paragraph, TextRun } = require('docx');
const doc = new Document({
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    children: [new Paragraph({ children: [new TextRun({ text: "Hello", font: "Arial", size: 24 })] })]
  }]
});
Packer.toBuffer(doc).then(buffer => fs.writeFileSync("doc.docx", buffer));
```

**编辑现有文档**: 解压 → 编辑 XML → 打包 (`scripts/office/unpack.py` / `pack.py`)

---

## PDF

| 库/工具 | 用途 |
|---------|------|
| **pypdf** | 合并、分割、旋转、提取元数据 |
| **pdfplumber** | 文本和表格提取 |
| **pdftotext** | 提取文本 |
| **qpdf** | 合并、分割、旋转 |

```bash
pdftotext document.pdf output.txt
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf
```

```python
import pdfplumber
with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
```

> 使用 `<sub>` / `<super>` 标签代替 Unicode 下标/上标。

---

## PPTX (PowerPoint)

使用 `pptxgenjs` (`npm install -g pptxgenjs`)

- **配色**: 选主题相关方案，避免默认蓝
- **字体**: 标题用 Georgia/Arial Black，正文用 Calibri
- **布局**: 每页必须有视觉元素
- **边距**: 保持 0.5" 最小边距

| 元素 | 大小 |
|------|------|
| 标题 | 36–44pt |
| 章节标题 | 20–24pt |
| 正文 | 14–16pt |
| 注释 | 10–12pt |

```bash
python -m markitdown presentation.pptx        # 读取内容
soffice --headless --convert-to pdf input.pptx # 转 PDF
pdftoppm -jpeg -r 150 output.pdf slide        # 转图片
```

---

## XLSX (Excel)

使用 `openpyxl` / `pandas`

**必须使用公式，禁止硬编码计算值**:
```python
# ❌ sheet['B10'] = 5000
# ✅ sheet['B10'] = '=SUM(A1:A10)'
```

| 颜色 | 含义 |
|------|------|
| 蓝色文本 (0,0,255) | 硬编码输入值 |
| 黑色文本 (0,0,0) | 公式和计算 |
| 绿色文本 (0,128,0) | 同工作表链接 |
| 红色文本 (255,0,0) | 外部文件链接 |
| 黄色背景 (255,255,0) | 需关注的假设 |

**数字格式**: 年份→文本 "2024"；货币→$#,##0；零值→"-"；百分比→0.0%

**公式验证**: 保存后运行 `python scripts/recalc.py output.xlsx`，检查 `#REF!` / `#DIV/0!` / `#VALUE!` / `#NAME?`

---

## 依赖汇总

- pandoc, docx (npm), pptxgenjs (npm)
- pypdf, pdfplumber, openpyxl, pandas
- LibreOffice, Poppler, Pillow, markitdown
