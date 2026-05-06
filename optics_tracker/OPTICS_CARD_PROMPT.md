# 光学论文追踪 - 卡片生成指南

## 触发指令

在 Daily 群发送以下指令时触发：
- "追踪光学最新进展"
- "今日光学速递"
- "光学领域日报"
- "推送光学卡片"

## 8 大领域

| 领域ID | 中文名 | 英文名 | 图标 |
|--------|--------|--------|------|
| ultrafast_optics | 超快光学 | Ultrafast Optics | ⚡ |
| metamaterial_optics | 超材料光学 | Metamaterial Optics | 🧱 |
| nearfield_optics | 近场光学 | Near-field Optics | 🔎 |
| laser_processing | 激光加工 | Laser Micro-fabrication | 🔥 |
| nonlinear_optics | 非线性光学 | Nonlinear Optics | 🌊 |
| photonic_integration | 光子集成 | Photonic Integration | 💎 |
| quantum_optics | 量子光学 | Quantum Optics | 🔐 |
| biophotonics | 生物光子学 | Biomedical Photonics | 🏥 |

## 核心关键词

```
超快光学: ultrafast optics, femtosecond, attosecond, pulse shaping, HHG, frequency comb
超材料光学: metamaterial, metasurface, plasmonic, nanophotonics
近场光学: NSOM, SNOM, near-field, evanescent, scanning probe
激光加工: laser processing, laser machining, laser microfabrication, laser ablation
非线性光学: nonlinear optics, SHG, OPO, four-wave mixing, Raman
光子集成: photonic integrated, silicon photonics, waveguide, photonic crystal
量子光学: quantum optics, quantum computing, single photon, quantum communication
生物光子学: biophotonics, biomedical imaging, biosensing, phototherapy
```

## 搜索脚本

在服务器上执行：
```bash
python3 /data/home/zju321/.hermes/skills/optics-research-tracker/optics_tracker_v2.py --feishu --template --days 90
```

## 卡片模板

飞书子卡片模板 ID: `AAqejTzWm5upF`

发送时使用 `msg_type: interactive`，content 格式：
```json
{
  "type": "template",
  "data": {
    "template_id": "AAqejTzWm5upF",
    "template_variable": {
      "category_name": "⚡ 超快光学",
      "category_name_en": "Ultrafast Optics",
      "paper_count": "5",
      "paper_list": "1. 论文标题...\n   作者\n   arXiv: xxxx\n\n2. ...",
      "update_time": "2026-04-17 12:00"
    }
  }
}
```

## 发送目标

推送到超快茶话会: `oc_6172e7ce838d85f4928d6ee707203b60`

## 质量标准

- 每个领域最多 5 篇
- 优先最新发表的论文
- 按日期降序排列
