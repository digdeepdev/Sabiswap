---
name: Homepage SEO content
description: Balances a compact homepage with crawlable descriptive content.
---

Keep the prominent homepage heading and description out of the swap area, while retaining descriptive content in initial HTML. Use a visitor-expandable section collapsed by default rather than content served only to bots.

**Why:** The user asked to hide the homepage heading and subtitle, then requested that search crawlers still have access to the description. Expandable content preserves the compact interface without relying on SEO-only hidden text.

**How to apply:** Preserve build-time rendering and test description availability without JavaScript. Do not use user-agent switching or promise that hidden text will rank. Keep essential metadata readable in the initial document.
