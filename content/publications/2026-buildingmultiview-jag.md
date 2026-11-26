---
title: "BuildingMultiView: Powering multi-scale building characterization with large language models and multi-perspective imagery"
titleZh: "BuildingMultiView：融合大语言模型与多视角影像的多尺度建筑特征提取框架"
authors:
  - "Zongrong Li"
  - "Yunlei Su"
  - "Filip Biljecki"
  - "Wufan Zhao"
authorNote: ""
highlightAuthor: "Yunlei Su"
venue: "International Journal of Applied Earth Observation and Geoinformation, Vol. 146, 105034"
year: 2026
date: "2026-01-06"
type: "journal"
indexing:
  - "SCI Q1"
  - "Open Source"
featured: true
pdf: ""
doi: "https://doi.org/10.1016/j.jag.2025.105034"
code: "https://github.com/ai4city-hkust/buildingmultiview"
dataset: ""
keywords:
  - "Multimodal LLM"
  - "Multi-perspective Imagery"
  - "Building Characterization"
  - "Street View & Satellite"
  - "GeoAI"
abstract: "Buildings play a crucial role in shaping urban environments, influencing their physical, functional, and aesthetic characteristics. However, urban analytics is frequently limited by datasets lacking essential semantic details as well as fragmentation across diverse and incompatible data sources. To address these challenges, we conducted a comprehensive meta-analysis of 6,285 publications (2019–2024) and identified 11 key visually discernible building characteristics grouped into three branches: satellite house, satellite neighborhood, and street-view. Based on this structured characteristic system, we introduce BuildingMultiView, an innovative framework leveraging fine-tuned Large Language Models (LLMs) to systematically extract semantically detailed building characteristics from integrated satellite and street-view imagery. Using structured image–prompt–label triplets, the model efficiently annotates characteristics at multiple spatial scales including swimming pools, roof types, building density, wall–window ratio, and property types. Experiments across five diverse US cities (San Francisco, San Diego, Salt Lake City, Austin, and New York City) demonstrate significant performance improvements, achieving an F1 score of 79.77% compared to 45.66% for the untuned base ChatGPT model."
bibtex: |
  @article{li2026buildingmultiview,
    title   = {BuildingMultiView: Powering multi-scale building characterization with large language models and multi-perspective imagery},
    author  = {Li, Zongrong and Su, Yunlei and Biljecki, Filip and Zhao, Wufan},
    journal = {International Journal of Applied Earth Observation and Geoinformation},
    volume  = {146},
    pages   = {105034},
    year    = {2026},
    doi     = {10.1016/j.jag.2025.105034}
  }
---

### 核心研究发现 / Key Takeaways

- **6,285 篇文献元分析与三维特征体系**：系统梳理 2019–2024 年 6,285 篇城市建筑研究文献，提炼涵盖卫星单体、卫星邻域与街景三个分支的 **11 项核心可视觉辨识建筑特征**。
- **多视角微调多模态大模型**：联合卫星影像与街景图片构建结构化「图像–提示词–标签」三元组微调多模态大语言模型，实现屋顶类型、窗墙比、建筑密度与物业类型等细粒度语义自动化标注。
- **跨城市实证性能大幅提升**：在美国五座形态各异的城市（旧金山、圣地亚哥、盐湖城、奥斯汀、纽约）验证中取得 **79.77% 的 F1 分数**（显著高于未微调基础模型的 `45.66%`）。
