---
title: Agent 架构调研报告：单一 Agent vs 多 Agent
date: 2026-08-16
description: 关于「单一 Agent vs 多 Agent」的架构调研报告。结论是默认从单一 Agent 起步，多 Agent 拆分的唯一合法理由只有权限隔离、模型分层、独立审查、真并行四类，并总结了 DeepSeek Harness (dsh) 在 Seam 接缝架构、Turn/Step 生命周期与 Append-only 会话日志上的可借鉴之处。
tags:
  - AI Agent
  - 多 Agent
  - 架构调研
  - dsh
---

# Agent 架构调研报告：单一 Agent vs 多 Agent

> 场景：#scene#17 Agent 应用
> 调研时间：2026-08-16
> 参考：DeepSeek Harness (dsh) v0.1、Azure AI Agent Orchestration Patterns、业界多篇工程实践分析

---

## 0. 结论先行（TL;DR）

1. **默认从单一 Agent 起步**。业界 2026 年的共识是：多 Agent 被过度推荐，大多数系统在「确定性」上失败，而 Agent 越多，确定性越差。
2. **拆分的唯一合法理由**（能一句话说清"第二个 Agent 做了一件第一个做不了的事"）只有四类：权限隔离、模型分层、独立审查、真并行。
3. **dsh 的可借鉴之处不在"多 Agent 多酷"**，而在三件事：
   - 一切皆插件的 **Seam（接缝）架构** —— 模型/工具/循环都可替换，单 Agent 天然是它的一等公民；
   - **Turn/Step 生命周期 + Append-only 会话日志** —— 可观测性是一切的底座；
   - **多 Agent 只是 `ctx.subagents` 接口后的可插拔实现** —— 单/多 Agent 在架构上共享同一条事件流。
4. **推荐路径**：先搭单 Agent 基线（可评估）→ 用 trace 做失败归因 → 按"便宜方案优先"逐级演进 → 只有失败稳定集中在某个边界上才拆 Agent。

---

## 1. dsh（DeepSeek Harness）调研

### 1.1 是什么

| 项 | 内容 |
|----|------|
| 全称 | DeepSeek Harness |
| 开源时间 | 2026-08-13（与 V4-Pro 同日发布） |
| 协议 | MIT |
| 版本 | v0.1 Developer Preview（官方明示将有破坏性变更） |
| 命令 | `npx @deepseek-ai/dsh web`（默认 127.0.0.1:3080） |
| 底层 | Cordis 插件元框架（Koishi 生态 4 年 + 北大联合论文《A Programming Paradigm for Spatiotemporal Composability》） |
| 定位 | Agent 运行时（Harness），公式：**Model + Harness = Agent** |
| 对标 | Claude Code、OpenAI Codex |

核心设计理念一句话：**Everything is a Plugin** —— 模型适配器、工具注册表、Skills、会话日志、沙箱、文件系统、Agent Loop、甚至 UI 全部是可替换插件，没有需要 patch 的特权核心。

### 1.2 单 Agent 核心循环：Turn / Step 模型

```
turn/start
  → agent/pre-step          （可拒绝或改写消息）
    → step/start
      → 组装 system prompt + 工具 schema + 会话消息
      → agent/request → llm/stream → assistant/message
      → tool/call → tools/execute → tool/result
    → step/end              （工具是否还欠一次请求？）
  → agent/turn-stopping     （串行，无委派）
turn/end
```

- **Turn** = 一次用户输入引发的完整处理；**Step** = 一次模型请求 + 它产生的工具调用。
- 一个 step 内工具可并发（只读/参数无冲突时并行调度）。
- 事件（`turn/*`、`step/*`、`user/message`、`assistant/*`、`tool/*`）全部落进 **append-only 会话日志**。
- 硬约束：**Model-visible means logged** —— 模型看到的任何内容都必须能从日志重建，fork / resume / replay / telemetry 全部从同一条事件流派生。
- 这解决了多 Agent 系统最大的痛点：**失败归因**（谁看到了什么、哪个 step 错了，可以逐条核查）。

### 1.3 多 Agent 机制：一个接口，四种实现

dsh 的多 Agent 收敛到**一个接口 `ctx.subagents`**，背后可挂完全不同的实现：

