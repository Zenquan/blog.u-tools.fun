---
title: 多 Agent 协作平台 · 技术选型对比报告
date: 2026-08-16
description: 多 Agent 协作平台的技术选型对比报告。梳理 2026 年框架格局（官方 SDK 入局、LangChain 一家独大局面结束），结论是首选 LangGraph 作为编排内核；若要求深度掌控 + 国产模型 + TS 生态，则参照 dsh 的 Seam 设计自研并把 LangGraph 当对照。
tags:
  - AI Agent
  - 多 Agent
  - 技术选型
  - LangGraph
---

# 多 Agent 协作平台 · 技术选型对比报告

> 场景：#scene#17 Agent 应用 — 多 Agent 协作平台
> 调研时间：2026-08-16
> 前置文档：`docs/agent-architecture-research.md`（单 vs 多 Agent 架构调研）
> 结论先行：**首选 LangGraph 作为编排内核；若要求深度掌控 + 国产模型 + TS 生态，则自研（参照 dsh 的 Seam 设计）并把 LangGraph 当对照。**

---

## 1. 2026 框架格局（先看这一张表）

2025 年框架爆发、2026 年收敛：OpenAI/Google/Microsoft/Anthropic 全部推出官方 SDK，LangChain 一家独大的局面结束。

| 框架 | 版本 (2026-08) | 语言 | 心智模型 | 生产成熟度 | 状态 |
|------|--------------|------|---------|-----------|------|
| **LangGraph** | v1.2.x (6月) | Python / TS | 状态图（StateGraph） | ⭐⭐⭐⭐⭐ 最高 | 活跃，Klarna/Uber/LinkedIn 生产 |
| **CrewAI** | v1.14.x (6月) | Python | 角色制团队（Crew/Task） | ⭐⭐⭐⭐ | 活跃，53k+ stars |
| **OpenAI Agents SDK** | v0.17.x | Python / TS | Handoff 路由 | ⭐⭐⭐⭐ | 活跃，OpenAI 官方 |
| **Microsoft Agent Framework** | v1.8 (4月 GA) | .NET / Python | 对话 + 企业工作流 | ⭐⭐⭐⭐ | 活跃（AutoGen 已合并入此） |
| **Google ADK** | 2025-中发布 | Python / Java | 图 + A2A 协议 | ⭐⭐⭐ | Gemini 生态 |
| **Mastra** | 2025-26 黑马 | TypeScript | Workflow + Agent | ⭐⭐⭐ | 活跃，TS 全栈首选 |
| **AutoGen** | 维护模式 | Python / .NET | 会话式多 Agent | ⭐⭐ | ⚠️ 已被 MAF 取代，新项目别用 |
| **dsh (DeepSeek Harness)** | v0.1 预览 | TypeScript | 一切皆插件 | ⭐⭐ | 活跃但破坏性变更中 |

> AutoGen 明确进入维护模式（Microsoft Agent Framework 为继任者）；Swarm 停维护被 Agents SDK 取代。**选型时避开 AutoGen / Swarm。**

---

## 2. 五个候选深度对比

针对「多 Agent 协作平台」定位（单 Agent 只是组件，编排是核心），聚焦对比 5 个候选：
**LangGraph / CrewAI / OpenAI Agents SDK / dsh 复用 / 自研**。

### 2.1 LangGraph — 生产级编排的事实标准

- **心智模型**：有状态的有向循环图。节点 = 处理函数（LLM 调用/工具/路由），边 = 转移（条件分支），共享 TypedDict 状态贯穿全程。
- **多 Agent 能力**：官方内置三种编排模式 —— **Supervisor（主管路由到专业子 Agent）、Swarm（动态交接）、Hierarchical（嵌套主管）**，与你调研结论（Supervisor–Worker 起步）完全对齐。
- **核心优势**：
  - **Durable execution**：checkpoint 持久化（SQLite/Postgres/Redis），节点间任意位置可恢复 —— 长任务 3 点崩溃不丢进度
  - **HITL 一等公民**：`interrupt()` 在任何节点暂停，人工审批后从同一点恢复
  - **Time travel**：从任意 checkpoint 分叉重放，多 Agent 归因调试利器
  - 模型无关（OpenAI/Anthropic/DeepSeek 任意接）、Python + TS 双语言
