# CortIQ Documentation Blog

SEO-optimized documentation blog for CortIQ Analytics Platform.

## Overview

This folder contains high-quality, SEO-optimized blog posts about:
- AI agent tracking
- Analytics best practices
- GDPR compliance
- Privacy-first design
- WordPress integration
- Advanced features

## Blog Structure

```
blog/
├── index.md                          # Blog index & guidelines
├── 01-agentic-web-guide.md          # What is the Agentic Web
├── 02-ai-agent-tracking.md          # How to Track AI Agents
├── 03-gdpr-analytics.md             # GDPR Compliant Analytics
├── 04-wordpress-analytics.md        # WordPress Analytics (planned)
├── 05-heatmap-guide.md              # Heatmap Analytics Guide (planned)
├── 06-session-recording.md          # Session Recording & Replay (planned)
├── 07-ab-testing.md                 # A/B Testing for Conversions (planned)
├── 08-form-analytics.md             # Form Analytics & Drop-off (planned)
├── 09-integrations.md               # Integration Guide (planned)
├── 10-wordpress-plugin.md           # WordPress Plugin Setup (planned)
└── README.md                         # This file
```

## SEO Optimization

### Frontmatter Format

Each post includes optimized frontmatter:

```yaml
---
title: "Post Title (50-60 characters)"
description: "Meta description (150-160 characters)"
author: "Author Name"
date: "YYYY-MM-DD"
category: "Category Name"
tags: ["tag1", "tag2", "tag3"]
slug: "url-slug"
image: "path/to/image.png"
imageAlt: "Descriptive alt text"
readingTime: "X min read"
---
```

### Title Guidelines

- **Length**: 50-60 characters (optimal for Google SERP)
- **Keywords**: Include primary keyword
- **Format**: Question or benefit-focused
- **Examples**:
  - "What is the Agentic Web? The Future of Web Traffic 2025"
  - "How to Track AI Agents Visiting Your Website - Complete Guide"
  - "GDPR Compliant Analytics: Complete Guide 2025"

### Meta Description Guidelines

- **Length**: 150-160 characters
- **Keywords**: Include primary and secondary keywords
- **Format**: Action-oriented, benefit-focused
- **Call-to-action**: Optional but effective
- **Examples**:
  - "Discover the agentic web: AI agents like ChatGPT Browser now drive 10-15% of web traffic. Learn how to track and optimize for AI agents."
  - "Learn how to identify and track AI agent traffic from ChatGPT Browser, Perplexity, and Claude. Step-by-step guide with examples."

### Heading Structure

```markdown
# Main Title (H1)            # Only one per post
## Section (H2)              # Main sections
### Subsection (H3)          # Detailed subsections
#### Detail (H4)             # If needed
```

### Internal Linking

Each post should link to:
- 3-5 other relevant blog posts
- Related documentation pages
- CortIQ signup/demo pages
- Feature documentation

**Example**:
```markdown
## Related Articles

- [What is the Agentic Web?](/blog/what-is-agentic-web)
- [How to Track AI Agents](/blog/how-to-track-ai-agents)
- [Optimizing for the Agentic Web](/blog/agentic-seo)
```

## Content Calendar

### Month 1 (Foundation)
- ✅ What is the Agentic Web
- ✅ How to Track AI Agents
- ✅ GDPR Compliant Analytics
- 📝 WordPress Analytics
- 📝 Heatmap Guide

### Month 2 (Advanced Features)
- 📝 Session Recording
- 📝 A/B Testing
- 📝 Form Analytics
- 📝 Integration Guide
- 📝 WordPress Plugin

### Month 3+ (Expansion)
- 📝 Case studies
- 📝 Customer interviews
- 📝 Expert guides
- 📝 Industry trends
- 📝 Advanced tutorials

## Publishing Workflow

### Step 1: Create Draft
1. Copy template from `index.md`
2. Write in markdown
3. Include all frontmatter
4. Save as `NN-slug.md`

