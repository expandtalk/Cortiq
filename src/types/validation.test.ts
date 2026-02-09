import { describe, it, expect } from 'vitest';
import {
  EmailSchema,
  PasswordSchema,
  UrlSchema,
  DomainSchema,
  UUIDSchema,
  TrackingIdSchema,
  NameSchema,
  SignUpSchema,
  LoginSchema,
  CreateCompanySchema,
  CreateSiteSchema,
  TrackingEventSchema,
  HeatmapEventSchema,
  FormAnalyticsEventSchema,
  ABTestSchema,
  ConsentPreferencesSchema,
  ContactFormSchema,
  DateRangeSchema,
  AnalyticsQuerySchema,
  CookieBannerSchema,
} from './validation';

describe('Basic Schemas', () => {
  describe('EmailSchema', () => {
    it('should validate correct email', () => {
      expect(() => EmailSchema.parse('user@example.com')).not.toThrow();
    });

    it('should reject invalid email', () => {
      expect(() => EmailSchema.parse('invalid-email')).toThrow();
    });

    it('should reject email exceeding max length', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      expect(() => EmailSchema.parse(longEmail)).toThrow();
    });
  });

  describe('PasswordSchema', () => {
    it('should validate strong password', () => {
      expect(() => PasswordSchema.parse('SecurePass123!')).not.toThrow();
    });

    it('should reject password without uppercase', () => {
      expect(() => PasswordSchema.parse('securpass123!')).toThrow();
    });

    it('should reject password without lowercase', () => {
      expect(() => PasswordSchema.parse('SECUREPASS123!')).toThrow();
    });

    it('should reject password without number', () => {
      expect(() => PasswordSchema.parse('SecurePass!')).toThrow();
    });

    it('should reject password without special character', () => {
      expect(() => PasswordSchema.parse('SecurePass123')).toThrow();
    });

    it('should reject password under 8 characters', () => {
      expect(() => PasswordSchema.parse('Short1!')).toThrow();
    });
  });

  describe('UrlSchema', () => {
    it('should validate correct HTTPS URL', () => {
      expect(() => UrlSchema.parse('https://example.com/path')).not.toThrow();
    });

    it('should validate correct HTTP URL', () => {
      expect(() => UrlSchema.parse('http://example.com')).not.toThrow();
    });

    it('should reject invalid URL', () => {
      expect(() => UrlSchema.parse('not-a-url')).toThrow();
    });

    it('should reject URL exceeding max length', () => {
      const longUrl = 'https://' + 'a'.repeat(3000);
      expect(() => UrlSchema.parse(longUrl)).toThrow();
    });
  });

  describe('DomainSchema', () => {
    it('should validate correct domain', () => {
      expect(() => DomainSchema.parse('example.com')).not.toThrow();
    });

    it('should validate domain with subdomain', () => {
      expect(() => DomainSchema.parse('api.example.com')).not.toThrow();
    });

    it('should validate domain with hyphen', () => {
      expect(() => DomainSchema.parse('my-domain.com')).not.toThrow();
    });

    it('should reject invalid domain', () => {
      expect(() => DomainSchema.parse('-invalid.com')).toThrow();
    });

    it('should reject domain exceeding max length', () => {
      const longDomain = 'a'.repeat(300) + '.com';
      expect(() => DomainSchema.parse(longDomain)).toThrow();
    });
  });

  describe('UUIDSchema', () => {
    it('should validate correct UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(() => UUIDSchema.parse(uuid)).not.toThrow();
    });

    it('should reject invalid UUID', () => {
      expect(() => UUIDSchema.parse('not-a-uuid')).toThrow();
    });

    it('should validate UUID with uppercase', () => {
      const uuid = '550E8400-E29B-41D4-A716-446655440000';
      expect(() => UUIDSchema.parse(uuid)).not.toThrow();
    });
  });

  describe('TrackingIdSchema', () => {
    it('should validate correct tracking ID', () => {
      expect(() => TrackingIdSchema.parse('tk_' + 'a'.repeat(32))).not.toThrow();
    });

    it('should reject tracking ID without prefix', () => {
      expect(() => TrackingIdSchema.parse('a'.repeat(35))).toThrow();
    });

    it('should reject tracking ID with wrong format', () => {
      expect(() => TrackingIdSchema.parse('tk_' + 'g'.repeat(32))).toThrow();
    });
  });

  describe('NameSchema', () => {
    it('should validate correct name', () => {
      expect(() => NameSchema.parse('John Doe')).not.toThrow();
    });

    it('should reject empty name', () => {
      expect(() => NameSchema.parse('')).toThrow();
    });

    it('should trim whitespace', () => {
      const result = NameSchema.parse('  John Doe  ');
      expect(result).toBe('John Doe');
    });
  });
});