- **代价**：学习曲线最陡（1-2 周上手期）；简单 Agent 显啰嗦；被 LangChain 生态牵引。
- **2026 现状**：v1.2.x（2026-06 发布），34k+ stars，每月 PyPI 下载 3900 万+，60% 生产 Agent 事故源于状态管理 —— 这正是 LangGraph 对症的点。

### 2.2 CrewAI — 最快的角色制原型

- **心智模型**：组织架构图。Agent（role/goal/backstory）+ Task（描述/期望输出/依赖）+ Crew（编排执行），Process 支持 sequential / hierarchical（manager 委派 worker）。
- **多 Agent 能力**：角色制协作开箱即用，"Researcher + Writer + Editor" 类业务流 20 分钟出 demo。
- **核心优势**：心智模型业务方可读；开发体验最好；53k+ stars 社区最大。
- **代价**：**中间状态默认不持久化**（Process 重试是恢复手段，不是 checkpoint）；确定性较弱（同输入可能不同输出）；Python only。
- **定位**：快速原型/演示/业务协作流；对"多 Agent 协作平台"这类需要稳定编排的产品，深度不够。

### 2.3 OpenAI Agents SDK — 轻量但锁定

- **心智模型**：Agent + Handoff + Guardrail + Tracing 四个原语，没有图、没有角色、没有 YAML。
- **多 Agent 能力**：Handoff 路由做 agent 间切换很自然；Tracing 免费内建。
- **核心优势**：OpenAI 深度用户 10 分钟出第一个 Agent；内置 guardrails。
- **代价**：**模型锁定是硬伤** —— 切换 Claude/DeepSeek 需重写；复杂编排能力弱于 LangGraph。
- **定位**：OpenAI 生态内的简单路由场景；对"多 Agent 协作平台"不推荐做主框架（除非你确定永远只用一个模型厂商）。

### 2.4 复用 dsh（DeepSeek Harness）— 可实验，不可依赖

- **优势**：MIT 开源；一切皆插件（模型/工具/循环可换）；Turn/Step + append-only 日志设计是范本；`ctx.subagents` 单接口支持 Spawn/Fork/ACP/workflow。
- **硬伤**：**v0.1 developer preview，官方明示破坏性变更**；159 插件默认部署排障面大；长任务可靠性实测翻车；社区生态刚起步。
- **定位**：**clone 下来当架构范本 / 实验对标对象，不建议作为生产底座**。2026-08 的版本阶段决定它不是平台型产品的合理依赖。

### 2.5 自研（参照 dsh 设计）— 深度掌控，成本最高

- **为什么值得**：模型无关（天然适配 DeepSeek 等国产模型 + 价格波动下的切换自由）；深度掌控编排语义；不背框架版本漂移的债；可把 dsh 的 Seam 三层（接口/实现/消费者）和 append-only 日志设计直接吸收。
- **成本**：turn/step 循环、工具注册表、子 Agent 接口、事件日志、checkpoint、HITL、沙箱——每一项都是工程投入；可观测性要自建。
- **折中**：**编排内核用 LangGraph，外围（工具 Seam、事件日志、UI、配置分层）自研** —— 这是目前最主流的组合。

---

## 3. 对比矩阵（多 Agent 协作平台视角）

| 维度 | LangGraph | CrewAI | OpenAI SDK | 复用 dsh | 自研 |
|------|:---:|:---:|:---:|:---:|:---:|
| 多 Agent 编排模式 | Supervisor/Swarm/层级 | Sequential/Hierarchical | Handoff | Supervisor-Worker | 自定 |
| 状态持久化/恢复 | ✅ checkpoint 一等公民 | ⚠️ 默认不持久化 | 会话级 | ✅ append-only 日志 | 自建 |
| HITL 人工介入 | ✅ 原生 interrupt | ⚠️ 有限 | 手动 gate | 审批策略插件 | 自建 |
| 失败归因/可观测性 | ✅ LangSmith + time travel | ⚠️ 逐步补强 | ✅ 内建 tracing | ✅ Trajectory 视图 | 自建 |
| 模型无关性 | ✅ 任意 | ✅ 任意 (LiteLLM) | ❌ OpenAI 锁定 | ✅ 任意 | ✅ 任意 |
| 语言 | Python + TS | Python | Python + TS | TypeScript | 自定 |
| 学习曲线 | 陡 | 平 | 平 | 陡（插件概念） | 最高 |
| 生产成熟度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ 预览版 | 取决于你 |
| 许可证 | MIT | MIT | 开源 | MIT | — |
| 上手到首个 demo | ~45 min | ~20 min | ~10 min | ~30 min | 数周 |

