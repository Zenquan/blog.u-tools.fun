---
title: 架构设计文档 - 多 Agent 内容生产平台
date: 2026-08-16
description: Content Pipeline Platform（多 Agent 内容生产平台）架构设计文档 v0.1-draft。系统通过编排 Research → Write → Review → Publish 四个角色 Agent 协作完成内容生产，审核通过前不发布、发布前人工确认；技术栈为 Python 3.12+、官方 LangGraph v1.2+、FastAPI、MySQL 8.0+。
tags:
  - AI Agent
  - 多 Agent
  - 架构设计
  - LangGraph
---

# 架构设计文档 - 多 Agent 内容生产平台

> 项目：Content Pipeline Platform（内容生产流水线）
> 场景：#scene#17 Agent 应用 · 多 Agent 协作平台
> 版本：v0.1-draft
> 日期：2026-08-16
> 前置调研：`docs/agent-architecture-research.md`、`docs/agent-framework-comparison.md`
> 技术栈（已拍板）：**Python 3.12+ · 官方 LangGraph v1.2+ · FastAPI · MySQL 8.0+**

---

## 一、系统定位

**一句话**：一个多 Agent 协作平台，首个落地场景是「内容生产流水线」—— 用户给一个创作需求，平台编排 Research → Write → Review → Publish 四个角色 Agent 协作完成，审核通过前不发布，发布前人工确认。

**设计原则**（继承两轮调研结论）：
1. **编排内核用 LangGraph，外围自研** —— checkpoint/HITL/time-travel 用官方成熟能力，不造轮子
2. **Supervisor 起步，按触发条件演进** —— 先流水线，出现"任务动态分流"需求再上 supervisor 分发
3. **日志即真相** —— append-only 事件日志，"模型可见必可重建"
4. **工具 Seam 三层** —— 接口 / 实现 / 模型工具分离，换 provider 不换编排
5. **模型无关** —— OpenAI 兼容端点，DeepSeek/通义/GLM 可切换

---

## 二、架构总览

```
┌────────────────────────────────────────────────────────────┐
│                     客户端 / API 层                          │
│   CLI ──┐         FastAPI (REST)                           │
│   Web ──┼──────►  POST /tasks 创建任务                      │
│   SDK ──┘         GET  /tasks/:id 查询进度/事件流            │
│                   POST /tasks/:id/approve  HITL 审批        │
└────────────┬───────────────────────────────────────────────┘
             │
┌────────────▼───────────────────────────────────────────────┐
│                编排内核（LangGraph v1.2）                    │
│                                                             │
│   supervisor (入口分流)                                      │
│      │                                                      │
│   ┌──▼───────────────────────────────────────────┐         │
│   │  research ─► write ─► review ─► publish      │         │
│   │      ▲            │  ▲         │             │         │
│   │      └────────────┘  └─ 驳回→改稿 (≤N轮)      │         │
│   └──────────────┬────────────────────────────────┘         │
│                  │ interrupt()                             │
│   checkpoint ────┴─── 持久化到 MySQL 8.0+（checkpoints 表）     │
└────────────┬───────────────────────────────────────────────┘
             │ 事件（append-only）
┌────────────▼───────────────────────────────────────────────┐
│                可观测层（自研）                              │
│   事件日志（JSONL/表）· 轨迹回放 · 指标 · LangSmith(可选)     │
└─────────────────────────────────────────────────────────────┘
```

**三条数据流**：
1. **控制流**：LangGraph 图执行（节点 + 条件边 + 循环）
2. **状态流**：TypedDict State 贯穿全程，checkpoint 持久化，可中断/恢复/回放
3. **事件流**：所有节点向 append-only 日志写入事件（`stage/start`、`agent/request`、`tool/call`、`human/approval_requested` 等），可观测层消费；枚举见 §6.3

---

## 三、核心架构决策（ADR）

### ADR-001: 编排内核选 LangGraph v1.2（官方 Python）
- **决策**：Python 3.12 + 官方 LangGraph，不用 LangGraphGo（社区移植）、不重复造轮子
- **理由**：官方维护 + checkpoint/HITL/time-travel 一等公民 + LangSmith 生态；60% 生产事故源于状态管理，官方实现是平台级风险最低的选择
- **后果**：编排核心与 Python 绑定；Go 留作未来外围服务（网关/工具执行器）时再引入

