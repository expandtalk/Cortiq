/**
 * Form Analytics Tracking Module
 * Automatically detects and tracks Contact Form 7, Gravity Forms, WooCommerce, and custom forms
 */

class FormTracker {
  constructor(siteId, sessionId) {
    this.siteId = siteId;
    this.sessionId = sessionId;
    this.trackedForms = new Map();
    this.formSessions = new Map();
    this.fieldInteractions = new Map();
    
    this.init();
  }

  init() {
    // Detect forms on page load
    this.detectForms();
    
    // Set up mutation observer for dynamically loaded forms
    this.setupMutationObserver();
    
    // Track page unload to save final data
    window.addEventListener('beforeunload', () => this.savePendingData());
  }

  detectForms() {
    // Contact Form 7
    document.querySelectorAll('.wpcf7-form').forEach(form => {
      this.trackForm(form, 'contact_form_7');
    });

    // Gravity Forms
    document.querySelectorAll('.gform_wrapper form').forEach(form => {
      this.trackForm(form, 'gravity_forms');
    });

    // WooCommerce Checkout
    document.querySelectorAll('.woocommerce-checkout form').forEach(form => {
      this.trackForm(form, 'woocommerce_checkout');
    });

    // Generic forms (fallback)
    document.querySelectorAll('form').forEach(form => {
      if (!form.closest('.wpcf7-form, .gform_wrapper, .woocommerce-checkout')) {
        // Only track forms with enough fields to be meaningful
        const fields = this.getFormFields(form);
        if (fields.length >= 2) {
          this.trackForm(form, 'custom');
        }
      }
    });
  }

  trackForm(form, formType) {
    const formId = this.getFormId(form, formType);
    const formName = this.getFormName(form, formType);
    
    if (this.trackedForms.has(formId)) return; // Already tracking
    
    const fields = this.getFormFields(form);
    const formData = {
      formId,
      formType,
      formName,
      fields,
      element: form,
      startTime: null,
      completed: false,
      abandoned: false,
      errorCount: 0,
      fieldsCompleted: 0
    };
    
    this.trackedForms.set(formId, formData);
    this.setupFormListeners(form, formData);
    
    console.log(`📋 Tracking form: ${formName} (${formType})`);
  }

  getFormId(form, formType) {
    switch (formType) {
      case 'contact_form_7':
        return form.closest('.wpcf7').id || `cf7_${Date.now()}`;
      case 'gravity_forms':
        const gformId = form.id.match(/gform_(\d+)/);
        return gformId ? `gf_${gformId[1]}` : `gf_${Date.now()}`;
      case 'woocommerce_checkout':
        return 'wc_checkout';
      default:
        return form.id || `form_${Date.now()}`;
    }
  }

  getFormName(form, formType) {
    switch (formType) {
      case 'contact_form_7':
        const cf7Title = form.closest('.wpcf7').querySelector('.wpcf7-form-title');
        return cf7Title ? cf7Title.textContent : 'Contact Form 7';
      case 'gravity_forms':
        const gfTitle = form.closest('.gform_wrapper').querySelector('.gform_title');
        return gfTitle ? gfTitle.textContent : 'Gravity Form';
      case 'woocommerce_checkout':
        return 'WooCommerce Checkout';
      default:
        const title = form.getAttribute('data-title') || 
                     form.querySelector('h1, h2, h3, h4')?.textContent ||
                     'Custom Form';
        return title.substring(0, 100); // Limit length
    }
  }