| 机制 | 说明 | 适用 |
|------|------|------|
| **Spawn** | 创建全新上下文的子 Agent | 需要隔离的独立子任务 |
| **Fork** | 从现有会话分支继承历史 | 任务演进 / 多方案探索 |
| **ACP 协议** | 对接远程 Agent（Claude Code、Codex 等） | 复用外部 Agent 能力 |
| **Workflow 工具** | 模型可现场写 JS：`parallel`（并行）/ `pipeline`（流水线）/ Ralph 模式（多 Agent 按轮次接力） | 复杂任务编排 |

编排范式定位：**层级式 Supervisor–Worker 为主**（父 Agent 拆解、分配、汇总；子 Agent 执行），兼容并行/流水线/Ralph，但控制权始终在父 Agent，**没有 Agent 间自主协商/竞争/动态接管**（离 Swarm 范式有距离）。

### 1.4 对构建 Agent 最有价值的三个设计

1. **Capability Seam（能力接缝）**：每个能力拆成 Service Definition（接口）/ Service Provider（实现）/ Consumer（模型工具）三层。换 provider = 换产品：把文件系统 provider 指向远程沙箱，Bash/PTY/LSP 一起迁移，零 fork。多 Agent provider 同理可换。
2. **可逆副作用 + 依赖注入**：插件通过 `ctx.effect()`/`ctx.on()` 安装，卸载自动回滚；加载顺序由 `inject` 依赖决定。热插拔/自我进化成为可能（社区已有人在跑"Agent 发现自己缺能力→自己写插件→安装→调用"）。
3. **配置分层组合（Profile/Bundle）**：同一套代码通过 cordis.yml 组装出四种形态（Standard / Code / Minimal / Creator），TUI/Web/Headless/API 共享底座。

### 1.5 已知问题（别踩坑）

- **v0.1 developer preview**：插件接口和核心 API 快速变化，兼容性破坏随时发生，不适合直接做生产依赖。
- **159 个插件的默认部署**：排障面很大。
- **长任务物理过程实现翻车**：官方和社区都实测到长任务可靠性问题。
- 模型侧（V4-Pro）同期大幅涨价 —— dsh 是模型无关的，这点反而给了选择空间。

---

## 2. 单一 Agent vs 多 Agent：完整权衡

### 2.1 三种形态（复杂度递增）

```
① 单 Agent + 工具集         ② Planner–Executor          ③ 编排图（多 Agent）
一个模型、一个循环、一组工具     强模型出计划，廉价模型执行    多个专职 Agent + 交接/主管
最易调试（一条 trace）         成本最优（贵模型只跑一次）     异构任务真实能力提升
                                                  归因难、上下文丢、延迟叠加
```

- ② 是业界大部分成本优化的来源：**plan-and-execute 可降本 90%**（强推理只发生一次，而不是每次工具调用都发生）。
- ③ 只有在"真正异构的工作"上才带来能力提升，代价是失败难以归因——必须上 **trace 级评估**（评估每一步：计划、工具调用、交接），光评最终输出只知道失败不知道败在哪。

### 2.2 多 Agent 的四个真实代价

| 代价 | 说明 |
|------|------|
| 归因困难 | 5 个 Agent 产出错误结果时，从输出看不出是哪一步错的 |
| 上下文丢失 | 每次 handoff 都是一次摘要，摘要必有损；故障常追溯到"两个 Agent 之前的信息" |
| 延迟叠加 | 串行交接用户能感知到 |
| 非确定性复合 | 每个 Agent 的方差是相乘不是平均 |

### 2.3 拆分的合法理由（缺一不可的"那句话"）

> **"第二个 Agent 做了第一件 Agent 做不到的什么事？"** —— "关注点分离"不是答案（那是代码架构的审美，组件是确定性的）；以下四类才是：

1. **权限边界不同** —— 子 Agent 需要不同的工具/凭据/沙箱（安全隔离是硬约束）。
2. **模型类别不同** —— 规划用 frontier 模型，高频执行用廉价小模型（成本治理）。
3. **独立审查** —— Reviewer 的上下文必须与 Generator 隔离（防"自圆其说"）。
4. **真并行** —— N 个互不依赖的子任务（文档逐个摘要、多源检索），且并行收益用户可感知。

### 2.4 决策维度（判断信号）

