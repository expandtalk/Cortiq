import type { AgentConcept } from './types';

/**
 * Agent ontology — who or what generates web traffic.
 *
 * Hierarchy:
 *   web_agent
 *   ├── human_visitor
 *   └── automated_agent
 *       ├── ai_agent
 *       │   ├── browser_ai_agent     (renders pages, executes JS)
 *       │   │   ├── chatgpt_browser
 *       │   │   ├── perplexity_comet
 *       │   │   ├── claude_browser
 *       │   │   └── copilot_browser
 *       │   └── text_ai_agent        (raw HTTP, no JS)
 *       │       ├── gemini
 *       │       ├── grok
 *       │       └── meta_ai
 *       ├── search_bot
 *       │   ├── googlebot
 *       │   └── bingbot
 *       └── training_crawler
 *           └── gptbot_training
 */
export const agents: Record<string, AgentConcept> = {

  /* ── Abstract roots ──────────────────────────────────────────── */

  web_agent: {
    id: 'web_agent',
    kind: 'agent-class',
    label: 'Web Agent',
    description: 'Any entity that generates web traffic — human or automated.',
    children: ['human_visitor', 'automated_agent'],
  },

  human_visitor: {
    id: 'human_visitor',
    kind: 'agent-class',
    label: 'Human Visitor',
    description: 'A real human using a browser to navigate a website.',
    parent: 'web_agent',
    browserType: 'visual',
  },

  automated_agent: {
    id: 'automated_agent',
    kind: 'agent-class',
    label: 'Automated Agent',
    description: 'Software that accesses websites without direct human interaction.',
    parent: 'web_agent',
    children: ['ai_agent', 'search_bot', 'training_crawler'],
  },

  /* ── AI agents ───────────────────────────────────────────────── */

  ai_agent: {
    id: 'ai_agent',
    kind: 'agent-class',
    label: 'AI Agent',
    description: 'LLM-driven agents that browse the web, cite content, or execute user tasks.',
    parent: 'automated_agent',
    children: ['browser_ai_agent', 'text_ai_agent'],
  },

  browser_ai_agent: {
    id: 'browser_ai_agent',
    kind: 'agent-class',
    label: 'Browser AI Agent',
    description: 'AI agent that renders pages with a full browser, executes JavaScript, and perceives pages visually.',
    parent: 'ai_agent',
    browserType: 'visual',
    children: ['chatgpt_browser', 'perplexity_comet', 'claude_browser', 'copilot_browser'],
  },

  text_ai_agent: {
    id: 'text_ai_agent',
    kind: 'agent-class',
    label: 'Text-Based AI Agent',
    description: 'AI agent that fetches content via raw HTTP without rendering — processes text/markdown.',
    parent: 'ai_agent',
    browserType: 'text-based',
    children: ['gemini', 'grok', 'meta_ai'],
  },

  /* ── Browser AI instances ────────────────────────────────────── */

  chatgpt_browser: {
    id: 'chatgpt_browser',
    kind: 'agent-instance',
    label: 'ChatGPT Browser',
    description: 'OpenAI\'s web-browsing agent used in ChatGPT and GPT plugins.',
    parent: 'browser_ai_agent',
    vendor: 'openai',
    uaPatterns: ['ChatGPT', 'GPTBot', 'OpenAI'],
    aliases: ['GPTBot', 'ChatGPT Plugin'],
    browserType: 'visual',
  },

  perplexity_comet: {
    id: 'perplexity_comet',
    kind: 'agent-instance',
    label: 'Perplexity Comet',
    description: 'Perplexity\'s agentic browser that browses the web to answer queries.',
    parent: 'browser_ai_agent',
    vendor: 'perplexity',
    uaPatterns: ['PerplexityBot', 'Perplexity'],
    browserType: 'visual',
  },

  claude_browser: {
    id: 'claude_browser',
    kind: 'agent-instance',
    label: 'Claude Browser',
    description: 'Anthropic\'s Claude agent with web browsing capability.',
    parent: 'browser_ai_agent',
    vendor: 'anthropic',
    uaPatterns: ['ClaudeBot', 'Anthropic'],
    aliases: ['ClaudeBot'],
    browserType: 'visual',
  },

  copilot_browser: {
    id: 'copilot_browser',
    kind: 'agent-instance',
    label: 'Microsoft Copilot',
    description: 'Microsoft\'s AI assistant with web browsing via Bing.',
    parent: 'browser_ai_agent',
    vendor: 'microsoft',
    uaPatterns: ['Copilot', 'BingBot', 'BingPreview'],
    browserType: 'visual',
  },

  /* ── Text AI instances ───────────────────────────────────────── */

  gemini: {
    id: 'gemini',
    kind: 'agent-instance',
    label: 'Google Gemini',
    description: 'Google\'s AI that fetches web content to ground its responses.',
    parent: 'text_ai_agent',
    vendor: 'google',
    uaPatterns: ['GoogleOther', 'Bard'],
    browserType: 'text-based',
  },

  grok: {
    id: 'grok',
    kind: 'agent-instance',
    label: 'Grok / xAI',
    description: 'xAI\'s (formerly Twitter/X) AI agent.',
    parent: 'text_ai_agent',
    vendor: 'xai',
    uaPatterns: ['Grok', 'TwitterBot'],
    browserType: 'text-based',
  },

  meta_ai: {
    id: 'meta_ai',
    kind: 'agent-instance',
    label: 'Meta AI',
    description: 'Meta\'s AI assistant that accesses web content.',
    parent: 'text_ai_agent',
    vendor: 'meta',
    uaPatterns: ['facebookexternalhit', 'Meta'],
    browserType: 'text-based',
  },

  /* ── Search bots ─────────────────────────────────────────────── */

  search_bot: {
    id: 'search_bot',
    kind: 'agent-class',
    label: 'Search Bot',
    description: 'Bots that index content for traditional search engines.',
    parent: 'automated_agent',
    children: ['googlebot', 'bingbot', 'adidxbot', 'bing_preview', 'microsoft_preview', 'bing_video_preview'],
  },

  googlebot: {
    id: 'googlebot',
    kind: 'agent-instance',
    label: 'Googlebot',
    description: 'Google\'s web crawler for search indexing.',
    parent: 'search_bot',
    vendor: 'google',
    uaPatterns: ['Googlebot'],
    browserType: 'headless',
  },

  bingbot: {
    id: 'bingbot',
    kind: 'agent-instance',
    label: 'Bingbot',
    description: 'Microsoft\'s standard web crawler for Bing search indexing.',
    parent: 'search_bot',
    vendor: 'microsoft',
    uaPatterns: ['bingbot'],
    browserType: 'headless',
  },

  adidxbot: {
    id: 'adidxbot',
    kind: 'agent-instance',
    label: 'AdIdxBot',
    description: 'Bing Ads crawler — crawls ads and follows their landing pages for quality control.',
    parent: 'search_bot',
    vendor: 'microsoft',
    uaPatterns: ['adidxbot'],
    browserType: 'headless',
  },

  bing_preview: {
    id: 'bing_preview',
    kind: 'agent-instance',
    label: 'BingPreview',
    description: 'Generates page snapshots for Bing search results.',
    parent: 'search_bot',
    vendor: 'microsoft',
    uaPatterns: ['BingPreview'],
    browserType: 'headless',
  },

  microsoft_preview: {
    id: 'microsoft_preview',
    kind: 'agent-instance',
    label: 'MicrosoftPreview',
    description: 'Generates page snapshots for Microsoft products (Teams, Outlook link previews, etc.).',
    parent: 'search_bot',
    vendor: 'microsoft',
    uaPatterns: ['MicrosoftPreview'],
    browserType: 'headless',
  },

  bing_video_preview: {
    id: 'bing_video_preview',
    kind: 'agent-instance',
    label: 'BingVideoPreview',
    description: 'Crawls and generates video previews for Bing.',
    parent: 'search_bot',
    vendor: 'microsoft',
    uaPatterns: ['BingVideoPreview'],
    browserType: 'headless',
  },

  /* ── Training crawlers ───────────────────────────────────────── */

  training_crawler: {
    id: 'training_crawler',
    kind: 'agent-class',
    label: 'Training Crawler',
    description: 'Bots that collect data to train AI/ML models.',
    parent: 'automated_agent',
    children: ['gptbot_training', 'common_crawl'],
  },

  gptbot_training: {
    id: 'gptbot_training',
    kind: 'agent-instance',
    label: 'GPTBot (Training)',
    description: 'OpenAI\'s crawler collecting training data for GPT models.',
    parent: 'training_crawler',
    vendor: 'openai',
    uaPatterns: ['GPTBot'],
    browserType: 'text-based',
  },

  common_crawl: {
    id: 'common_crawl',
    kind: 'agent-instance',
    label: 'Common Crawl',
    description: 'Open repository of web crawl data, widely used for LLM training.',
    parent: 'training_crawler',
    uaPatterns: ['CCBot'],
    browserType: 'text-based',
  },
};
