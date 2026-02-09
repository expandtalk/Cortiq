import { describe, it, expect } from 'vitest';
import {
  validateRequest,
  safeValidate,
  validateOrThrow,
  formatZodError,
  sanitizeValue,
  validateAndSanitize,
  getFirstError,
  validateBatch,
} from './validateRequest';
import { z } from 'zod';

describe('validateRequest', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().int().positive(),
  });

  it('should validate correct data', () => {
    const data = { name: 'John', email: 'john@example.com', age: 30 };
    const result = validateRequest(testSchema, data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('should return error for invalid data', () => {
    const data = { name: '', email: 'invalid-email', age: -5 };
    const result = validateRequest(testSchema, data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details.length).toBeGreaterThan(0);
    }
  });

  it('should handle missing required fields', () => {
    const data = { name: 'John' };
    const result = validateRequest(testSchema, data as any);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.details.length).toBeGreaterThan(0);
    }
  });
});

describe('safeValidate', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });

  it('should return data on valid input', () => {
    const data = { name: 'John', email: 'john@example.com' };
    const result = safeValidate(testSchema, data);

    expect(result).toEqual(data);
  });

  it('should return null on invalid input', () => {
    const data = { name: '', email: 'invalid' };
    const result = safeValidate(testSchema, data);

    expect(result).toBeNull();
  });
});

describe('validateOrThrow', () => {
  const testSchema = z.object({
    name: z.string().min(1),
  });

  it('should return data on valid input', () => {
    const data = { name: 'John' };
    const result = validateOrThrow(testSchema, data);

    expect(result).toEqual(data);
  });

  it('should throw error on invalid input', () => {
    const data = { name: '' };

    expect(() => validateOrThrow(testSchema, data)).toThrow();
  });

  it('should include context in error message', () => {
    const data = { name: '' };

    expect(() => validateOrThrow(testSchema, data, 'test-context')).toThrow(
      /test-context/
    );
  });
});

describe('formatZodError', () => {
  it('should format validation errors', () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().int().positive(),
    });

    try {
      schema.parse({ email: 'invalid', age: -5 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatZodError(error);
        expect(formatted).toContain('email');
        expect(formatted).toContain('age');
      }
    }
  });
});

describe('sanitizeValue', () => {
  it('should remove angle brackets from strings', () => {
    const result = sanitizeValue('<script>alert("xss")</script>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should trim whitespace', () => {
    const result = sanitizeValue('  hello world  ');
    expect(result).toBe('hello world');
  });

  it('should recursively sanitize arrays', () => {
    const data = ['<script>', 'normal', '<img>'];
    const result = sanitizeValue(data);

    expect(Array.isArray(result)).toBe(true);
    expect((result as any).every((item: string) => !item.includes('<'))).toBe(true);
  });

  it('should recursively sanitize objects', () => {
    const data = {
      name: '<script>john</script>',
      email: 'john@example.com',
      nested: {
        value: '<img>test',
      },
    };
    const result = sanitizeValue(data);

    expect(result.name).not.toContain('<');
    expect((result as any).nested.value).not.toContain('<');
  });

  it('should preserve non-string values', () => {
    expect(sanitizeValue(123)).toBe(123);
    expect(sanitizeValue(true)).toBe(true);
    expect(sanitizeValue(null)).toBe(null);
  });
});

describe('validateAndSanitize', () => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });

  it('should validate and sanitize valid data', () => {
    const data = { name: '  John Doe  ', email: 'john@example.com' };
    const result = validateAndSanitize(schema, data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
    }
  });

  it('should remove XSS attempts', () => {
    const data = { name: '<script>alert("xss")</script>', email: 'john@example.com' };
    const result = validateAndSanitize(schema, data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).not.toContain('<');
    }
  });

  it('should return error for invalid data', () => {
    const data = { name: '', email: 'invalid' };
    const result = validateAndSanitize(schema, data);

    expect(result.success).toBe(false);
  });
});

describe('getFirstError', () => {
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
  });

  it('should return null for valid data', () => {
    const data = { name: 'John', email: 'john@example.com' };
    const error = getFirstError(schema, data);

    expect(error).toBeNull();
  });

  it('should return first error message for invalid data', () => {
    const data = { name: '', email: 'invalid' };
    const error = getFirstError(schema, data);

    expect(error).not.toBeNull();
    expect(typeof error).toBe('string');
  });
});

describe('validateBatch', () => {
  const schema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
  });

  it('should separate valid and invalid items', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: '' }, // invalid
      { id: 3, name: 'Item 3' },
      { id: 0, name: 'Item 4' }, // invalid
    ];

    const result = validateBatch(schema, items);

    expect(result.valid.length).toBe(2);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0].index).toBe(1);
    expect(result.errors[1].index).toBe(3);
  });

  it('should handle all valid items', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    const result = validateBatch(schema, items);

    expect(result.valid.length).toBe(2);
    expect(result.errors.length).toBe(0);
  });

  it('should handle all invalid items', () => {
    const items = [
      { id: 0, name: '' },
      { id: -1, name: '' },
    ];

    const result = validateBatch(schema, items);

    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBe(2);
  });

  it('should handle empty array', () => {
    const result = validateBatch(schema, []);

    expect(result.valid.length).toBe(0);
    expect(result.errors.length).toBe(0);
  });
});
