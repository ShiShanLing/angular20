# AI Agent 全栈开发学习路线（2026）

> 目标：从具备编程基础成长为能够独立开发、部署 AI Agent
> 产品的全栈工程师。

------------------------------------------------------------------------

# 第一阶段：编程基础（2～4 周）

## 学习目标

建立 Python、Git 和 Linux 基础。

## Python（重点）

学习内容：

-   基本语法
-   面向对象（OOP）
-   asyncio
-   requests
-   typing
-   pydantic
-   uv

练习项目：

-   Todo API
-   调用 OpenAI API
-   读取与处理 JSON

## Git

掌握：

-   clone
-   commit
-   branch
-   merge
-   pull request

## Linux

掌握：

-   SSH
-   Docker 基础
-   常用命令

------------------------------------------------------------------------

# 第二阶段：Web 全栈（4～6 周）

## 前端

技术栈：

-   React
-   Next.js
-   Tailwind CSS
-   shadcn/ui

学习内容：

-   React Hooks
-   State Management
-   API 调用
-   Chat UI

项目：

> ChatGPT 页面

## 后端

推荐：

-   FastAPI

学习：

-   REST API
-   JWT
-   OAuth
-   文件上传
-   WebSocket

项目：

> 聊天 API

## 数据库

推荐：

-   PostgreSQL
-   SQLAlchemy
-   Alembic

完成后应具备：

``` text
React
    ↓
FastAPI
    ↓
PostgreSQL
```

------------------------------------------------------------------------

# 第三阶段：LLM 基础（2～3 周）

学习：

-   OpenAI Responses API
-   Streaming
-   Structured Output
-   Function Calling

项目：

> ChatGPT Clone

功能：

-   多轮聊天
-   Markdown
-   Code Block
-   Streaming

------------------------------------------------------------------------

------------------------------------------------------------------------

# ⭐ 推荐实践项目：GitHub Hello Agent（官方入门）

在完成 **第三阶段（LLM 基础）** 后，建议优先完成 GitHub 上的 **Hello
Agent** 官方示例项目，作为进入 AI Agent 开发的第一步。

## 学习目标

通过官方示例理解一个 AI Agent 的基本组成：

-   Agent 的生命周期
-   Prompt 的组织方式
-   Tool Calling（工具调用）
-   Memory（记忆）
-   多轮对话
-   Agent 与 LLM 的协作流程

## 建议完成内容

-   成功运行 Hello Agent
-   阅读项目源码，理解整体架构
-   修改 Prompt，使 Agent 具备新的行为
-   新增一个自定义 Tool（例如天气查询、计算器等）
-   将项目部署到 GitHub，并记录学习笔记

## 学习建议

不要只是运行示例，而是尝试：

1.  阅读每个模块的职责。
2.  为 Agent 添加新的工具。
3.  修改系统 Prompt。
4.  增加简单的 Memory 功能。
5.  将 Hello Agent 改造成属于自己的 AI Assistant。

完成这个项目后，再继续学习 MCP、RAG、Workflow、Multi-Agent
等内容，会更容易理解整个 AI Agent 技术栈。

# 第四阶段：Prompt Engineering

学习：

-   Role Prompt
-   Few-shot
-   Chain of Thought（了解概念）
-   XML Prompt
-   JSON Output
-   Guardrails

练习：

-   SQL 生成
-   文本总结
-   翻译
-   分类

------------------------------------------------------------------------

# 第五阶段：AI Agent 核心（重点）

## Tool Calling

实现：

``` text
用户请求
    ↓
调用工具
    ↓
返回结果
```

## MCP（Model Context Protocol）

学习：

-   MCP Server
-   MCP Client
-   Tool
-   Resource

## Memory

理解：

-   Short-term Memory
-   Long-term Memory

## Workflow

``` text
计划
 ↓
执行
 ↓
反思
 ↓
继续
```

## Multi-Agent

``` text
Planner
   ↓
Coder
   ↓
Reviewer
   ↓
Tester
```

建议学习：

-   OpenAI Agents SDK
-   LangGraph
-   AutoGen（了解）
-   CrewAI（了解）

------------------------------------------------------------------------

# 第六阶段：RAG（重点）

学习流程：

``` text
PDF
 ↓
Chunk
 ↓
Embedding
 ↓
Vector Database
 ↓
Retrieve
 ↓
LLM
```

学习内容：

-   Embedding
-   Chunking
-   Retrieval

Vector Database：

-   pgvector
-   Qdrant
-   Pinecone

项目：

> PDF 智能问答系统

------------------------------------------------------------------------

# 第七阶段：Agent 工具开发

整合：

-   Gmail
-   Google Calendar
-   Slack
-   Notion
-   GitHub
-   Jira
-   Google Drive

项目：

> AI Calendar Agent

功能：

-   查看日程
-   自动安排会议
-   创建邀请

------------------------------------------------------------------------

# 第八阶段：部署

学习：

-   Docker
-   Docker Compose
-   GitHub Actions
-   Vercel
-   Cloud Run
-   AWS

目标：

能够完成整个 AI 项目的 Docker 化部署。

------------------------------------------------------------------------

# 第九阶段：监控与评估

学习：

-   Logging
-   Langfuse
-   OpenTelemetry（基础）
-   Prompt Versioning
-   成本统计
-   Token 使用分析

------------------------------------------------------------------------

# 第十阶段：AI 产品设计

学习如何设计一个真正可用的 Agent：

-   什么时候自动执行
-   什么时候请求确认
-   如何设计交互流程
-   如何控制风险

------------------------------------------------------------------------

# 推荐项目（按难度递进）

1.  ChatGPT Clone
2.  PDF RAG
3.  AI Email Assistant
4.  AI Calendar Agent
5.  GitHub Coding Agent
6.  企业知识库 Agent
7.  多 Agent 系统

------------------------------------------------------------------------

# 推荐学习顺序

``` text
Python
    ↓
Git + Linux
    ↓
React + Next.js
    ↓
FastAPI
    ↓
PostgreSQL
    ↓
OpenAI API
    ↓
Prompt Engineering
    ↓
Tool Calling
    ↓
MCP
    ↓
Agent Workflow
    ↓
RAG
    ↓
Vector Database
    ↓
OpenAI Agents SDK / LangGraph
    ↓
Docker
    ↓
云端部署
    ↓
监控与评估
    ↓
完整 AI Agent 项目
```

------------------------------------------------------------------------

# 学习建议

采用 **项目驱动学习**：

-   学 OpenAI API → 做聊天机器人
-   学 Tool Calling → 做天气助手
-   学 RAG → 做 PDF 问答
-   学 MCP → 接入真实工具
-   学 Agent → 做完整 AI 助手

最终目标：

-   完成 5～8 个高质量项目
-   上传 GitHub
-   部署在线 Demo
-   建立个人作品集

这样会比单纯完成课程更具竞争力。