---

## 4. 推荐结论

### 4.1 推荐：LangGraph 作为编排内核（首选）

理由（针对「多 Agent 协作平台」这个定位）：
1. **平台的核心资产是"可靠的多 Agent 编排"** —— 而 60% 生产事故源于状态管理，LangGraph 的 checkpoint/durable execution 恰好对症，这是平台型产品与 demo 的分水岭；
2. **Supervisor/Swarm/Hierarchical 三种模式官方内置**，与你上一轮调研的结论（Supervisor–Worker 起步、按触发条件演进）直接对齐，不用自己造轮子；
3. **模型无关** —— 平台要服务多模型，DeepSeek V4-Pro 刚涨价 1100%，模型切换自由度是平台的生命线；
4. Python + TS 双语言，团队栈灵活。

### 4.2 备选：自研（参照 dsh），满足以下任一条件时

- 深度绑定国产模型生态 + 要求零框架依赖；
- 编排语义需要完全自定义（dsh 都满足不了的那种）；
- 平台本身就是"卖 Harness"（把编排能力当产品卖）。

自研清单（吸收 dsh 设计）：turn/step 生命周期 → append-only 事件日志（模型可见必可重建）→ 工具 Seam 三层 → `subagents` 单接口（Spawn/Fork/外部协议）→ checkpoint + HITL → 配置分层（Profile/Bundle）。

### 4.3 混合组合（工程上最务实）

```
编排内核：LangGraph（supervisor pattern + checkpoint + HITL）
观测层：LangSmith 或自建事件日志（参照 dsh 的 append-only 设计）
工具层：自建 Seam 三层，接 MCP（2025-12 已归 Linux Foundation，事实标准）
模型层：模型无关适配器（OpenAI 兼容端点覆盖 DeepSeek/通义/GLM）
UI/配置：自研（Profile 分层，参照 dsh cordis.yml 思路）
```

---

## 5. 决策清单（团队可开会过一遍）

1. **团队语言栈**：Python 为主 → LangGraph 直接上；TS 全栈 → LangGraph.js 或 Mastra。
2. **模型策略**：多模型/国产模型 → LangGraph（模型无关）；锁死单一厂商 → 才考虑厂商 SDK。
3. **编排深度**：需要 checkpoint + HITL + 失败恢复 → LangGraph 唯一解。
4. **交付节奏**：下周要 demo → CrewAI 先跑原型，原型验证后迁移 LangGraph 内核（心智模型不同，不要真迁移，重写）。
5. **平台野心**：编排能力本身就是卖点 → 自研，但先按 LangGraph 语义做规格，再决定要不要自己写。
6. **生产时间点**：2026 年内上线 → 不要赌 dsh v0.1 或任何 2026 上半年之前的 0.x 框架当底座。

---

## 附：信息来源

- convly.ai《Best AI Agent Frameworks in 2026》(2026-06 版核对：LangGraph v1.2.5 / CrewAI v1.14.7 / MAF v1.8.1 / OpenAI SDK v0.17.5)
- agentlist.top《Best AI Agent Frameworks in 2026》(2026 格局总览)
- app-lab.ai《Multi-Agent Frameworks Compared in 2026》(生产数据：LangGraph 95% 可靠性 / CrewAI 91% / OpenAI SDK 97%)
- aiagentrank.io《LangGraph vs CrewAI vs AutoGen vs OpenAI Agents SDK 2026》
- atlan.com《What is LangGraph?》(2026，checkpoint/PostgresSaver 细节)
- futureagi.com《Best Multi-Agent Frameworks 2026: 7 Platforms Ranked for Production》
- DeepSeek Harness 官方仓库与 36kr 深度解析（dsh 章节）
