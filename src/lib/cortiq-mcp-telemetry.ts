/**
 * CortIQ MCP Telemetry — server-side instrumentation for MCP servers.
 *
 * Integrates with @modelcontextprotocol/sdk to automatically trace every
 * tool invocation. Stitches MCP server spans into the calling agent's trace
 * via W3C traceparent propagation through MCP `_meta`.
 *
 * ─────────────────────────────────────────────────────────────────
 * Quick start (automatic — all tools wrapped at once):
 *
 *   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
 *   import { withCortIQTelemetry } from '@/lib/cortiq-mcp-telemetry';
 *   import { CortIQAgentTracker } from '@/lib/cortiq-agent-tracker';
 *
 *   const tracker = new CortIQAgentTracker({ ... });
 *   const server  = new McpServer({ name: 'weather-mcp', version: '1.0.0' });
 *
 *   withCortIQTelemetry(server, tracker, { serverName: 'weather-mcp' });
 *
 *   server.tool('get_weather', { city: z.string() }, async ({ city }) => {
 *     // CortIQ span is created automatically
 *     return { content: [{ type: 'text', text: await fetchWeather(city) }] };
 *   });
 *
 * ─────────────────────────────────────────────────────────────────
 * Manual (one tool at a time):
 *
 *   server.tool('get_weather', schema, traceMCPTool({
 *     toolName:   'get_weather',
 *     serverName: 'weather-mcp',
 *     tracker,
 *     handler: async ({ city }, ctx) => {
 *       // ctx.span is available for adding custom attributes
 *       return { content: [{ type: 'text', text: await fetchWeather(city) }] };
 *     },
 *   }));
 *
 * ─────────────────────────────────────────────────────────────────
 * Agent side (inject traceparent into MCP call):
 *
 *   const toolSpan = task.startSpan('call_get_weather', {
 *     operation: 'tool_call',
 *     toolName:  'get_weather',
 *     mcpServer: 'weather-mcp',
 *   });
 *
 *   const result = await mcpClient.callTool(
 *     'get_weather',
 *     { city: 'Stockholm' },
 *     { _meta: { traceparent: toolSpan.traceparent } },  // ← W3C propagation
 *   );
 *
 *   toolSpan.end({ status: 'OK' });
 */

import { CortIQAgentTracker, SpanBuilder, type SpanEndOptions } from './cortiq-agent-tracker';

// ── W3C TraceContext ──────────────────────────────────────────────────────────

export interface TraceContext {
  traceId:      string;
  parentSpanId: string;
  sampled:      boolean;
}

/**
 * Parse a W3C traceparent header string.
 * Returns null if the header is absent or malformed.
 *
 *   traceparent: 00-{traceId(32hex)}-{parentSpanId(16hex)}-{flags(2hex)}
 */
export function parseTraceparent(traceparent: string | null | undefined): TraceContext | null {
  if (!traceparent) return null;
  const parts = traceparent.trim().split('-');
  if (parts.length !== 4) return null;
  const [version, traceId, parentSpanId, flags] = parts;
  if (version !== '00') return null;
  if (!/^[0-9a-f]{32}$/.test(traceId))    return null;
  if (!/^[0-9a-f]{16}$/.test(parentSpanId)) return null;
  return {
    traceId,
    parentSpanId,
    sampled: (parseInt(flags, 16) & 0x01) === 1,
  };
}

/**
 * Extract W3C traceparent from MCP request extras.
 *
 * Checks three locations (SDK versions differ in where they put _meta):
 *   extra._meta.traceparent   (low-level Server, SDK v0.x)
 *   extra.meta.traceparent    (McpServer high-level, SDK v1.x)
 *   extra.traceparent         (direct injection)
 */
export function extractTraceContext(extra: unknown): TraceContext | null {
  if (!extra || typeof extra !== 'object') return null;
  const e = extra as Record<string, unknown>;

  const tp =
    (e._meta  as Record<string, unknown> | undefined)?.traceparent as string |undefined ??
    (e.meta   as Record<string, unknown> | undefined)?.traceparent as string | undefined ??
    e.traceparent as string | undefined ??
    null;

  return parseTraceparent(tp);
}

// ── Span context for handler callbacks ───────────────────────────────────────

export interface MCPToolContext {
  /** The CortIQ span for this tool invocation. Use to add custom attributes. */
  span: SpanBuilder;
  /** The extracted trace context from the calling agent (null if no traceparent). */
  traceContext: TraceContext | null;
}

// ── traceMCPTool — wraps a single tool handler ────────────────────────────────

export interface TraceMCPToolOptions<TArgs, TResult> {
  toolName:   string;
  serverName: string;
  tracker:    CortIQAgentTracker;
  /** The actual tool logic. `ctx.span` is available for custom attributes. */
  handler: (args: TArgs, ctx: MCPToolContext) => Promise<TResult>;
}

/**
 * Wraps a single MCP tool handler with CortIQ telemetry.
 * Creates a child span if a traceparent is present; otherwise creates a root span.
 *
 * Usage:
 *   server.tool('my_tool', schema, traceMCPTool({ toolName: 'my_tool', serverName: 'my-mcp', tracker, handler }));
 */
