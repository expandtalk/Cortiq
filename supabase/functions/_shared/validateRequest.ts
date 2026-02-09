import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

/**
 * CORS headers for Edge Functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validation error response format
 */
export interface ValidationErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details: Array<{
      path: (string | number)[];
      message: string;
    }>;
  };
}

/**
 * Validates request body against Zod schema
 * @param body - Request body to validate
 * @param schema - Zod schema to validate against
 * @returns Validated data or error response
 */
export function validateRequest<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { valid: true; data: T } | { valid: false; response: Response } {
  try {
    const validatedData = schema.parse(body);
    return { valid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ValidationErrorResponse = {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map((err) => ({
            path: err.path,
            message: err.message,
          })),
        },
      };

      return {
        valid: false,
        response: new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }),
      };
    }

    // Handle unexpected errors
    const errorResponse: ValidationErrorResponse = {
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_EXCEPTION',
        details: [
          {
            path: [],
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      },
    };

    return {
      valid: false,
      response: new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }),
    };
  }
}

/**
 * Creates a JSON response for Edge Functions
 */
export function jsonResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * Creates an error response
 */
export function errorResponse(
  message: string,
  code: string = 'ERROR',
  status: number = 500,
  details?: any
): Response {
  return jsonResponse(
    {
      success: false,
      error: {
        message,
        code,
        ...(details && { details }),
      },
    },
    status
  );
}

/**
 * Creates a success response
 */
export function successResponse(
  data: any = null,
  status: number = 200
): Response {
  return jsonResponse({ success: true, data }, status);
}

/**
 * Handles CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

/**
 * Safely parses request JSON
 */
export async function parseRequestBody(
  req: Request
): Promise<{ valid: true; body: unknown } | { valid: false; response: Response }> {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        valid: false,
        response: errorResponse('Content-Type must be application/json', 'INVALID_CONTENT_TYPE', 400),
      };
    }

    const body = await req.json();
    return { valid: true, body };
  } catch (error) {
    return {
      valid: false,
      response: errorResponse(
        'Invalid JSON in request body',
        'JSON_PARSE_ERROR',
        400
      ),
    };
  }
}

/**
 * Extracts and validates Authorization header
 */
export function validateAuthHeader(
  req: Request
): { valid: true; token: string } | { valid: false; response: Response } {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return {
      valid: false,
      response: errorResponse(
        'Missing Authorization header',
        'MISSING_AUTH_HEADER',
        401
      ),
    };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      response: errorResponse(
        'Invalid Authorization header format',
        'INVALID_AUTH_HEADER',
        401
      ),
    };
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return {
      valid: false,
      response: errorResponse(
        'Empty authorization token',
        'EMPTY_TOKEN',
        401
      ),
    };
  }

  return { valid: true, token };
}

/**
 * Rate limiting helper (simple in-memory implementation for Edge Functions)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  record.count++;
  const allowed = record.count <= maxRequests;

  return {
    allowed,
    remaining: Math.max(0, maxRequests - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * Logs structured information (compatible with Edge Function logs)
 */
export function logInfo(
  message: string,
  data?: Record<string, any>
): void {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', message, ...data }));
}

/**
 * Logs errors in structured format
 */
export function logError(
  message: string,
  error?: Error | unknown,
  data?: Record<string, any>
): void {
  const errorObj = error instanceof Error
    ? { message: error.message, stack: error.stack }
    : error;

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: errorObj,
      ...data,
    })
  );
}

/**
 * Validates request in a single step (combines parsing and validation)
 */
export async function validateRequestFull<T>(
  req: Request,
  schema: z.ZodSchema<T>,
  options?: {
    requireAuth?: boolean;
    rateLimitKey?: string;
    rateLimitMax?: number;
  }
): Promise<
  | { valid: true; data: T; token?: string }
  | { valid: false; response: Response }
> {
  // Check CORS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return { valid: false, response: corsResponse };
  }

  // Parse JSON
  const parseResult = await parseRequestBody(req);
  if (!parseResult.valid) {
    return parseResult;
  }

  // Validate Auth if required
  let token: string | undefined;
  if (options?.requireAuth) {
    const authResult = validateAuthHeader(req);
    if (!authResult.valid) {
      return authResult;
    }
    token = authResult.token;
  }

  // Check rate limit if configured
  if (options?.rateLimitKey) {
    const rateLimit = checkRateLimit(
      options.rateLimitKey,
      options.rateLimitMax || 100
    );
    if (!rateLimit.allowed) {
      return {
        valid: false,
        response: errorResponse(
          'Too many requests',
          'RATE_LIMIT_EXCEEDED',
          429,
          { resetTime: rateLimit.resetTime }
        ),
      };
    }
  }

  // Validate against schema
  const validationResult = validateRequest(parseResult.body, schema);
  if (!validationResult.valid) {
    return validationResult;
  }

  return { valid: true, data: validationResult.data, token };
}
