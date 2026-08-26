---
title: 多 Agent 防幻觉措施调研 — 大厂工程落地版
date: 2026-08-16
description: 为本项目（及后续 M2/M3）防幻觉增强提供已在业界大厂生产验证的落地方案清单。核心结论是最强组合不是某一招而是五层闭环：强制检索(grounding) → 独立评审(critic) → 推理模型(reasoner) → 结构化校验(schema) → 人工兜底(HITL)。
tags:
  - AI Agent
  - 多 Agent
  - 防幻觉
  - 工程实践
---

# 多 Agent 防幻觉措施调研 — 大厂工程落地版

> 日期：2026-08-16 · 触发：真实链路 review 连续 3 轮拦截 write 幻觉（ERR-20260816-012）
> 目的：为本项目（及后续 M2/M3）防幻觉增强提供**已在业界大厂生产验证**的落地方案清单
> 配套：`.learnings/LEARNINGS.md` LRN-20260816-011（教训）· `docs/issues-log.md` [08-16] 审核防幻觉

---

## 一、核心结论

**最强的组合不是某一招，而是五层闭环**：

```
强制检索(grounding) → 独立评审(critic) → 推理模型(reasoner) → 结构化校验(schema) → 人工兜底(HITL)
```

本项目当前已落 **4/5 层**（缺推理模型），这在中小项目中已属领先；剩余增强按性价比排列见 §四。

---

## 二、八类业界落地措施（含大厂出处）

### 1. Grounding —— 强制检索证据（最根本）
生成必须基于检索证据，禁止依赖模型内部记忆。
- 出处：微软 Bing Chat/Copilot grounding；Google Vertex AI Grounding（2019 年 grounded generation 概念）；Meta RAG 论文（2020）
- 本项目：✅ 已有（Tavily 真实搜索 → research 素材 → write 素材纪律）——第一道也是最重要的闸门

### 2. 独立评审模型（Critic/Reviewer）—— 证据链二次核对
生成与审查用**不同模型**，审查对"无法核实"零容忍。
- 出处：Anthropic Constitutional AI（RLAIF 自我批评）；OpenAI o1 系列 reasoning 内自我验证；清华/微软 MultiAgent Debate（多模型辩论交叉验证降事实错误）
- 本项目：✅ 已有（review 独立模型 + 3 轮拒稿拦截幻觉——ERR-20260816-012 即其战果）

### 3. 推理模型（Reasoner）—— 输出前在推理空间验证
事实密集任务用推理模型，幻觉率显著低于直出模型。
- 出处：OpenAI o1/o3；DeepSeek-R1 系列
- 本项目：✅ **已启用（2026-08-16，`LLM_MODEL_STRONG=deepseek-v4-pro`）**——新一代命名（v4-flash/v4-pro），pro 对应原 reasoner 档位；实测可用

### 4. 结构化输出 + 程序化校验
强制 JSON schema，字段级校验，失败即重试/降级，不让非结构输出蒙混过关。
- 出处：OpenAI Structured Outputs（2024）；Anthropic tool use
- 本项目：✅ 已有（review 强制 JSON + score 0-100 校验，解析失败降级 mock + system/error）

### 5. 引用溯源（Citations）—— 每个论断可点查
无来源的论断默认不信任。
- 出处：Perplexity 全站引用；ChatGPT 网页浏览脚注；Google Gemini citations
- 本项目：🔶 部分（素材带 source，但 draft 内引用标注不规范——review 曾提"source 1/2/3 不正式"）

### 6. 工具验证（Tool-based verification）—— 用执行代替记忆
数字/可计算论断交给代码执行器；可查证论断交给实时 API。
- 出处：OpenAI Code Interpreter（数学题跑代码而非心算）
- 本项目：⬜ 未做（可增强：fact_check 工具，对 draft 论断逐条核验）

### 7. 事后幻觉检测（Post-hoc detector）
生成后跑专用检测模型打分，低分自动重写。
- 出处：OpenAI hallucination detection 研究（entropy/probing）；**Vectara HHEM**（业界标准幻觉评估模型）
- 本项目：🔶 review 本质即 LLM 版 HHEM，可增强为独立检测打分 + 自动重写

### 8. 人工把关（HITL）—— 最后防线
不可逆动作（发布）必须人工确认。
- 出处：所有内容平台（字节/阿里/百度内容产品）均有
- 本项目：⏳ M2 落地（publish 前 interrupt 审批 + review 超限转人工，架构 ADR-005 已锁定）

---

## 三、按角色覆盖度

| Agent | 应对措施 | 本项目现状 |
|-------|---------|-----------|
| research | 多源检索 + 来源评分 + 交叉验证 | ✅ 真实搜索 + score 透传；可增强多源交叉 |
| write | 素材纪律 prompt + 强模型 + 引用标注 | ✅ 素材纪律 + v4-pro 强档；🔶 引用标注待规范 |
| review | 独立模型 + 证据核对 + 结构化校验 + 多实例投票 | ✅ 前三项；🔶 多实例投票可增强 |
| publish | HITL 人工确认 | ⏳ M2 |

---

## 四、落地优先级（性价比排序，M2/M3 可选任务）

| 优先级 | 措施 | 改动量 | 收益 |
|--------|------|--------|------|
| P0 | 强档模型用 `deepseek-v4-pro`（新一代命名，对应原 reasoner） | `.env` 一行（✅ 已落地） | 幻觉率立降（写作/审查双侧） |
| P1 | draft 引用规范化（write 输出带 `[来源序号]`，review 校验） | prompt + 校验，约 1h | ✅ **已落地（2026-08-16）**：`[来源N]` 标记 + 越界程序化校验（system/error）+ review 素材上下文核验；实测 draft 22 处引用、review 可按素材序号提意见 |
| P1 | review 多实例投票（同一稿 2-3 个 review 并行，多数裁决） | 图加并行节点，约半天 | 单人评审误判率下降 |
| P2 | fact_check 工具（Seam 新工具：draft 论断 → 检索核验 → 逐条打分） | 工具 + 节点接入，约 1 天 | 幻觉检测自动化（类 HHEM） |
| P2 | **research 来源分级检索（官方域优先 + 权威源加权）** | research 节点查询构造，约半天 | ✅ **已落地（2026-08-16）**：`RESEARCH_DOMAINS` 白名单 → Tavily `include_domains` 官方域优先检索 + 普通检索补充去重（一手来源支撑 v4-pro 严格审查） |
| P2 | 低分自动重写（post-hoc 检测 < 阈值 → 自动回写 write） | 条件边扩展，约 1 天 | 免人工重试 |

---

## 五、与本项目 ADR 的关系

- ADR-003 日志即真相：以上所有措施的事件记录均走既有事件类型（tool/call、agent/request/response、system/retry 等），无需新增枚举
- ADR-004 Seam 三层：fact_check 工具按 spec/impl/registry 规范新增即可
- ADR-005 HITL：第 8 层与 M2 的 interrupt 审批一致，不冲突