export function traceMCPTool<TArgs, TResult>(
  opts: TraceMCPToolOptions<TArgs, TResult>,
): (args: TArgs, extra: unknown) => Promise<TResult> {
  return async (args: TArgs, extra: unknown): Promise<TResult> => {
    const traceCtx = extractTraceContext(extra);

    // Create a child span if the calling agent injected a traceparent,
    // otherwise start a new root span (standalone MCP invocation).
    const span: SpanBuilder = traceCtx
      ? opts.tracker.startSpan(traceCtx.traceId, opts.toolName, traceCtx.parentSpanId, {
          operation:  'tool_call',
          toolName:   opts.toolName,
          mcpServer:  opts.serverName,
        })
      : opts.tracker.startTask(`mcp:${opts.toolName}`, {
          operation:  'tool_call',
          toolName:   opts.toolName,
          mcpServer:  opts.serverName,
        });

    const ctx: MCPToolContext = { span, traceContext: traceCtx };

    try {
      const result = await opts.handler(args, ctx);
      span.end({ status: 'OK' });
      return result;
    } catch (err) {
      span.end({ status: 'ERROR', statusMessage: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  };
}

// ── withCortIQTelemetry — patches an McpServer to auto-trace all tools ────────

/**
 * Patches an McpServer (or Server) instance so that every tool registration
 * automatically wraps its handler with CortIQ telemetry.
 *
 * Call this ONCE before registering any tools.
 * Works with both McpServer (high-level) and Server (low-level) from the MCP SDK.
 *
 * @param server     McpServer or Server instance from @modelcontextprotocol/sdk
 * @param tracker    CortIQAgentTracker instance
 * @param options    { serverName } — identifies this MCP server in the dashboard
 */
export function withCortIQTelemetry(
  server: Record<string, unknown>,
  tracker: CortIQAgentTracker,
  options: { serverName: string },
): void {
  // Patch McpServer.tool() ─────────────────────────────────────────────────
  if (typeof server.tool === 'function') {
    const orig = (server.tool as Function).bind(server);

    server.tool = (...args: unknown[]): unknown => {
      // The callback is always the last argument
      const lastIdx = args.length - 1;
      const origHandler = args[lastIdx];

      if (typeof origHandler === 'function') {
        // The first arg is always the tool name string
        const toolName = typeof args[0] === 'string' ? args[0] : 'unknown';

        args[lastIdx] = async (toolArgs: unknown, extra: unknown): Promise<unknown> => {
          const traceCtx = extractTraceContext(extra);
          const span: SpanBuilder = traceCtx
            ? tracker.startSpan(traceCtx.traceId, toolName, traceCtx.parentSpanId, {
                operation: 'tool_call', toolName, mcpServer: options.serverName,
              })
            : tracker.startTask(`mcp:${toolName}`, {
                operation: 'tool_call', toolName, mcpServer: options.serverName,
              });

          try {
            const result = await origHandler(toolArgs, extra);
            span.end({ status: 'OK' });
            return result;
          } catch (err) {
            span.end({ status: 'ERROR', statusMessage: err instanceof Error ? err.message : String(err) });
            throw err;
          }
        };
      }

      return orig(...args);
    };
  }

  // Patch low-level Server.setRequestHandler() for tools/call ─────────────
  if (typeof server.setRequestHandler === 'function') {
    const origSet = (server.setRequestHandler as Function).bind(server);

    server.setRequestHandler = (schema: unknown, handler: Function, ...rest: unknown[]): unknown => {
      // Detect tools/call schema by method name (works across SDK versions)
      const schemaMethod =
        (schema as Record<string, unknown>)?.method as string |undefined ??
        (schema as Record<string, unknown>)?.shape?.method?._def?.value as string | undefined;

      if (schemaMethod === 'tools/call' && typeof handler === 'function') {
        const wrappedHandler = async (request: Record<string, unknown>, extra: unknown): Promise<unknown> => {
          const toolName = (request?.params as Record<string, unknown>)?.name as string ?? 'unknown';
          const metaSource = {
            _meta: (request?.params as Record<string, unknown>)?._meta,
            ...(extra as Record<string, unknown> ?? {}),
          };
          const traceCtx = extractTraceContext(metaSource);

          const span: SpanBuilder = traceCtx
            ? tracker.startSpan(traceCtx.traceId, toolName, traceCtx.parentSpanId, {
                operation: 'tool_call', toolName, mcpServer: options.serverName,
              })
            : tracker.startTask(`mcp:${toolName}`, {
                operation: 'tool_call', toolName, mcpServer: options.serverName,
              });

          try {
            const result = await handler(request, extra);
            span.end({ status: 'OK' });
            return result;
          } catch (err) {
            span.end({ status: 'ERROR', statusMessage: err instanceof Error ? err.message : String(err) });
            throw err;
          }
        };
        return origSet(schema, wrappedHandler, ...rest);
      }

      return origSet(schema, handler, ...rest);
    };
  }
}

// ── Utility: build _meta for outgoing MCP client calls ───────────────────────

/**
 * Build the `_meta` object to inject into an outgoing MCP tool call from the
 * agent (client) side. Pass this as the third argument to `mcpClient.callTool()`.
 *
 *   const result = await mcpClient.callTool(
 *     'get_weather',
 *     { city: 'Stockholm' },
 *     buildMCPMeta(toolSpan),
 *   );
 */
export function buildMCPMeta(span: SpanBuilder, extra?: Record<string, unknown>): { _meta: Record<string, unknown> } {
  return {
    _meta: {
      traceparent: span.traceparent,
      'cortiq.agent_name': span.agentNamePub,
      ...extra,
    },
  };
}