### ADR-002: 首个落地场景用「流水线 + 审核循环」，不做动态编排
- **决策**：内容生产用固定 Stage 图（research→write→review→publish），review 不通过条件边回写（≤N 轮）
- **理由**：内容生产的任务结构是确定的；动态 supervisor 分发只有在"任务类型未知、需现场分流"时才需要（演进触发条件已写入路线图）
- **后果**：v0.1 图结构简单、易测；预留 supervisor 节点作为入口（1 个节点，后续扩展不破坏图）

### ADR-003: 日志即真相（append-only 事件日志）
- **决策**：自研事件日志，所有模型可见内容必可重建（借鉴 dsh 的 "Model-visible means logged"）
- **理由**：多 Agent 失败归因的根基；HITL 审计需要"模型当时看到了什么"的完整还原
- **后果**：事件日志表为系统核心表，先于业务表设计；LangSmith 作为增强观测，不作为唯一真相源

### ADR-004: 工具 Seam 三层（接口 / 实现 / 模型工具）
- **决策**：每个工具拆三层——接口契约（`ToolSpec`）、可替换实现（本地/远程/沙箱）、模型侧 schema 与执行适配
- **理由**：换实现（如搜索从本地 API 换到远程 MCP）不碰编排代码；MCP 已是事实标准（2025-12 归 Linux Foundation）
- **后果**：工具开发成本略高，但换 provider 成本趋近于零

### ADR-005: 发布前人工确认（HITL 用 LangGraph interrupt）
- **决策**：publish 节点前 `interrupt()`，人工在审批界面确认后才继续
- **理由**：内容发布是不可逆动作，是"必须设计 human-in-the-loop"的高风险步骤（企业级红线）
- **后果**：审批挂起任务可跨天恢复（checkpoint 保证），需要审批 API + 待办队列

### ADR-006: 模型无关，OpenAI 兼容端点
- **决策**：模型适配层统一走 OpenAI 兼容协议；默认 DeepSeek，可配通义/GLM/OpenAI
- **理由**：V4-Pro 涨价 1100% 的教训——模型切换自由是平台生命线；角色 Agent 可按成本/质量分模型
- **后果**：低层模型抽象需验证各家兼容性（function calling 格式差异是主要风险点）

### ADR-007: 平台化四层概念 + 运行时覆盖（场景 / agent / Skill / 知识库）
- **决策**：B 端可配置实体分四层，各层独立注册表、统一「代码默认 + DB 覆盖 + 自定义」运行时合并模式：
  - **场景（Scenario = 任务类型 TaskType）**：一个场景对应一条流程（多个 agent 串联，有序）；`pipeline = roles + publish_confirm` 由后端派生；supervisor/targets 从运行时注册表读，配置场景即时生效（零改图）。
  - **agent（角色 AgentRole）**：可配 Prompt（system_prompt）/ 模型（model_tier）/ MCP 工具（tools）/ Skill（skills）/ 知识库（knowledge）。
  - **Skill**：独立可复用能力单元 = 技能指令 prompt + 关联 MCP 工具（**Skill ≠ 工具**，工具走 MCP；Skill 是高于工具的封装）。
  - **知识库**：RAG 源，文档上传 → 解析（MinerU 可选兜底）→ 切块入库；检索接入后置。
- **理由**：把 M3 的能力声明从「代码常量（TASK_TYPES / AGENT_ROLES）」升级为「B 端可视化配置 + 运行时生效」，新场景/Skill/知识库零改图；概念分层避免把 Skill 错归并到工具（用户明确纠偏）。
- **后果**：agent 序列只能从图实际存在的节点（research/write/review/publish）组合，自定义角色需新增图节点（M3③ MCP 接入后）才能进入流水线；文档解析默认 PlainText 兜底，MinerU 作为可选增强（重依赖 + 模型下载）。

