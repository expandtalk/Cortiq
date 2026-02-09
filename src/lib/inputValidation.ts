// Input validation utilities for security
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
};

export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol) && url.length <= 2048;
  } catch {
    return false;
  }
};

export const validateDomain = (domain: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain) && domain.length <= 253;
};

export const sanitizeInput = (input: string, maxLength: number = 255): string => {
  if (!input) return '';
  return input.trim().substring(0, maxLength);
};

export const validateTrackingId = (trackingId: string): boolean => {
  return /^tk_[a-f0-9]{32}$/.test(trackingId);
};

export const validateUuid = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
};

// HTML content sanitization
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

// Safe text content setter
export const setTextContent = (element: Element, text: string): void => {
  element.textContent = text;
};

// Safe attribute setter
export const setAttribute = (element: Element, name: string, value: string): void => {
  if (['src', 'href', 'action'].includes(name)) {
    // Validate URLs for security-sensitive attributes
    if (!validateUrl(value)) return;
  }
  element.setAttribute(name, value);
};