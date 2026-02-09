# Edge Function Validation Pattern

This document shows how to use Zod validation in Edge Functions.

## Example: Simple Tracking Event Endpoint

```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import {
  validateRequest,
  corsHeaders,
  errorResponse,
  successResponse,
  validateAuthHeader,
  handleCors,
  parseRequestBody,
} from '../_shared/validateRequest.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define request schema
const TrackingEventSchema = z.object({
  trackingId: z.string().regex(/^tk_[a-f0-9]{32}$/),
  eventType: z.enum(['pageview', 'click', 'scroll', 'form_submission']),
  pageUrl: z.string().url(),
  sessionId: z.string().min(1),
  timestamp: z.number().int().positive(),
  properties: z.record(z.any()).optional(),
});

type TrackingEvent = z.infer<typeof TrackingEventSchema>;

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Validate authorization
    const authResult = validateAuthHeader(req);
    if (!authResult.valid) return authResult.response;
    const apiKey = authResult.token;

    // Parse and validate request body
    const parseResult = await parseRequestBody(req);
    if (!parseResult.valid) return parseResult.response;

    const validationResult = validateRequest(parseResult.body, TrackingEventSchema);
    if (!validationResult.valid) return validationResult.response;

    const event: TrackingEvent = validationResult.data;

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate API key
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('api_key', apiKey)
      .single();

    if (companyError || !company) {
      return errorResponse('Invalid API key', 'INVALID_API_KEY', 401);
    }

    // Process event...
    const { data, error } = await supabase
      .from('tracking_events')
      .insert({
        company_id: company.id,
        tracking_id: event.trackingId,
        event_type: event.eventType,
        page_url: event.pageUrl,
        session_id: event.sessionId,
        timestamp: new Date(event.timestamp).toISOString(),
        properties: event.properties,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error:', error);
      return errorResponse('Failed to save event', 'DATABASE_ERROR', 500);
    }

    return successResponse({ eventId: data.id }, 201);
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
});
```

## Usage Patterns

### Pattern 1: Simple Validation

```typescript
const validationResult = validateRequest(body, MySchema);
if (!validationResult.valid) {
  return validationResult.response; // Returns 400 response with error details
}
const data = validationResult.data; // Typed data
```

### Pattern 2: Complete Validation Flow

```typescript
// All in one step with auth and parsing
const result = await validateRequestFull(req, MySchema, {
  requireAuth: true,
  rateLimitKey: `api-key:${apiKey}`,
  rateLimitMax: 100,
});

if (!result.valid) {
  return result.response;
}

// Use result.data and result.token
```

### Pattern 3: Custom Validation

```typescript
try {
  const data = await req.json();
  const validated = MySchema.parse(data);
  // Process validated data
} catch (error) {
  if (error instanceof z.ZodError) {
    return errorResponse(
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      error.errors
    );
  }
  throw error;
}
```

## Common Schemas

Reference the schemas defined in `src/types/validation.ts`:

- `EmailSchema` - Email validation
- `UrlSchema` - URL validation
- `UUIDSchema` - UUID validation
- `TrackingEventSchema` - Complete tracking event
- `HeatmapEventSchema` - Heatmap data
- `FormAnalyticsEventSchema` - Form events
- `ConsentPreferencesSchema` - Consent data
- `ABTestSchema` - A/B test configuration
- And many more...

## Response Format

All responses use a consistent format:

### Success (200)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error (400+)
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": ["trackingId"],
        "message": "Invalid tracking ID format"
      }
    ]
  }
}
```

## Testing

### Unit Test Example

```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { validateRequest } from '../_shared/validateRequest.ts';

const MySchema = z.object({
  name: z.string().min(1),
});

Deno.test('should validate correct data', () => {
  const result = validateRequest({ name: 'John' }, MySchema);
  if (!result.valid) throw new Error('Should be valid');
});

Deno.test('should reject invalid data', () => {
  const result = validateRequest({ name: '' }, MySchema);
  if (result.valid) throw new Error('Should be invalid');
});
```

## Zod Resources

- Documentation: https://zod.dev
- CommonIssues: Schema definition happens at runtime, so it's minimal performance impact
- TypeScript: Full type inference from schemas using `z.infer<typeof Schema>`