### ADR-008: MCP 接入层（外部工具/数据源零代码接入）
- **决策**：Seam 三层补「远程工具」实现通道，外部工具经 MCP（官方 `mcp` Python SDK）接入，与本地 impl 对等、编排零改：
  - **数据模型**：`mcp_servers` 表（name PK + transport[stdio|http] + command/args 或 url + timeout + enabled 信任开关 + env + auto_approve）+ `tool_specs.mcp_server` 列（NULL=本地 impl 绑定；非空=经该 server 代理）。
  - **命名规则**：远程工具本地名 = `{server}__{tool}`（跨 server 同名不冲突，本地内置工具不带前缀）。
  - **发现与同步**：连接后 `tools/list` 拉取远端契约 → 自动 upsert 进 `tool_specs`（builtin=False, available 待 enabled）+ registry 声明式注册（`mcp/tools/mcp/sync.py`）。
  - **调用代理**：`ToolRegistry.invoke` 按 `spec.mcp_server` 分发——builtin 走本地 impl，声明式走 `McpDispatcher.call`（`{server}__{tool}` 去前缀）；server 不可达/未启用 → `ToolNotAvailable` → 节点层 catch 走 `tool/error` + mock 兜底，编排零改（nodes 不知本地/远程）。
  - **密钥与信任**：密钥（token/header）只进 `.env`，`env`/`url` 中的 `{{ENV:VAR}}` 引用启动时从服务器环境解析，绝不落表；**远端工具默认不信任**——必须已在 `tool_specs` 注册 + agent 白名单挂载 + server `enabled=True` 三者齐备才进入模型上下文。
- **理由**：MCP 已是事实标准（2025-12 归 Linux Foundation），走它能把「接外部工具/数据源」从「写 impl 代码」降为「B 端配置 + 测试连接」，是「新任务类型零改图」的配套（新类型声明 `role_tools` 即可用 MCP 工具）。
- **后果**：同步/异步桥——LangGraph 图同步执行（`graph.invoke`），MCP SDK 是 async，单次调用用 `asyncio.run` 包（`dispatcher._run_sync`），运行中 loop 时抛明确错误；admin 增删 MCP server 即时生效（复用同一 store 实例，dispatcher 与 admin 同源）；测试用本地 FakeClient/in-process `Client` 直连，不依赖外部网络。

---

## 四、编排内核设计（LangGraph）

### 4.1 状态 Schema（`graph/state.py`）

```python
from typing import Annotated, TypedDict
from operator import add

class PipelineState(TypedDict):
    # 任务元信息
    task_id: str
    brief: str                    # 创作需求（用户输入）
    target: str                   # 目标形态：公众号文/短视频脚本/社媒短文
    # 各阶段产物
    research: list[dict]          # 研究素材：[{source, quote, summary}]
    outline: str                  # 大纲
    draft: str                    # 草稿
    review: dict                  # 审核结果：{passed, comments, score}
    revision_count: int           # 已修改轮次
    # 发布
    publish_plan: list[dict]      # 发布目标：[{channel, format}]
    published: bool
    status: str                   # 任务状态机（§6.4：pending/researching/.../awaiting_approval/done/blocked）
    # 事件（各节点追加，checkpoint 可还原）
    events: Annotated[list[dict], add]
```

### 4.2 图结构（`graph/pipeline.py`）

```
            ┌────────────────────────────────────────┐
            │  supervisor（入口：解析 brief，路由）    │
            └───────────────┬────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │  research（研究节点）        │  tools: web_search, fetch_url, note
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │  write（撰写节点）           │  tools: read_research, style_guide
              └─────────────┬─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │  review（审核节点）          │  条件边：
              └──────┬──────────────┬─────┘
                     │ passed       │ rejected
                     │              ▼
                     │      ┌───────────────┐
                     │      │  write (重写)  │  revision_count < MAX
                     │      └───────┬───────┘
                     │              └────────► review（循环）
                     │                         revision_count ≥ MAX → review_escalate（interrupt 转人工）
                     ▼
              ┌─────────────────────────────┐
              │  publish（计划 + 请求审批）    │  生成发布计划 + human/approval_requested
              └─────────────┬───────────────┘
                            ▼
              ┌─────────────────────────────┐
              │  publish_confirm（interrupt）│  interrupt() 挂起 → Command(resume) 恢复
              └──────┬──────────────────────┘
                     │ approved          │ rejected
                     ▼                   ▼
                   done                blocked
```

