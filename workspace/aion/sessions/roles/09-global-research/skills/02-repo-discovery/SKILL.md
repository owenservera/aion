---
name: 02-repo-discovery
description: "Discover the relevant authorized GitHub repositories for cross-project research without treating partial pagination or stale inventories as complete."
---

# repo discovery


**Trigger:** every new fresh launch and any cross-repo analysis. Call GitHub accessible repository discovery and keep paging *only while returned pages prove coverage*. Cross-check GitHub search for recently changed repos, GPM canonical active list, AION local inventory and SOFTWARE_HQ indexes. Access to 100 repos is not proof of completeness; if API offsets return empty unexpectedly, flag PAGINATION_ANOMALY and use alternate search/list (without guessing). Record observed_count, source, query/page window, visibility gaps, last checked UTC and authorization. Classify repo state active/incubating/archive/vendor fork **based on evidence**, not names alone. Map canonical name, dependencies, domain and owner, then select **relevant** project recipients. A static seed list accelerates, never excludes. Never clone/write every repo just to discover applicability.