describe('Authentication Schemas', () => {
  describe('SignUpSchema', () => {
    it('should validate correct signup data', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        name: 'John Doe',
        acceptTerms: true,
      };
      expect(() => SignUpSchema.parse(data)).not.toThrow();
    });

    it('should reject mismatched passwords', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
        name: 'John Doe',
        acceptTerms: true,
      };
      expect(() => SignUpSchema.parse(data)).toThrow();
    });

    it('should reject unaccepted terms', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        name: 'John Doe',
        acceptTerms: false,
      };
      expect(() => SignUpSchema.parse(data)).toThrow();
    });

    it('should allow optional company name', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        name: 'John Doe',
        acceptTerms: true,
      };
      expect(() => SignUpSchema.parse(data)).not.toThrow();
    });
  });

  describe('LoginSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };
      expect(() => LoginSchema.parse(data)).not.toThrow();
    });

    it('should set default rememberMe to false', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };
      const result = LoginSchema.parse(data);
      expect(result.rememberMe).toBe(false);
    });

    it('should allow rememberMe option', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        rememberMe: true,
      };
      expect(() => LoginSchema.parse(data)).not.toThrow();
    });
  });
});

describe('Company & Site Schemas', () => {
  describe('CreateCompanySchema', () => {
    it('should validate correct company data', () => {
      const data = {
        name: 'Acme Corp',
        description: 'A great company',
        website: 'https://acme.com',
      };
      expect(() => CreateCompanySchema.parse(data)).not.toThrow();
    });

    it('should allow optional fields', () => {
      const data = {
        name: 'Acme Corp',
      };
      expect(() => CreateCompanySchema.parse(data)).not.toThrow();
    });

    it('should reject invalid website URL', () => {
      const data = {
        name: 'Acme Corp',
        website: 'not-a-url',
      };
      expect(() => CreateCompanySchema.parse(data)).toThrow();
    });
  });

  describe('CreateSiteSchema', () => {
    it('should validate correct site data', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        name: 'My Site',
        domain: 'example.com',
        companyId: uuid,
      };
      expect(() => CreateSiteSchema.parse(data)).not.toThrow();
    });

    it('should set tracking enabled to true by default', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        name: 'My Site',
        domain: 'example.com',
        companyId: uuid,
      };
      const result = CreateSiteSchema.parse(data);
      expect(result.trackingEnabled).toBe(true);
    });

    it('should reject invalid domain', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        name: 'My Site',
        domain: '-invalid',
        companyId: uuid,
      };
      expect(() => CreateSiteSchema.parse(data)).toThrow();
    });
  });
});

describe('Event Tracking Schemas', () => {
  describe('TrackingEventSchema', () => {
    it('should validate correct tracking event', () => {
      const data = {
        trackingId: 'tk_' + 'a'.repeat(32),
        eventType: 'pageview',
        pageUrl: 'https://example.com',
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.1',
        timestamp: Date.now(),
        sessionId: 'session-123',
      };
      expect(() => TrackingEventSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid event type', () => {
      const data = {
        trackingId: 'tk_' + 'a'.repeat(32),
        eventType: 'invalid-type',
        pageUrl: 'https://example.com',
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.1',
        timestamp: Date.now(),
        sessionId: 'session-123',
      };
      expect(() => TrackingEventSchema.parse(data)).toThrow();
    });

    it('should allow optional AI agent field', () => {
      const data = {
        trackingId: 'tk_' + 'a'.repeat(32),
        eventType: 'pageview',
        pageUrl: 'https://example.com',
        userAgent: 'ChatGPT-User',
        ipAddress: '192.168.1.1',
        timestamp: Date.now(),
        sessionId: 'session-123',
        aiAgent: 'chatgpt',
      };
      expect(() => TrackingEventSchema.parse(data)).not.toThrow();
    });
  });

  describe('HeatmapEventSchema', () => {
    it('should validate correct heatmap event', () => {
      const data = {
        trackingId: 'tk_' + 'a'.repeat(32),
        sessionId: 'session-123',
        eventType: 'click',
        pageUrl: 'https://example.com',
        x: 100,
        y: 200,
        viewportWidth: 1920,
        viewportHeight: 1080,
        timestamp: Date.now(),
      };
      expect(() => HeatmapEventSchema.parse(data)).not.toThrow();
    });

    it('should reject negative viewport dimensions', () => {
      const data = {
        trackingId: 'tk_' + 'a'.repeat(32),
        sessionId: 'session-123',
        eventType: 'click',
        pageUrl: 'https://example.com',
        viewportWidth: -1920,
        viewportHeight: 1080,
        timestamp: Date.now(),
      };
      expect(() => HeatmapEventSchema.parse(data)).toThrow();
    });
  });

  describe('FormAnalyticsEventSchema', () => {
    it('should validate correct form analytics event', () => {
      const data = {
        trackingId: 'tk_' + 'a'.repeat(32),
        sessionId: 'session-123',
        formId: 'contact-form',
        formName: 'Contact Form',
        fieldName: 'email',
        fieldType: 'email',
        eventType: 'change',
        timestamp: Date.now(),
        pageUrl: 'https://example.com',
      };
      expect(() => FormAnalyticsEventSchema.parse(data)).not.toThrow();
    });

    it('should allow optional time spent', () => {
      const data = {
        trackingId: 'tk_' + 'a'.repeat(32),
        sessionId: 'session-123',
        formId: 'contact-form',
        formName: 'Contact Form',
        fieldName: 'email',
        fieldType: 'email',
        eventType: 'blur',
        timestamp: Date.now(),
        pageUrl: 'https://example.com',
        timeSpent: 5000,
      };
      expect(() => FormAnalyticsEventSchema.parse(data)).not.toThrow();
    });
  });
});

describe('A/B Testing Schemas', () => {
  describe('ABTestSchema', () => {
    it('should validate correct A/B test', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        name: 'Homepage Test',
        siteId: uuid,
        variantA: {
          name: 'Version A',
          description: 'Original version',
        },
        variantB: {
          name: 'Version B',
          description: 'New version',
        },
        trafficAllocation: {
          variantA: 50,
          variantB: 50,
        },
        startDate: new Date(),
      };
      expect(() => ABTestSchema.parse(data)).not.toThrow();
    });

    it('should reject traffic allocation not summing to 100', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        name: 'Homepage Test',
        siteId: uuid,
        variantA: {
          name: 'Version A',
        },
        variantB: {
          name: 'Version B',
        },
        trafficAllocation: {
          variantA: 60,
          variantB: 50,
        },
        startDate: new Date(),
      };
      expect(() => ABTestSchema.parse(data)).toThrow();
    });
  });
});