> **publish/publish_confirm 双节点拆分（幂等铁律）**：LangGraph 的 `Command(resume=...)` 会**从 interrupt 所在节点开头重跑**。因此把「计划生成 + 事件 + 状态提交」（publish）与「interrupt + 决策」（publish_confirm）拆开——**interrupt 调用点之前的节点代码必须无副作用**，否则 resume 后事件重复 emit。

### 4.3 角色 Agent 设计（`agents/`）

每个角色 = **system prompt 模板 + 模型配置 + 工具集白名单**，模型可不同：

| Agent | 职责 | 关键系统提示要点 | 模型档位 | 工具白名单 |
|-------|------|----------------|----------|-----------|
| **Research** | 多源检索、提炼素材 | "只记录事实，标注来源与可信度" | fast（中档） | `web_search`（Tavily/Mock；支持官方域分级检索 `RESEARCH_DOMAINS`） |
| **Writer** | 按大纲与素材成稿 | "遵循 style guide，素材纪律：禁编造、引用 [来源N]" | strong（强档） | （当前无工具，走素材即 state） |
| **Reviewer** | 质量/事实/风格审查 | "逐项打分，引用校验（序号/一致性/缺引用）" | strong（强档） | （当前无工具，走素材 + 内部知识核对） |
| **Publisher** | 发布编排 | "生成发布计划" | fast（中档） | `publish_plan` |

> 模型分层即成本治理：Research/Publisher 用快模型，Write/Review 用强模型——对应调研中"plan-and-execute 降本 90%"的模式。

#### 4.3.0 角色模板化（prompt 参数化 + 类型声明，M3②）

**角色是「可注册模板」，不是写死字符串**：

- `AgentRole.system_prompt` 支持 `{var}` 占位符（如 `{target_label}`），节点通过 `role.render(**ctx)` 注入任务上下文——同一个 write 角色可因任务形态（公众号/视频/直接问答）渲染出不同提示，无需每类写死一份 prompt。
- `TaskType`（`app/pipeline/types.py`）声明「要哪些角色/工具/知识」：
  - `roles`：角色/skill 序列（真相源，节点名 == 角色名）；`pipeline` 从 `roles + ("publish_confirm",)` 派生（`publish_confirm` 是机制节点，非角色）
  - `role_tools`：per-role 工具覆盖（默认继承角色注册表白名单，③ MCP 实现）
  - `knowledge`：知识来源声明（④ 知识库实现）
- 渲染兜底：`_SafeDict` 让缺省占位符原样保留——不抛错、不静默吞掉关键指令。

#### 4.3.1 模型档位机制（fast / strong）

**双档位定义**：全平台只用两档模型，角色通过 `model_tier` 声明用哪档，不直接写模型名（模型无关，ADR-006）。

| 档位 | 配置项（.env） | 定位 | 使用角色 |
|------|---------------|------|---------|
| **fast**（中档） | `LLM_MODEL_FAST` | 快、便宜；重广度轻内容 | research、publish |
| **strong**（强档） | `LLM_MODEL_STRONG` | 强推理、严谨；决定内容质量 | write、review |

**调用链路**：角色注册表 `agents/registry.py` 声明 `model_tier` → 节点 `llm.chat(tier, ...)` → `LLMClient._tier_model(tier)` 解析为对应环境变量 → OpenAI 兼容端点。

```
registry.py（model_tier: "strong"）
  → LLMClient.chat("strong", ...)
  → _tier_model() → settings.llm_model_strong
  → OpenAI(base_url, api_key).chat.completions.create(model=...)
```

**设计动机（成本治理）**：不是所有角色都要顶级模型。检索/发布这类「一次调用、产出辅助信息」用中档；**写正文和审核**这类「决定内容质量、不可逆」用强档。实测差异：强档（如 `deepseek-v4-pro`）审查明显更严格——会拒掉二手来源、要求一手证据（对应防幻觉调研 §三 write/review 措施）；中档（如 `deepseek-v4-flash`）更快更便宜、审查更宽容。

**选档原则（新增角色）**：
- 角色产出进入最终内容 / 决定流程走向 → **strong**（write、review）
- 角色产出为辅助信息 / 一次调用即弃 → **fast**（research、publish）
- 不要为单个角色引入第三档；需要更强时**升级 `LLM_MODEL_STRONG` 的模型**而非加档

