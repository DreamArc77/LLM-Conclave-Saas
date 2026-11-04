---
title: NBA 第45週 —— AIカウンシル予測
summary: サンプルの週次予測ページです。scripts/generate-verdicts.mjs --kind weekly を実行すると実際の予測に置き換わります。
lang: ja
models: Gemini 3 Flash, GPT-5.2, Claude Sonnet 4.5, DeepSeek V4
rounds: 3
updated: 2026-11-05
sample: true
---

> **サンプルコンテンツ。** 週次予測の構造例です。実際の予測は `content/predictions/schedule.json` の厳選された日程からスクリプトが生成します。

## レイカーズ @ セルティックス

直近の調子、休養日数、ディフェンスのマッチアップ、故障者情報をカウンシルが討論。サンプル合意：**セルティックス**、中程度の確信度。

## 予測の作り方

各カードはカウンシルによるラウンド制ディベートで判定されます。各モデルが確信度と根拠を伴う予測を示し、レポートが合意と異論を記録します。