describe('GDPR & Consent Schemas', () => {
  describe('ConsentPreferencesSchema', () => {
    it('should validate correct consent preferences', () => {
      const data = {
        trackingId: 'tk_' + 'a'.repeat(32),
        sessionId: 'session-123',
        analytics: true,
        marketing: false,
        timestamp: Date.now(),
      };
      expect(() => ConsentPreferencesSchema.parse(data)).not.toThrow();
    });

    it('should set essential to true by default', () => {
      const data = {
        trackingId: 'tk_' + 'a'.repeat(32),
        sessionId: 'session-123',
        timestamp: Date.now(),
      };
      const result = ConsentPreferencesSchema.parse(data);
      expect(result.essential).toBe(true);
    });

    it('should allow expiration date', () => {
      const data = {
        trackingId: 'tk_' + 'a'.repeat(32),
        sessionId: 'session-123',
        timestamp: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };
      expect(() => ConsentPreferencesSchema.parse(data)).not.toThrow();
    });
  });

  describe('CookieBannerSchema', () => {
    it('should validate correct cookie banner', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        siteId: uuid,
        title: 'Cookie Consent',
        description: 'We use cookies...',
      };
      expect(() => CookieBannerSchema.parse(data)).not.toThrow();
    });

    it('should set position to bottom by default', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        siteId: uuid,
        title: 'Cookie Consent',
        description: 'We use cookies...',
      };
      const result = CookieBannerSchema.parse(data);
      expect(result.position).toBe('bottom');
    });

    it('should validate hex color', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        siteId: uuid,
        title: 'Cookie Consent',
        description: 'We use cookies...',
        backgroundColor: '#FF0000',
      };
      expect(() => CookieBannerSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid hex color', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        siteId: uuid,
        title: 'Cookie Consent',
        description: 'We use cookies...',
        backgroundColor: 'red',
      };
      expect(() => CookieBannerSchema.parse(data)).toThrow();
    });
  });
});

describe('Contact Form Schema', () => {
  describe('ContactFormSchema', () => {
    it('should validate correct contact form', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message about your service.',
      };
      expect(() => ContactFormSchema.parse(data)).not.toThrow();
    });

    it('should reject message under 10 characters', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Short',
      };
      expect(() => ContactFormSchema.parse(data)).toThrow();
    });

    it('should trim whitespace', () => {
      const data = {
        name: '  John Doe  ',
        email: 'john@example.com',
        message: '  This is a test message about your service.  ',
      };
      const result = ContactFormSchema.parse(data);
      expect(result.message).toBe('This is a test message about your service.');
    });
  });
});

describe('Analytics Query Schemas', () => {
  describe('DateRangeSchema', () => {
    it('should validate correct date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const data = { startDate, endDate };
      expect(() => DateRangeSchema.parse(data)).not.toThrow();
    });

    it('should reject end date before start date', () => {
      const startDate = new Date('2024-12-31');
      const endDate = new Date('2024-01-01');
      const data = { startDate, endDate };
      expect(() => DateRangeSchema.parse(data)).toThrow();
    });
  });

  describe('AnalyticsQuerySchema', () => {
    it('should validate correct analytics query', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        siteId: uuid,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      expect(() => AnalyticsQuerySchema.parse(data)).not.toThrow();
    });

    it('should set default limit to 100', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        siteId: uuid,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      const result = AnalyticsQuerySchema.parse(data);
      expect(result.limit).toBe(100);
    });

    it('should reject limit exceeding max', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const data = {
        siteId: uuid,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        limit: 50000,
      };
      expect(() => AnalyticsQuerySchema.parse(data)).toThrow();
    });
  });
});
