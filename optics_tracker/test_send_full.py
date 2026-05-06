#!/usr/bin/env python3
"""完整测试：发送主卡片（含折叠展开）+ 子卡片到飞书群"""
import sys
sys.path.insert(0, '/data/home/zju321/321/DHL/Scholar\'s_Tea/optics_tracker')
import os
from dotenv import load_dotenv
load_dotenv('/data/home/zju321/321/DHL/Scholar\'s_Tea/.env')

from optics_tracker_v2 import OpticsClassifier, FeishuCardSender

def test():
    classifier = OpticsClassifier()
    feishu = FeishuCardSender()
    
    # 模拟8个领域的论文数据（含完整6维度analysis）
    all_papers = {
        "ultrafast_optics": [
            {
                "title": "Attosecond physics meets nanophotonics",
                "arxiv_id": "2401.00001", "authors": ["Zhang Wei", "Li Ming"],
                "citations": 42, "venue": "Nature Physics", "source": "arxiv",
                "abstract": "We report on the generation of attosecond pulses from nanostructured targets.",
                "analysis": {
                    "summary": "首次将阿秒脉冲产生与纳米结构结合，实现跨学科突破",
                    "research思路": "利用纳米光栅增强驱动激光场，通过相位匹配实现高次谐波产生",
                    "experiment": "使用中红外激光驱动纳米靶，配合光栅结构增强场",
                    "innovation": "将阿秒物理从原子尺度拓展到纳米尺度，突破传统瓶颈",
                    "related_work": "参考Huang等人的纳米增强方案和Krausz的阿秒产生工作",
                    "impact": "为阿秒科学开辟新方向，对超快成像有重要价值"
                }
            },
            {
                "title": "High-harmonic generation in monolayer WSe2",
                "arxiv_id": "2401.00002", "authors": ["Chen Fang"],
                "citations": 28, "venue": "Science", "source": "arxiv",
                "abstract": "We demonstrate high-harmonic generation in monolayer WSe2 with strong valley polarization.",
                "analysis": {
                    "summary": "在单层WSe2中实现高次谐波产生，揭示二维材料电子动力学",
                    "research思路": "利用谷极化增强非线性响应，通过超快泵浦探测研究电子动力学",
                    "experiment": "使用圆偏振光泵浦单层WSe2，测量高次谐波信号",
                    "innovation": "首次在二维半导体中观测到高次谐波，揭示谷相干动力学",
                    "related_work": "基于Liu等人的二维材料研究扩展",
                    "impact": "推动二维材料超快光学发展，为新型光电探测器奠定基础"
                }
            }
        ],
        "metamaterial_optics": [
            {
                "title": "Metasurface for full-color holographic display",
                "arxiv_id": "2401.00003", "authors": ["Wang Lei", "Zhao Xia"],
                "citations": 35, "venue": "Nature Photonics", "source": "arxiv",
                "abstract": "We demonstrate a metasurface-based holographic display achieving full-color reconstruction.",
                "analysis": {
                    "summary": "超表面实现全彩全息显示，突破色彩串扰难题",
                    "research思路": "设计多波长共振超原子单元，通过相位调控实现三原色独立调制",
                    "experiment": "制备纳米柱阵列超表面，测试红绿蓝三色全息成像质量",
                    "innovation": "提出振幅-相位联合调控策略，解决色差与串扰问题",
                    "related_work": "延续Minovich团队的超表面全息工作",
                    "impact": "为AR/VR显示提供新技术路径"
                }
            }
        ],
        "nearfield_optics": [],
        "laser_processing": [],
        "nonlinear_optics": [],
        "nanophotonics": [],
        "biophotonics": [],
        "quantum_optics": []
    }
    
    category_summaries = {}
    for cat_id in classifier.categories.keys():
        category_summaries[cat_id] = {"papers": all_papers.get(cat_id, [])}
    
    # 构建主卡片
    print("=== 构建主卡片（含折叠展开）===")
    main_card = feishu._build_main_card_json(category_summaries, classifier)
    body_elem_count = len(main_card["body"]["elements"])
    collapsible_count = sum(
        1 for elem in main_card["body"]["elements"]
        if elem.get("tag") == "column_set"
        for col in elem.get("columns", [])
        for ce in col.get("elements", [])
        for e in ce.get("elements", [])
        for inner in e.get("elements", [])
        if inner.get("tag") == "collapsible_panel"
    )
    button_count = sum(
        1 for elem in main_card["body"]["elements"]
        if elem.get("tag") == "column_set"
        for col in elem.get("columns", [])
        for ce in col.get("elements", [])
        for e in ce.get("elements", [])
        for inner in e.get("elements", [])
        if inner.get("tag") == "button"
    )
    print(f"主卡片: {body_elem_count}个body元素, {collapsible_count}个折叠面板, {button_count}个查看详情按钮")
    
    # 发送主卡片
    print("\n=== 发送主卡片到飞书群 ===")
    success = feishu.send_card(main_card)
    if success:
        print("✓ 主卡片发送成功！")
    else:
        print("✗ 主卡片发送失败")
    
    # 发送子卡片（超快光学 + 超材料）
    for cat_id in ["ultrafast_optics", "metamaterial_optics"]:
        papers = all_papers.get(cat_id, [])
        if papers:
            cat = classifier.categories.get(cat_id, {})
            print(f"\n=== 发送子卡片: {cat.get('name')} ({len(papers)}篇) ===")
            ok = feishu.send_sub_card(cat_id, papers, classifier)
            print(f"✓ 子卡片发送{'成功' if ok else '失败'}")

if __name__ == "__main__":
    test()