| 维度 | 倾向单 Agent | 倾向多 Agent |
|------|------------|------------|
| 任务复杂度 | 单一域、边界明确 | 多域、相互依赖 |
| 工作流步骤 | 1–3 步顺序 | 4+ 步且有并行依赖 |
| 数据源 | 1–2 个系统 | 3+ 系统（ERP/CRM/API） |
| 治理要求 | 低 | 高（审计轨迹、RBAC） |
| 失败代价 | 低-中 | 高（财务/合规） |
| 任务图 | 稠密图（每步依赖上一步上下文） | 稀疏图（子任务间少依赖） |

**可分解性检验**：把任务画成有向图，边/节点比例高（稠密）→ 单 Agent；稀疏 → 才考虑多 Agent。代码生成是典型稠密图（生成→测试→重构全程共享上下文），拆 Agent 只是把大上下文搬到消息边界上，不解决问题。

---

## 3. 工程落地路径（渐进式，别一步到位）

```
第一步：单 Agent 基线
  用真实业务测试集评估：成功率、工具选择准确率、人工接管率、Token/P95 延迟、高风险拦截率

第二步：从 Trace 给失败分类
  工具选错 → 合并重叠工具/改名字描述/动态裁剪
  指令不遵守 → 缩短 prompt/规则结构化/确定性逻辑移出模型
  上下文污染 → 按需加载知识/分层记忆
  步骤遗漏 → 状态机/任务清单/完成条件
  串行太慢 → 找真正独立的子任务并行化
  专业域互相干扰 → 隔离 prompt/知识/工具/评估，再考虑拆 Agent

第三步：按"便宜方案优先"逐级演进
  优化工具定义 → 动态工具集 → 动态 Prompt/Skills
  → 结构化状态 + 确定性工作流 → 单个专业子 Agent → 多 Agent 编排

第四步：拆 Agent 的前提
  失败稳定集中在某个边界上 + 能说清"第二个人做不了第一人的事"
```

**业界最终结论**：大多数业务系统真正需要的是 —— **一个主 Agent + 少量受控子 Agent + 大量确定性代码**，而不是一群 Agent 自由聊天。

---

## 4. 对你这个项目的建议（Agent 应用，从零开始）

### 4.1 起步形态

**单一 Agent（带工具）+ 强可观测性**，对标 dsh 的 turn/step 生命周期：

- 一个主循环：Turn/Step 模型，事件全量落 append-only 日志
- 工具按 Seam 三层组织（接口/实现/模型工具），为将来换 provider 留缝
- 先不引入子 Agent 基础设施

### 4.2 预留但暂不实现的多 Agent 能力

- `subagents` 只留**一个接口**（Spawn/Fork/外部协议），实现后挂
- 编排只支持父 Agent 单层委派（Supervisor–Worker），不做 peer 协商
- 所有子 Agent 的输入输出都走同一条事件流（保住归因能力）

### 4.3 技术选型参考

| 方向 | 选项 |
|------|------|
| 自研 Loop | 参照 dsh turn/step + 事件流设计，不照搬 159 插件 |
| 用现成框架 | LangGraph（状态化 orchestrator-worker，显式状态/条件路由/失败恢复）、CrewAI（角色制团队）、AutoGen（会话式协作） |
| 复用 dsh | 可作为实验/对标对象，**不建议** v0.1 直接做生产依赖（破坏性变更） |
| 可观测性 | 从第一天做 trace（模型看到的必须可重建） |

### 4.4 关键决策建议（写入 ADR）

1. **ADR：单 Agent 起步，拆分需触发条件** —— 先做基线评估，trace 归因后按第 3 节路径演进。
2. **ADR：日志即真相** —— append-only 事件流 + "模型可见必可重建"约束，是所有后续 fork/replay/审计的地基。
3. **ADR：子 Agent 接口先于实现** —— 一个 `subagents` 接口，Spawn/Fork/ACP 后置。

---

## 附：信息来源

- DeepSeek Harness 官方仓库 / docs/architecture.md（github.com/deepseek-ai/deepseek-harness）
- RITS 分析《DeepSeek Open-Sources Harness, an All-Plugin Agent Runtime》(2026-08-14)
- 腾讯云开发者社区《从能跑到可交付：单 Agent 与多 Agent 的架构取舍》
- Azure Architecture Center《AI agent orchestration patterns》
- Jishu Labs《Multi-Agent Orchestration: When One Agent Beats Many》
- Catalect《Multi-Agent Systems vs Single Agents: The Enterprise Architecture Decision Framework》
