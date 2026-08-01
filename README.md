# 智能题库管理系统前端

基于 Nuxt 3、Vue 3 和 Pinia 开发的智能题库与自动组卷系统前端。

## 主要功能

- 用户登录与身份状态管理
- 管理员、教师和普通用户权限控制
- 课程、章节和知识点管理
- 试题创建、批量导入、搜索与编辑
- LaTeX 数学公式预览
- 试题版本历史与恢复
- 智能组卷与难度梯度配置
- 试卷详情与双栏预览
- Word、PDF学生卷和答案卷下载
- 用户管理
- 操作审计日志查询

## 技术栈

- Nuxt 3
- Vue 3
- TypeScript
- Pinia
- KaTeX
- npm

## 环境准备

需要安装：

- Node.js
- npm
- Git

推荐使用 Node.js LTS 版本。

## 安装依赖

~~~powershell
cd D:\smart-exam-frontend
npm install
~~~

## 环境变量

在项目根目录创建 `.env` 文件：

~~~env
NUXT_PUBLIC_API_BASE=http://127.0.0.1:8000
~~~

正式部署时应替换为实际后端 HTTPS 地址。

## 启动开发服务器

~~~powershell
npm run dev -- --host 127.0.0.1
~~~

默认访问地址：

~~~text
http://127.0.0.1:3000
~~~

后端必须同时运行在：

~~~text
http://127.0.0.1:8000
~~~

## 页面说明

| 页面 | 路径 |
|---|---|
| 系统概览 | `/` |
| 登录 | `/login` |
| 课程管理 | `/courses` |
| 章节管理 | `/chapters` |
| 知识点管理 | `/knowledge-points` |
| 试题管理 | `/questions` |
| 智能组卷 | `/papers` |
| 用户管理 | `/users` |
| 操作日志 | `/audit-logs` |
| 无权限提示 | `/forbidden` |

## 权限说明

| 功能 | 管理员 | 教师 | 普通用户 |
|---|---:|---:|---:|
| 查看题库 | 允许 | 允许 | 允许 |
| 管理题库 | 允许 | 允许 | 禁止 |
| 智能组卷 | 允许 | 允许 | 禁止 |
| 用户管理 | 允许 | 禁止 | 禁止 |
| 操作日志 | 允许 | 禁止 | 禁止 |

## 登录认证

登录成功后，访问令牌保存在：

~~~text
smart_exam_token
~~~

所有受保护接口应通过 `useApi()` 请求，以自动携带：

~~~text
Authorization: Bearer <token>
~~~

不要在受保护页面直接使用不带认证的 `useFetch()` 或 `$fetch()`。

## 类型检查

~~~powershell
npx nuxi typecheck
~~~

正常结果应显示：

~~~text
Type check passed
~~~

## 生产构建

~~~powershell
npm run build
~~~

本地预览生产构建：

~~~powershell
npm run preview
~~~

## 常见问题

### 接口返回401

退出系统并重新登录，检查请求是否通过 `useApi()` 发出。

### 接口返回403

当前用户没有该操作权限，应使用教师或管理员账号。

### 数学公式不显示

确认已安装 KaTeX：

~~~powershell
npm install katex
~~~

### 后端无法连接

确认后端和数据库已经启动：

~~~text
后端：http://127.0.0.1:8000
前端：http://127.0.0.1:3000
~~~

## 代码检查与提交

~~~powershell
npx nuxi typecheck
git diff --check
git status
git add <需要提交的文件>
git commit -m "提交说明"
git push
~~~

## 当前版本

~~~text
v0.1.0
~~~