**调整影响**：改 `LLM_MODEL_STRONG` 即同时改变 write 的生成质量与 review 的审查严格度（两者共用强档）；改 `LLM_MODEL_FAST` 只影响 research/publish。当前推荐组合：fast=`deepseek-v4-flash`、strong=`deepseek-v4-pro`（新一代命名，pro 对应原 reasoner 档位）。

**失败重试**：`LLMClient(..., retries, retry_backoff, on_retry)` 对瞬时错误自动重试——可重试：连接错误/超时/429/5xx；**4xx（400/401/422）不重试**（客户端错误改了也白改）。节点调用时注入 `on_retry` 埋 `system/retry` 事件；重试耗尽仍失败才走降级（mock + `system/error`）。**注意：`deps.py` 默认装配 `LLMClient(settings)` 未传 retries（默认 0 = 不重试）**——需要重试时显式传参。

### 4.4 审核循环（核心控制流）

```
review 节点输出 {passed, comments, score}
  ├─ passed=True            → publish
  ├─ rejected & n < MAX     → write（携带 comments 重写），n += 1
  └─ rejected & n ≥ MAX     → 人工介入（interrupt，转人工改稿）
```

- 防死循环：`MAX_REVISION = 3`，超限强制转人工（HITL）
- 所有跳转走**条件边**（`add_conditional_edges`），无隐藏逻辑

---

## 五、模块划分与目录结构

```
content-pipeline-platform/
├── pyproject.toml                # uv/pip，依赖：langgraph>=1.2, fastapi, pydantic
├── app/
│   ├── main.py                   # 入口：FastAPI + 图编译注册
│   ├── config/                   # 配置分层（Profile：dev/prod，参照 dsh cordis.yml 思路）
│   │   ├── base.yaml             # 基础配置（模型端点、存储）
│   │   └── profile/              # 按环境 patch
│   ├── graph/                    # ── 编排内核 ──
│   │   ├── state.py              # PipelineState（TypedDict）
│   │   ├── pipeline.py           # 流水线图构建（编译）
│   │   └── nodes/                # 节点实现（每个节点一个文件）
│   │       ├── supervisor.py
│   │       ├── research.py
│   │       ├── write.py
│   │       ├── review.py
│   │       └── publish.py
│   ├── agents/                   # 角色 Agent 定义
│   │   ├── registry.py           # 角色注册表（prompt/模型/工具白名单）
│   │   └── prompts/              # system prompt 模板
│   ├── tools/                    # ── Seam 三层 ──
│   │   ├── spec.py               # ToolSpec 接口契约
│   │   ├── impl/                 # 实现层（本地实现）
│   │   ├── mcp/                  # MCP 客户端适配
│   │   └── registry.py           # 工具注册表
│   ├── observability/            # ── 可观测层 ──
│   │   ├── event_log.py          # append-only 事件日志（核心表）
│   │   ├── tracker.py            # 事件埋点工具（节点内调用）
│   │   └── replay.py             # 轨迹回放/审计查询
│   ├── persistence/              # checkpoint + 业务存储
│   │   └── store.py              # MySQL 存储适配（checkpoint + 业务）
│   ├── api/                      # ── API 层 ──
│   │   ├── tasks.py              # 任务 CRUD + 事件流查询
│   │   └── approvals.py          # HITL 审批
│   └── models/                   # 领域模型（Pydantic）
├── tests/                        # TDD：node 单测 + 图集成测试 + API 测试
└── docs/
```

---

## 六、数据与持久化

### 6.1 存储分层

| 存储 | 用途 | 技术 |
|------|------|------|
| **Checkpoint 存储** | LangGraph 状态持久化（图恢复/回放） | MySQL 8.0.x/8.4（`langgraph-checkpoint-mysql`，表：checkpoints/checkpoint_writes/checkpoint_blobs） |
| **事件日志** | append-only，模型可见必可重建 | 同库表 `event_log`（id 自增 + `(task_id, seq)` 唯一键） |
| **业务表** | 任务快照（tasks） | 同库表 `tasks`（snapshot JSON，upsert） |

