/**
 * Content Tracking Library
 * Task #24: Content Tracking Advanced
 *
 * Client-side utility for tracking element interactions
 */

import type { ContentElement, InteractionType, ElementType, ContentType } from '@/types/contentTracking';

interface ContentTrackingConfig {
  siteId: string;
  sessionId?: string;
  visitorHash?: string;
  trackingEndpoint?: string;
}

export class ContentTracker {
  private siteId: string;
  private sessionId?: string;
  private visitorHash?: string;
  private trackingEndpoint: string;
  private trackedElements = new Map<string, HTMLElement>();
  private scrollListener?: () => void;
  private maxScrollDepth = 0;
  private pageStartTime = Date.now();

  constructor(config: ContentTrackingConfig) {
    this.siteId = config.siteId;
    this.sessionId = config.sessionId;
    this.visitorHash = config.visitorHash;
    this.trackingEndpoint = config.trackingEndpoint || '/api/content-tracking';
  }

  /**
   * Register a content element for tracking
   */
  registerElement(element: ContentElement): void {
    const selector = element.element_selector;
    const domElement = document.querySelector(selector) as HTMLElement;

    if (!domElement) {
      console.warn(`Element not found: ${selector}`);
      return;
    }

    this.trackedElements.set(element.element_id, domElement);

    // Send element registration
    this.sendRequest(`${this.trackingEndpoint}/element`, {
      site_id: this.siteId,
      element,
    });

    // Attach interaction listeners
    this.attachElementListeners(element.element_id, domElement, element.element_type);
  }

  /**
   * Track interaction
   */
  async trackInteraction(
    elementId: string,
    interactionType: InteractionType,
    details?: Record<string, any>
  ): Promise<void> {
    const interaction = {
      element_id: elementId,
      element_type: 'button' as ElementType,
      page_url: window.location.href,
      interaction_type: interactionType,
      ...details,
    };

    await this.sendRequest(`${this.trackingEndpoint}/interaction`, {
      site_id: this.siteId,
      session_id: this.sessionId,
      interaction,
      visitor_hash: this.visitorHash,
    });
  }

