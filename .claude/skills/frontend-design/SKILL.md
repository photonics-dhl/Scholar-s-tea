---
name: frontend-design
description: |
  前端界面设计技能。创建独特、有辨识度的生产级前端界面。
  当用户要求设计网页、创建 UI 组件、进行前端开发时触发。
  强调大胆的美学方向、独特的排版选择、精细的视觉细节和动效。
tags:
  - frontend
  - ui
  - design
  - react
  - tailwind
---

# Frontend Design Skill

创建独特、生产级的前端界面。

## 核心原则

### 1. 大胆的美学方向

不要泛泛的设计。选择一个明确的美学方向：

| 方向 | 特点 |
|------|------|
| **Midnight Dark** | 深色背景 + 高对比度强调色 |
| **Glass Morphism** | 毛玻璃效果 + 渐变 |
| **Brutalist** | 粗犷的排版 + 原始的色彩 |
| **Ethereal Light** | 柔和渐变 + 精致动效 |

### 2. 字体选择

避免 Generic Fonts。推荐：

**标题字体**:
- Space Grotesk
- Clash Display
- Arial Black (系统)

**正文字体**:
- Inter
- Satoshi
- system-ui

### 3. 动效设计

```css
/* 入场动画 */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 悬停效果 */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
```

## 技术栈

- **框架**: React 18+ / Next.js 14+
- **样式**: Tailwind CSS
- **组件**: shadcn/ui
- **动画**: Framer Motion
- **图标**: Lucide React

## 工作流程

1. **分析需求**: 理解功能和数据结构
2. **确定美学方向**: 选择配色、字体、动效
3. **组件规划**: 复用 vs 新建
4. **实现**: 响应式、移动优先
5. **动效**: 添加适当的过渡动画
6. **验证**: Lighthouse 性能检查

## 常用组件模式

### 卡片

```tsx
<div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-100 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-black/5">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
  {/* Content */}
</div>
```

### 按钮

```tsx
<button className="relative overflow-hidden rounded-full bg-black px-6 py-3 text-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 active:scale-95">
  <span className="relative z-10">Click me</span>
</button>
```

## 性能目标

| 指标 | 目标 |
|------|------|
| Lighthouse | ≥ 90 |
| FCP | < 1.5s |
| LCP | < 2.5s |
| TTI | < 3s |

## 触发场景

- "设计一个落地页"
- "创建用户资料页面"
- "做登录界面"
- "设计仪表盘"
- "实现深色模式"