> **版本红线**：≥8.0.19 且 <9.6（`mysql:latest` 已到 26.x、5.7 缺表达式默认值均不可用，**显式 `mysql:8.4` LTS**）。
> **连接配置**：`MYSQL_USERNAME/PASSWORD/ADDRESS/DATABASE` 四件套（DATABASE_URL 已移除）；`Unknown database(1049)` 自动 `CREATE DATABASE IF NOT EXISTS`（幂等）。
> **连接隔离（重要）**：checkpoint 在 LangGraph 线程池写、事件日志/业务表在主线程写，pymysql 连接非线程安全——三者**各持独立连接**，禁止复用共享连接（会协议错乱 `read of closed file`）。

### 6.2 核心表（事件日志）

> MySQL 8.0+ 语法；checkpoint 表由 `langgraph-checkpoint-mysql` 首次 `.setup()` 自动创建。

```sql
CREATE TABLE event_log (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id     VARCHAR(64) NOT NULL,
    seq         BIGINT      NOT NULL,           -- 任务内单调递增
    ts          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    type        VARCHAR(64) NOT NULL,           -- 事件类型枚举见 §6.3（task/stage/agent/tool/human/system）
    payload     JSON        NOT NULL,           -- 完整内容（prompt、工具参数与结果、审批意见）
    UNIQUE KEY uk_event_task_seq (task_id, seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_event_task ON event_log (task_id, seq);
```

> 约束：**写入只追加、不更新不删除**；任何进入模型的内容必须先在日志中有对应事件（节点层纪律：agent/request 先于模型调用，当前为人工纪律 + 代码审查把关，无强制 assert）。

### 6.2.1 tasks 业务表

```sql
CREATE TABLE tasks (
    task_id     VARCHAR(64) PRIMARY KEY,
    status      VARCHAR(32) NOT NULL,
    brief       TEXT,
    target      VARCHAR(32),
    snapshot    JSON NOT NULL,           -- 最终图状态快照（含 research/draft/review/publish_plan 等）
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> `save` 为 upsert（`INSERT ... ON DUPLICATE KEY UPDATE`，保留 created_at）；**快照入库存前剔除 `__interrupt__` 键**（LangGraph 挂起返回的 Interrupt 对象不可 JSON 序列化，否则 POST /tasks 500）。

### 6.3 事件类型枚举（唯一真相源）

统一命名：**`{domain}/{event}` 小写斜杠**。新增事件类型必须先加此表再使用（backend-style-guide §2.4 强制）。

| Domain | 事件 | 触发点 | payload 要点 |
|--------|------|--------|-------------|
| `task` | `task/created`、`task/status` | 任务创建、状态流转 | brief、status |
| `stage` | `stage/start`、`stage/end` | 图节点进入/完成 | stage 名、产物摘要 |
| `agent` | `agent/request`、`agent/response` | 模型请求发出 / 收到回复 | **prompt（模型可见必先记）**、回复 |
| `tool` | `tool/call`、`tool/result`、`tool/error` | 工具调用 / 结果 / 失败 | 工具名、参数、结果 |
| `human` | `human/approval_requested`、`human/approval_resolved` | HITL interrupt / 审批决议 | 审批上下文、action |
| `system` | `system/error`、`system/retry` | 异常、重试 | 错误信息、重试次数 |

> 一致性要求：全文（含 api-contract、style-guide、示例代码）统一用此命名，禁止混用 `stage_start` / `pipeline/stage_start` 等旧风格。

### 6.4 审批流状态

任务状态机（实际序列，与代码一致）：

```
pending → researching → writing → reviewing → publishing → awaiting_approval → done
   │            │             │           │                │                │
   └────────────┴─────────────┴───────────┴── failed/blocked/cancelled ─────┘
