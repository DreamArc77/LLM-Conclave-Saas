---
title: NBA 第 45 周 —— AI 议会预测
summary: 示例周度预测页。运行 scripts/generate-verdicts.mjs --kind weekly 即可填入真实的议会预测。
lang: zh-CN
models: Gemini 3 Flash, GPT-5.2, Claude Sonnet 4.5, DeepSeek V4
rounds: 3
updated: 2026-11-05
sample: true
---

> **示例内容。** 本页展示周度预测的页面结构。真实预测由脚本读取 `content/predictions/schedule.json` 的策展赛程后生成。

## 湖人 @ 凯尔特人

议会就近期状态、休息天数、防守对位与伤病报告展开辩论。示例共识：**凯尔特人**，中等置信度。

## 预测是如何做出的

每场对局都由议会进行多轮辩论：各模型给出带置信度与依据的选择，报告汇总共识并记录分歧。