  /**
   * Attach listeners to element
   */
  private attachElementListeners(
    elementId: string,
    element: HTMLElement,
    elementType: ElementType
  ): void {
    let viewStartTime: number | null = null;
    let isInViewport = false;

    // Click listener
    element.addEventListener('click', (e) => {
      const rect = element.getBoundingClientRect();
      this.trackInteraction(elementId, 'click', {
        mouse_x: Math.round(e.clientX),
        mouse_y: Math.round(e.clientY),
        device_type: this.getDeviceType(),
        browser: this.getBrowserInfo().browser,
        os: this.getBrowserInfo().os,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      });
    });

    // Hover listeners
    element.addEventListener('mouseenter', () => {
      viewStartTime = Date.now();
      isInViewport = true;
    });

    element.addEventListener('mouseleave', () => {
      if (viewStartTime && isInViewport) {
        const duration = Date.now() - viewStartTime;
        this.trackInteraction(elementId, 'hover', {
          hover_duration: duration,
        });
        viewStartTime = null;
      }
      isInViewport = false;
    });

    // View tracking (Intersection Observer)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.trackInteraction(elementId, 'view', {
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
          });
        }
      });
    });

    observer.observe(element);

    // Form field tracking
    if (elementType === 'form') {
      this.trackFormFields(element, elementId);
    }
  }

  /**
   * Track form field interactions
   */
  private trackFormFields(formElement: HTMLElement, formName: string): void {
    const fields = formElement.querySelectorAll('input, textarea, select');

    fields.forEach((field: Element) => {
      const inputField = field as HTMLInputElement;
      const fieldName = inputField.name || inputField.id;

      // Focus tracking
      inputField.addEventListener('focus', () => {
        this.trackInteraction(formName, 'form_interaction', {
          form_field_name: fieldName,
          form_field_type: inputField.type,
        });
      });

      // Blur tracking
      inputField.addEventListener('blur', () => {
        const value = inputField.value;
        this.trackInteraction(formName, 'form_interaction', {
          form_field_name: fieldName,
          form_field_type: inputField.type,
          form_field_value: value ? 'filled' : 'empty',
        });
      });

      // Change tracking
      inputField.addEventListener('change', () => {
        this.trackInteraction(formName, 'form_interaction', {
          form_field_name: fieldName,
          form_field_type: inputField.type,
          form_field_value: 'changed',
        });
      });
    });

    // Form submission tracking
    formElement.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      this.trackInteraction(formName, 'form_interaction', {
        form_field_name: formName,
        form_submission_status: 'success',
      });
    });

    // Form error tracking
    formElement.addEventListener('invalid', (e) => {
      const field = e.target as HTMLInputElement;
      this.trackInteraction(formName, 'form_interaction', {
        form_field_name: field.name,
        form_field_type: field.type,
        form_submission_status: 'error',
      });
    }, true);
  }

  /**
   * Track scroll depth
   */
  startScrollTracking(): void {
    if (this.scrollListener) return;

    this.scrollListener = () => {
      const scrollPercentage = (
        (window.scrollY + window.innerHeight) /
        document.documentElement.scrollHeight
      ) * 100;

      const currentDepth = Math.round(scrollPercentage);

      if (currentDepth > this.maxScrollDepth) {
        this.maxScrollDepth = currentDepth;
      }
    };

    window.addEventListener('scroll', this.scrollListener);

    // Send final scroll depth on page unload
    window.addEventListener('beforeunload', () => {
      this.trackScrollDepth();
    });
  }

  /**
   * Send scroll depth data
   */
  private trackScrollDepth(): void {
    const timeOnPage = Math.round((Date.now() - this.pageStartTime) / 1000);

    this.sendRequest(`${this.trackingEndpoint}/scroll`, {
      site_id: this.siteId,
      session_id: this.sessionId,
      page_url: window.location.href,
      scroll_depth: this.maxScrollDepth,
      time_on_page: timeOnPage,
      visitor_hash: this.visitorHash,
    });
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  /**
   * Get browser info
   */
  private getBrowserInfo(): { browser: string; os: string } {
    const ua = navigator.userAgent;

    let browser = 'unknown';
    if (/chrome/i.test(ua)) browser = 'chrome';
    else if (/safari/i.test(ua)) browser = 'safari';
    else if (/firefox/i.test(ua)) browser = 'firefox';
    else if (/edge/i.test(ua)) browser = 'edge';

    let os = 'unknown';
    if (/windows/i.test(ua)) os = 'windows';
    else if (/mac/i.test(ua)) os = 'macos';
    else if (/linux/i.test(ua)) os = 'linux';
    else if (/android/i.test(ua)) os = 'android';
    else if (/iphone|ipad/i.test(ua)) os = 'ios';

    return { browser, os };
  }

  /**
   * Send request to tracking endpoint
   */
  private async sendRequest(endpoint: string, data: any): Promise<void> {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Content tracking error:', error);
    }
  }

  /**
   * Stop tracking and cleanup
   */
  destroy(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
    this.trackedElements.clear();
  }
}

/**
 * Helper function to initialize content tracking
 */
export function initializeContentTracking(config: ContentTrackingConfig): ContentTracker {
  const tracker = new ContentTracker(config);
  tracker.startScrollTracking();
  return tracker;
}

/**
 * Helper to track specific element by selector
 */
export function trackElement(
  tracker: ContentTracker,
  selector: string,
  elementId: string,
  elementType: ElementType = 'button'
): void {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return;
  }

  tracker.registerElement({
    element_id: elementId,
    element_type: elementType,
    element_selector: selector,
    element_text: element.textContent || undefined,
    page_url: window.location.href,
    page_title: document.title,
  } as ContentElement);
}

/**
 * Auto-discover and track all CTA buttons
 */
export function autoTrackCTAs(tracker: ContentTracker): void {
  // Track all buttons with .cta class
  document.querySelectorAll('button.cta, a.cta').forEach((btn, index) => {
    const elementId = btn.id || `cta-${index}`;
    tracker.registerElement({
      element_id: elementId,
      element_type: btn.tagName === 'BUTTON' ? 'button' : 'link',
      element_selector: `#${btn.id}` || `.cta:nth-of-type(${index + 1})`,
      element_text: btn.textContent || undefined,
      page_url: window.location.href,
      page_title: document.title,
      content_type: 'call-to-action',
    } as ContentElement);
  });
}

/**
 * Auto-discover and track all forms
 */
export function autoTrackForms(tracker: ContentTracker): void {
  document.querySelectorAll('form').forEach((form, index) => {
    const formId = form.id || `form-${index}`;
    tracker.registerElement({
      element_id: formId,
      element_type: 'form',
      element_selector: `#${form.id}` || `form:nth-of-type(${index + 1})`,
      page_url: window.location.href,
      page_title: document.title,
    } as ContentElement);
  });
}