  getFormFields(form) {
    const fields = [];
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input, index) => {
      // Skip hidden, submit, and button inputs
      if (['hidden', 'submit', 'button', 'reset'].includes(input.type)) return;
      
      const fieldData = {
        name: input.name || input.id || `field_${index}`,
        type: input.type || input.tagName.toLowerCase(),
        label: this.getFieldLabel(input),
        position: index + 1,
        required: input.required || input.hasAttribute('required'),
        element: input
      };
      
      fields.push(fieldData);
    });
    
    return fields;
  }

  getFieldLabel(input) {
    // Try multiple methods to find label
    const id = input.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent.trim();
    }
    
    // Look for closest label
    const closestLabel = input.closest('label');
    if (closestLabel) return closestLabel.textContent.replace(input.value, '').trim();
    
    // Look for placeholder
    if (input.placeholder) return input.placeholder;
    
    // Look for data attributes
    if (input.dataset.label) return input.dataset.label;
    
    // Fallback to name/id
    return input.name || input.id || input.type;
  }

  setupFormListeners(form, formData) {
    const { formId, fields } = formData;
    
    // Track form start (first interaction)
    const trackStart = () => {
      if (!formData.startTime) {
        formData.startTime = Date.now();
        this.trackFormStart(formData);
      }
    };

    // Track field interactions
    fields.forEach(field => {
      const { element, name } = field;
      let focusStartTime = null;
      
      // Focus tracking
      element.addEventListener('focus', () => {
        trackStart();
        focusStartTime = Date.now();
        this.trackFieldInteraction(formId, field, 'focus');
      });

      // Blur tracking (calculate focus time)
      element.addEventListener('blur', () => {
        if (focusStartTime) {
          const focusTime = Date.now() - focusStartTime;
          this.trackFieldInteraction(formId, field, 'blur', null, focusTime);
          focusStartTime = null;
        }
      });

      // Input tracking
      element.addEventListener('input', () => {
        this.trackFieldInteraction(formId, field, 'input');
      });

      // Error tracking (for validation)
      element.addEventListener('invalid', () => {
        formData.errorCount++;
        this.trackFieldInteraction(formId, field, 'error', element.validationMessage);
      });
    });

    // Form submission tracking
    form.addEventListener('submit', (e) => {
      this.trackFormCompletion(formData);
    });

    // Track abandonment (user leaves form area)
    let isInForm = false;
    form.addEventListener('mouseenter', () => isInForm = true);
    form.addEventListener('mouseleave', () => isInForm = false);
    
    // If user scrolls away or focuses elsewhere for too long, mark as abandoned
    let abandonTimer;
    document.addEventListener('click', (e) => {
      if (!form.contains(e.target) && formData.startTime && !formData.completed) {
        clearTimeout(abandonTimer);
        abandonTimer = setTimeout(() => {
          if (!isInForm && !formData.completed) {
            this.trackFormAbandonment(formData);
          }
        }, 30000); // 30 seconds outside form = abandonment
      }
    });
  }

  trackFormStart(formData) {
    const sessionData = {
      site_id: this.siteId,
      session_id: this.sessionId,
      form_id: formData.formId,
      form_type: formData.formType,
      started_at: new Date().toISOString(),
      total_fields: formData.fields.length,
      device_type: this.getDeviceType(),
      user_agent: navigator.userAgent,
      ip_address: null // Will be set server-side
    };
    
    this.formSessions.set(formData.formId, sessionData);
    
    // Send to backend
    this.sendFormAnalytics('form_start', {
      ...sessionData,
      form_name: formData.formName
    });
  }

  trackFormCompletion(formData) {
    if (formData.completed) return;
    
    formData.completed = true;
    const completionTime = Date.now() - formData.startTime;
    
    const sessionData = this.formSessions.get(formData.formId);
    if (sessionData) {
      sessionData.completed_at = new Date().toISOString();
      sessionData.completion_time = Math.floor(completionTime / 1000);
      sessionData.fields_completed = this.countCompletedFields(formData);
      sessionData.error_count = formData.errorCount;
    }
    
    // Send completion data
    this.sendFormAnalytics('form_complete', {
      form_id: formData.formId,
      form_type: formData.formType,
      form_name: formData.formName,
      completion_time: Math.floor(completionTime / 1000),
      fields_completed: sessionData?.fields_completed || 0,
      total_fields: formData.fields.length,
      error_count: formData.errorCount
    });
  }

  trackFormAbandonment(formData) {
    if (formData.abandoned || formData.completed) return;
    
    formData.abandoned = true;
    const sessionData = this.formSessions.get(formData.formId);
    
    if (sessionData) {
      sessionData.abandoned_at = new Date().toISOString();
      sessionData.fields_completed = this.countCompletedFields(formData);
      sessionData.error_count = formData.errorCount;
    }
    
    // Send abandonment data
    this.sendFormAnalytics('form_abandon', {
      form_id: formData.formId,
      form_type: formData.formType,
      form_name: formData.formName,
      fields_completed: sessionData?.fields_completed || 0,
      total_fields: formData.fields.length,
      time_spent: Date.now() - formData.startTime
    });
  }

  trackFieldInteraction(formId, field, interactionType, value = null, focusTime = null) {
    const interaction = {
      site_id: this.siteId,
      session_id: this.sessionId,
      form_id: formId,
      field_name: field.name,
      interaction_type: interactionType,
      interaction_value: value,
      focus_time: focusTime,
      field_position: field.position,
      timestamp_ms: Date.now()
    };
    
    // Store for batch sending
    const key = `${formId}_${field.name}`;
    if (!this.fieldInteractions.has(key)) {
      this.fieldInteractions.set(key, []);
    }
    this.fieldInteractions.get(key).push(interaction);
    
    // Send field data periodically
    if (this.fieldInteractions.get(key).length >= 10) {
      this.sendFieldInteractions(key);
    }
  }

  countCompletedFields(formData) {
    return formData.fields.filter(field => {
      const element = field.element;
      return element.value && element.value.trim() !== '';
    }).length;
  }

  getDeviceType() {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  sendFormAnalytics(type, data) {
    // Send to tracking endpoint
    fetch('/wp-admin/admin-ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'heatmap_form_tracking',
        type: type,
        data: JSON.stringify(data),
        nonce: window.heatmapTracking?.nonce
      })
    }).catch(error => {
      console.error('Form tracking error:', error);
    });
  }

  sendFieldInteractions(key) {
    const interactions = this.fieldInteractions.get(key);
    if (!interactions || interactions.length === 0) return;
    
    fetch('/wp-admin/admin-ajax.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'heatmap_field_tracking',
        interactions: JSON.stringify(interactions),
        nonce: window.heatmapTracking?.nonce
      })
    }).then(() => {
      // Clear sent interactions
      this.fieldInteractions.set(key, []);
    }).catch(error => {
      console.error('Field tracking error:', error);
    });
  }

  savePendingData() {
    // Send any remaining field interactions
    this.fieldInteractions.forEach((interactions, key) => {
      if (interactions.length > 0) {
        this.sendFieldInteractions(key);
      }
    });
    
    // Mark any ongoing forms as abandoned
    this.trackedForms.forEach(formData => {
      if (formData.startTime && !formData.completed && !formData.abandoned) {
        this.trackFormAbandonment(formData);
      }
    });
  }

  setupMutationObserver() {
    // Watch for dynamically added forms
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node contains forms
            const forms = node.querySelectorAll('form');
            forms.forEach(form => {
              // Re-detect form type and track if not already tracked
              setTimeout(() => this.detectForms(), 100);
            });
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Form field interactions are session-linked personal data under ePrivacy Art. 5(3)
// / GDPR Art. 6.1.a — require analytics consent before tracking, mirroring spa-tracking.js.
function cortiqHasAnalyticsConsent() {
  try {
    const stored = localStorage.getItem('site_cookie_consent');
    if (stored && JSON.parse(stored).analytics === true) return true;
  } catch (_) {}
  try {
    if (window.Cookiebot?.consent?.statistics === true) return true;
  } catch (_) {}
  return false;
}

function cortiqStartFormTracking() {
  if (!window.heatmapTracking || !window.heatmapTracking.siteId || !window.heatmapTracking.sessionId) return;
  new FormTracker(window.heatmapTracking.siteId, window.heatmapTracking.sessionId);
}

// Initialize form tracking when DOM is ready — but only after analytics consent.
if (typeof window.heatmapTracking !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (cortiqHasAnalyticsConsent()) {
      cortiqStartFormTracking();
    } else {
      window.addEventListener('siteConsentUpdated', function handler(e) {
        if (e.detail?.analytics) {
          window.removeEventListener('siteConsentUpdated', handler);
          cortiqStartFormTracking();
        }
      });
    }
  });
}