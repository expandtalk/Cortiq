import type { EventConcept } from './types';

/**
 * Event ontology — what happens on a website.
 *
 * Hierarchy:
 *   event
 *   ├── navigation_event
 *   │   ├── pageview
 *   │   ├── session_start
 *   │   └── session_end
 *   ├── interaction_event
 *   │   ├── click
 *   │   ├── scroll
 *   │   ├── hover
 *   │   ├── form_event
 *   │   │   ├── form_focus, form_blur, form_change
 *   │   │   ├── form_submission
 *   │   │   └── form_error
 *   │   └── media_event
 *   │       ├── media_play, media_pause, media_seek, media_complete
 *   ├── conversion_event
 *   ├── ai_request_event
 *   │   ├── ai_scraping
 *   │   ├── ai_citation
 *   │   ├── ai_training
 *   │   └── ai_task_execution
 *   └── system_event
 *       ├── js_error
 *       └── performance_mark
 */
export const events: Record<string, EventConcept> = {

  /* ── Root ────────────────────────────────────────────────────── */

  event: {
    id: 'event',
    kind: 'event-class',
    label: 'Event',
    description: 'Any trackable action or occurrence on a website.',
    children: ['navigation_event', 'interaction_event', 'conversion_event', 'ai_request_event', 'system_event'],
  },

  /* ── Navigation ──────────────────────────────────────────────── */

  navigation_event: {
    id: 'navigation_event',
    kind: 'event-class',
    label: 'Navigation Event',
    description: 'Events related to page and session lifecycle.',
    parent: 'event',
    children: ['pageview', 'session_start', 'session_end'],
  },

  pageview: {
    id: 'pageview',
    kind: 'event-instance',
    label: 'Page View',
    description: 'A page was loaded and rendered.',
    parent: 'navigation_event',
    trackingCode: 'pageview',
  },

  session_start: {
    id: 'session_start',
    kind: 'event-instance',
    label: 'Session Start',
    description: 'A new visitor session began.',
    parent: 'navigation_event',
    trackingCode: 'session_start',
  },

  session_end: {
    id: 'session_end',
    kind: 'event-instance',
    label: 'Session End',
    description: 'A visitor session ended (timeout or explicit close).',
    parent: 'navigation_event',
    trackingCode: 'session_end',
  },

  /* ── Interactions ────────────────────────────────────────────── */

  interaction_event: {
    id: 'interaction_event',
    kind: 'event-class',
    label: 'Interaction Event',
    description: 'Direct user interactions with page elements.',
    parent: 'event',
    children: ['click', 'scroll', 'hover', 'form_event', 'media_event'],
  },

  click: {
    id: 'click',
    kind: 'event-instance',
    label: 'Click',
    description: 'User clicked on an element.',
    parent: 'interaction_event',
    trackingCode: 'click',
  },

  scroll: {
    id: 'scroll',
    kind: 'event-instance',
    label: 'Scroll',
    description: 'User scrolled the page.',
    parent: 'interaction_event',
    trackingCode: 'scroll',
  },

  hover: {
    id: 'hover',
    kind: 'event-instance',
    label: 'Hover',
    description: 'User hovered over an element.',
    parent: 'interaction_event',
    trackingCode: 'hover',
  },

  /* ── Form events ─────────────────────────────────────────────── */

  form_event: {
    id: 'form_event',
    kind: 'event-class',
    label: 'Form Event',
    description: 'Events within a form interaction flow.',
    parent: 'interaction_event',
    children: ['form_focus', 'form_blur', 'form_change', 'form_submission', 'form_error'],
  },

  form_focus: {
    id: 'form_focus',
    kind: 'event-instance',
    label: 'Form Focus',
    description: 'User focused a form field.',
    parent: 'form_event',
    trackingCode: 'focus',
  },

  form_blur: {
    id: 'form_blur',
    kind: 'event-instance',
    label: 'Form Blur',
    description: 'User left a form field.',
    parent: 'form_event',
    trackingCode: 'blur',
  },

  form_change: {
    id: 'form_change',
    kind: 'event-instance',
    label: 'Form Change',
    description: 'User changed a form field value.',
    parent: 'form_event',
    trackingCode: 'change',
  },

  form_submission: {
    id: 'form_submission',
    kind: 'event-instance',
    label: 'Form Submission',
    description: 'User submitted a form.',
    parent: 'form_event',
    trackingCode: 'form_submission',
  },

  form_error: {
    id: 'form_error',
    kind: 'event-instance',
    label: 'Form Error',
    description: 'A form validation or submission error occurred.',
    parent: 'form_event',
    trackingCode: 'error',
  },

  /* ── Media events ────────────────────────────────────────────── */

  media_event: {
    id: 'media_event',
    kind: 'event-class',
    label: 'Media Event',
    description: 'Events from audio/video player interactions.',
    parent: 'interaction_event',
    children: ['media_play', 'media_pause', 'media_seek', 'media_complete'],
  },

  media_play: {
    id: 'media_play',
    kind: 'event-instance',
    label: 'Media Play',
    description: 'User started or resumed playback.',
    parent: 'media_event',
    trackingCode: 'play',
  },

  media_pause: {
    id: 'media_pause',
    kind: 'event-instance',
    label: 'Media Pause',
    description: 'User paused playback.',
    parent: 'media_event',
    trackingCode: 'pause',
  },

  media_seek: {
    id: 'media_seek',
    kind: 'event-instance',
    label: 'Media Seek',
    description: 'User seeked to a different position.',
    parent: 'media_event',
    trackingCode: 'seek',
  },

  media_complete: {
    id: 'media_complete',
    kind: 'event-instance',
    label: 'Media Complete',
    description: 'Media played to completion.',
    parent: 'media_event',
    trackingCode: 'complete',
  },

  /* ── Conversions ─────────────────────────────────────────────── */

  conversion_event: {
    id: 'conversion_event',
    kind: 'event-class',
    label: 'Conversion Event',
    description: 'Actions representing business goal completions — purchases, signups, leads.',
    parent: 'event',
    trackingCode: 'conversion',
  },

  /* ── AI request events ───────────────────────────────────────── */

  ai_request_event: {
    id: 'ai_request_event',
    kind: 'event-class',
    label: 'AI Request Event',
    description: 'Requests made by AI agents rather than human visitors.',
    parent: 'event',
    children: ['ai_scraping', 'ai_citation', 'ai_training', 'ai_task_execution'],
  },

  ai_scraping: {
    id: 'ai_scraping',
    kind: 'event-instance',
    label: 'AI Scraping',
    description: 'AI agent is reading content to inform a response.',
    parent: 'ai_request_event',
    trackingCode: 'scraping',
  },

  ai_citation: {
    id: 'ai_citation',
    kind: 'event-instance',
    label: 'AI Citation',
    description: 'AI agent is citing this page in a response shown to an end user.',
    parent: 'ai_request_event',
    trackingCode: 'citation',
  },

  ai_training: {
    id: 'ai_training',
    kind: 'event-instance',
    label: 'AI Training Crawl',
    description: 'AI agent is collecting this page\'s content to train a model.',
    parent: 'ai_request_event',
    trackingCode: 'training',
  },

  ai_task_execution: {
    id: 'ai_task_execution',
    kind: 'event-instance',
    label: 'AI Task Execution',
    description: 'AI agent is completing a user-delegated task on this site (form fill, purchase, etc.).',
    parent: 'ai_request_event',
    trackingCode: 'ai_task',
  },

  /* ── System events ───────────────────────────────────────────── */

  system_event: {
    id: 'system_event',
    kind: 'event-class',
    label: 'System Event',
    description: 'Browser or application-level events not directly triggered by user intent.',
    parent: 'event',
    children: ['js_error', 'performance_mark'],
  },

  js_error: {
    id: 'js_error',
    kind: 'event-instance',
    label: 'JavaScript Error',
    description: 'An unhandled JavaScript error occurred.',
    parent: 'system_event',
    trackingCode: 'error',
  },

  performance_mark: {
    id: 'performance_mark',
    kind: 'event-instance',
    label: 'Performance Mark',
    description: 'A Web Vitals or custom performance timing was recorded.',
    parent: 'system_event',
    trackingCode: 'performance',
  },
};