```

- review 通过 → `publishing`；publish 节点生成计划 + 请求审批 → `awaiting_approval`；publish_confirm interrupt 挂起，approve → `done`、reject → `blocked`
- review 超限 → `review_escalate` 节点 interrupt 挂起（`human/approval_requested(kind=review_escalation)`），approve → `done`（人工兜底发布）、reject → `blocked`

---

## 七、可观测性与 HITL

### 7.1 可观测性三层
1. **LangGraph 原生**：LangSmith 追踪（可选启用，用于开发期深度调试）
2. **自研事件日志**：生产真相源，支撑审计、回放、指标
3. **API 事件流**：`GET /tasks/:id/events` 让前端/用户实时看到 Agent 在做什么（体验层）

### 7.2 HITL 两个介入点
- **发布前**（已实现）：publish → publish_confirm interrupt 挂起 → `Command(resume={action, comment})`；approve → done、reject → blocked。注意双节点幂等规则（§4.2）
- **审核超限**（≥3 轮仍不过，已实现）：review 节点超限分支发 `human/approval_requested(kind=review_escalation)` + 置 `awaiting_approval`；`review_escalate` 节点 interrupt 挂起，resume 后 approve → done（人工兜底发布）、reject → blocked

---

## 八、安全与配置

- 密钥只进环境变量 / 凭据文件（参照 dsh：`$DSH_HOME/.credentials.yaml`），不落 `base.yaml`、不进事件日志（脱敏）
- 工具执行：本地实现默认只读为主，写操作（发布）走审批；未来可换远程沙箱（Seam 保证）
- 速率与成本：按角色配置模型档位 + 每任务 token 预算上限
- API：任务级鉴权（v0.1 单用户，预留多租户 RBAC）

---

## 九、技术风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| LangGraph v1.2 新 API 学习成本 | 中 | 开发初期慢 | 官方文档 + 最小骨架先行验证 |
| 各家模型 function calling 兼容差异 | 高 | 工具调用失败 | OpenAI 兼容适配层 + 每模型 smoke test |
| `langgraph-checkpoint-mysql` 为社区包，同步滞后 | 中 | 与官方 checkpoint 版本脱节 | 锁定版本 + 关注上游（`tjni/langgraph-checkpoint-mysql`）；异常时降级 Redis/Memory |
| MySQL ≥ 9.6 移除了 generated column 的 MD5 | 低 | checkpoint 建表失败 | 生产锁 MySQL 8.0.19 ~ 8.x（< 9.6），升级前先验证 |
| 长任务 checkpoint 体积膨胀 | 中 | 存储增长 | 事件按任务归档 + 产物外置（文件/对象存储） |
| 审核循环不收敛 | 中 | 卡死 | MAX 轮次强制转人工（HITL） |
| 事件日志写入成为性能热点 | 低 | 延迟 | 批量写 + 异步队列（v0.2 优化） |

---

## 十、路线图

| 里程碑 | 内容 | 验收标准 |
|--------|------|---------|
| **M0 骨架**（当前阶段） | 项目脚手架 + LangGraph 最小图（research→write→review→publish 空节点）+ checkpoint + 事件日志 | `python -m app.main` 跑通一条假数据流水线，日志完整可回放 |
| **M1 单角色可用** | Research 接真实搜索工具；Write 出稿；Review 打分 | 3 个真实任务，审核循环 ≤2 轮收敛 |
| **M2 HITL + API** | 审批 API + interrupt + 前端查看事件流 | 发布前人工确认链路完整 |
| **M3 演进触发**（🟡 进行中） | 多任务类型分流 → supervisor 动态路由；**①已落地**（`app/pipeline/types.py` 注册表 + 通用路由，新类型零改图） | 新任务类型零改图结构 |
| **M3 补充**（UI 落差收口） | **⑤ UI 暴露层动态化**：后端 target 动态校验已就绪（工作区未提交）；待做 `GET /api/v1/targets` 从注册表动态返回、C 端不再硬编码三选一、文案按实际流水线渲染 | 后端加一个注册类型，前端表单与文案自动跟随，无需改前端代码 |

---

## 附录：关键技术要点速查

- 图编译：`app.compile()` 一次编译，注册 checkpoint saver
- checkpoint：`MemorySaver`（dev 无库兜底）/ `PyMySQLSaver`（MySQL 8.0+，首次 `.setup()` 建表；FastAPI 异步场景用 `AIOMySQLSaver`）
- 条件边：`add_conditional_edges("review", route_after_review)`
- interrupt：`graph.invoke(input, config={"configurable": {"task_id": ...}})` + `Command(resume=...)` 恢复
- 事件埋点：节点内 `tracker.emit(task_id, "agent/request", {"prompt": ...})`
