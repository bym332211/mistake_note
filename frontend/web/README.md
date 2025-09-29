# mistake_note Frontend (F-UPLOAD MVP)

前端子项目基于 React + TypeScript + Vite，聚焦「题目上传（F-UPLOAD）」流程：

- 支持拖拽/点击选择 JPG、PNG 题目图片并校验文件体积（≤10MB）
- 直接调用 `/upload/image` API，展示上传进度与「解析中」状态
- 成功/失败路径提供 Toast 提示与错误兜底，可重试
- 解析结果以卡片化 UI 呈现（按题型分组、展示正确性与点评），可按需展开原始 JSON

## 环境准备

- Node.js 18+（推荐 22 LTS，与根项目保持一致）
- npm 已随 Node 安装，无需额外配置

## 快速开始

```bash
cd frontend/web
npm install            # 首次执行安装依赖

# 启动本地开发（默认 http://localhost:5173）
npm run dev

# 构建 + 类型检查
npm run build
```

> ⚠️ 在运行前请确认后端 FastAPI 已启动（默认  http://localhost:8001 ），或通过下方环境变量调整。

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | BFF / FastAPI 根地址 | `http://localhost:8001` |

本地可在 `frontend/web/.env.local` 中覆盖：

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8001
```

## 目录概览

```
frontend/web/
├─ src/
│  ├─ components/        # Upload 组件（拖拽区、状态面板等）
│  ├─ layouts/           # 全局布局与面包屑导航
│  ├─ lib/               # axios 实例等通用工具
│  ├─ pages/upload/      # F-UPLOAD 页面逻辑与样式
│  └─ types/             # 与后端接口对齐的类型声明
└─ package.json          # 脚本与依赖
```

## 后续 TODO

- 真机/移动端适配验证（完成标准-3）
- 与详情页、练习页打通导航（依赖其它模块）
- 接入更完善的错误日志与埋点（Sentry/自研）

如需扩展其它功能模块（F-DETAIL、F-PRACTICE 等），可复用当前布局与主题变量，新增路由与页面即可。
