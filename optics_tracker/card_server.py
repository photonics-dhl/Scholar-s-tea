#!/usr/bin/env python3
"""子卡片 Web 服务 - 为飞书 webview 提供展开内容"""
import os
import json
import hashlib
from flask import Flask, request, abort, jsonify
from werkzeug.serving import make_server
import threading

app = Flask(__name__)

# 卡片数据缓存目录
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "card_data")
os.makedirs(DATA_DIR, exist_ok=True)

# 基础 HTML 模板
HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         background: #f5f5f5; padding: 12px; }}
  .paper-card {{ background: white; border-radius: 10px; padding: 16px; margin-bottom: 12px;
                 box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
  .paper-title {{ font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px;
                  line-height: 1.4; }}
  .paper-meta {{ font-size: 12px; color: #888; margin-bottom: 10px; }}
  .paper-meta span {{ margin-right: 12px; }}
  .dim-label {{ font-size: 12px; font-weight: 600; color: #555; margin: 10px 0 4px; }}
  .dim-content {{ font-size: 13px; color: #333; line-height: 1.6; margin-bottom: 8px;
                  background: #f8f9fa; padding: 8px 10px; border-radius: 6px; }}
  .trend {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border-radius: 8px; padding: 12px; margin-top: 10px; }}
  .trend-label {{ font-size: 12px; opacity: 0.9; margin-bottom: 4px; }}
  .trend-content {{ font-size: 13px; line-height: 1.5; }}
  .arxivid {{ font-size: 11px; color: #999; margin-top: 8px; }}
  .header {{ text-align: center; padding: 12px 0 8px; color: #1a1a1a; font-size: 16px;
              font-weight: 600; border-bottom: 2px solid #667eea; margin-bottom: 12px; }}
  .header span {{ color: #667eea; }}
</style>
</head>
<body>
<div class="header">📬 光学领域每日速递 · <span>{domain_name}</span></div>
{content}
</body>
</html>"""


def get_paper_key(arxiv_id, pubmed_id=""):
    """生成论文唯一键"""
    key = arxiv_id or pubmed_id
    return hashlib.md5(key.encode()).hexdigest()[:8]


def load_category_data(category_id):
    """从 JSON 文件加载领域数据"""
    filepath = os.path.join(DATA_DIR, f"{category_id}.json")
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def render_paper_card(paper, analysis, domain_name):
    """渲染单篇论文卡片"""
    arxiv_id = paper.get("arxiv_id", "")
    pubmed_id = paper.get("pubmed_id", "")
    url = paper.get("url", f"https://arxiv.org/abs/{arxiv_id}") if arxiv_id else paper.get("url", "")

    # 各维度分析
    dims = [
        ("🔍 一句话概括", analysis.get("summary", "暂无分析")),
        ("🧠 研究思路", analysis.get("research思路", analysis.get("research", ""))),
        ("🧪 实验方案", analysis.get("experiment", "暂无")),
        ("💡 创新点", analysis.get("innovation", "暂无")),
        ("📚 关联工作", analysis.get("related_work", "暂无")),
        ("⭐ 评价", analysis.get("impact", "暂无")),
    ]

    dim_html = ""
    for label, content in dims:
        if content:
            dim_html += f'<div class="dim-label">{label}</div><div class="dim-content">{content}</div>'

    # 趋势（取 summary 的第一条作为趋势参考）
    trend = analysis.get("related_work", "")
    trend_html = ""
    if trend:
        trend_html = f'''<div class="trend">
        <div class="trend-label">📈 领域趋势</div>
        <div class="trend-content">{trend[:200]}</div>
        </div>'''

    authors = ", ".join(paper.get("authors", [])[:3])
    citations = paper.get("citations", 0)
    published = paper.get("published", "")

    return f"""
<div class="paper-card">
  <div class="paper-title">{paper.get('title', '未知标题')}</div>
  <div class="paper-meta">
    <span>👤 {authors}</span>
    <span>📅 {published}</span>
    <span>📖 引用 {citations}</span>
  </div>
  {dim_html}
  <div class="arxivid">🔗 <a href="{url}" target="_blank">{url[:60]}{'...' if len(url)>60 else ''}</a></div>
</div>
"""


@app.route("/card/<category_id>")
def show_card(category_id):
    """返回子卡片 HTML"""
    data = load_category_data(category_id)
    if data is None:
        abort(404)

    domain_name = data.get("domain_name", category_id)
    papers = data.get("papers", [])

    content = ""
    for paper in papers[:3]:  # 最多3篇
        analysis = paper.get("analysis", {})
        content += render_paper_card(paper, analysis, domain_name)

    html = HTML_TEMPLATE.format(
        title=f"领域详情 | {domain_name}",
        domain_name=domain_name,
        content=content
    )
    return html


@app.route("/open")
def open_card():
    """飞书卡片 deep-link 入口，返回卡片 JSON 内容"""
    msg_id = request.args.get("msg_id", "")
    app_id = request.args.get("app_id", "")
    if not msg_id:
        abort(400, description="msg_id required")

    # 从 card_data 目录查找该 msg_id 对应的卡片数据
    # 子卡片的 message_id 作为文件名缓存
    import glob
    # 遍历 card_data/*.json 找到 message_id 匹配的文件
    for filepath in glob.glob(os.path.join(DATA_DIR, "*.json")):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        if data.get("message_id") == msg_id:
            # 返回飞书期望的卡片内容格式
            return jsonify({
                "content": json.dumps(data.get("card", {}), ensure_ascii=False)
            })

    # fallback: 尝试从 ngrok 访问本地 card server
    abort(404, description="Card not found")


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/save/<category_id>", methods=["POST"])
def save_data(category_id):
    """接收主程序推送的卡片数据（内部接口）"""
    try:
        payload = request.get_json()
        filepath = os.path.join(DATA_DIR, f"{category_id}.json")
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        return jsonify({"status": "saved"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


def start_server(port=5000):
    """启动 Flask 服务"""
    server = make_server("127.0.0.1", port, app, threaded=True)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


if __name__ == "__main__":
    print("Starting card server on http://127.0.0.1:5000 ...")
    start_server(5000)
    import time
    while True:
        time.sleep(3600)