### Step 2: Review Checklist
- [ ] Title is 50-60 characters
- [ ] Meta description is 150-160 characters
- [ ] Slug is URL-friendly
- [ ] Headings follow H1 → H2 → H3 structure
- [ ] 3+ internal links included
- [ ] Image alt text is descriptive
- [ ] Reading time is accurate
- [ ] Category and tags assigned
- [ ] Spelling and grammar checked

### Step 3: Optimize for SEO
- [ ] Primary keyword in H1
- [ ] Secondary keywords in H2/H3
- [ ] Long-tail keyword in body
- [ ] Keywords naturally distributed
- [ ] Call-to-action included
- [ ] Meta description preview looks good

### Step 4: Publish
1. Merge to main branch
2. Deploy website
3. Monitor in Google Search Console
4. Share on social media

## Performance Metrics

Monitor these metrics in Google Search Console:

- **Impressions**: How often your page appears in search
- **Clicks**: How many people visit from search
- **Average Position**: Your ranking (target: Top 3)
- **Click-Through Rate (CTR)**: Clicks / Impressions (target: >3%)

### Monthly Goals

- **Organic Traffic**: +20% month-over-month
- **Average Position**: Improve to top 3 for primary keywords
- **CTR**: >5% for primary keywords
- **Backlinks**: +2-3 high-quality backlinks

## Tools & Resources

### Writing
- [Hemingway Editor](http://hemingwayapp.com/) - Readability checker
- [Google Docs](https://docs.google.com) - Collaborative writing

### SEO
- [Google Search Console](https://search.google.com/search-console) - Performance monitoring
- [Keyword Planner](https://ads.google.com/home/tools/keyword-planner/) - Keyword research
- [SEMrush](https://www.semrush.com) - Competitor analysis

### Content
- [Grammarly](https://www.grammarly.com) - Grammar & style
- [Copyscape](https://www.copyscape.com) - Plagiarism check
- [DALL-E](https://openai.com/dall-e-2/) or [Midjourney](https://www.midjourney.com) - Images

## Publishing Platform

### Static Site Generator (Recommended)
- **Hugo**, **Jekyll**, or **Next.js** with markdown support
- Auto-generates pages from markdown files
- Built-in SEO optimization
- Fast performance (static HTML)

### Setup for Hugo Example

```bash
# Create blog section
hugo new -k default content/blog/_index.md
hugo new content/blog/01-agentic-web-guide.md

# Build
hugo

# Deploy to cortiq.se
```

### Setup for Next.js Example

```bash
# Install
npm install gray-matter remark remark-html

# Create pages/blog/[slug].js
# Dynamically load markdown files
# Auto-generate page routes
```

## Distribution

After publishing, share on:

1. **Social Media**
   - Twitter: Technical audience
   - LinkedIn: B2B audience
   - Reddit: Community engagement

2. **Email**
   - Existing customers
   - Newsletter subscribers
   - New trial signups

3. **Communities**
   - Dev.to
   - HackerNews
   - Reddit (r/analytics, r/wordpress)
   - Product Hunt

4. **Partnerships**
   - Guest posts on partner blogs
   - Reciprocal link exchanges
   - Featured in partner newsletters

## Success Criteria

### Traffic Targets
- 1,000+ monthly views per article (3-6 months)
- 50+ qualified leads per month
- 10%+ conversion rate to signups

### SEO Targets
- Top 3 ranking for primary keywords
- 10+ articles ranking on page 1
- 100+ organic backlinks total

### Engagement Targets
- 3+ minutes average time on page
- <50% bounce rate
- 5+ internal links per article (average)

## Maintenance

### Monthly Review
- Check Search Console performance
- Monitor traffic trends
- Update outdated information
- Fix broken links
- Refresh high-performing articles

### Quarterly Updates
- Add new blog posts
- Update evergreen content
- Refresh data and statistics
- Improve underperforming articles

## Questions?

For documentation questions, see:
- [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [INTEGRATION-GUIDE.md](../INTEGRATION-GUIDE.md)
