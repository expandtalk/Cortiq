/**
 * CortIQ Agent Tracker — TypeScript instrumentation SDK
 *
 * Follows OpenTelemetry GenAI Semantic Conventions (gen_ai.* attributes).
 * Compatible with Claude Code, AgentFlow, Claude Agent SDK, and any custom agent.
 *
 * Quick start:
 *   const tracker = new CortIQAgentTracker({
 *     endpoint: 'https://<project>.supabase.co/functions/v1/agent-telemetry',
 *     apiKey:   'your_cortiq_api_key',
 *     agentName: 'ingegard',
 *     defaultModel: 'claude-sonnet-4-6',
 *   });
 *
 *   const task = tracker.startTask('process-invoice');
 *   const llmSpan = task.startSpan('chat', { operation: 'chat' });
 *   // ... call LLM ...
 *   llmSpan.end({ inputTokens: 1200, outputTokens: 450, status: 'OK' });
 *
 *   const toolSpan = task.startSpan('fetch_invoice', { operation: 'tool_call', toolName: 'fetch_invoice', mcpServer: 'finance-mcp' });
 *   // ... run tool ...
 *   toolSpan.end({ status: 'OK' });
 *
 *   task.end({ status: 'OK' });
 *   await tracker.flush();
 *
 * Conversion attribution (pass web session ID):
 *   const task = tracker.startTask('chat-assist', { webSessionId: cortiqSessionId });
 *   // CortIQ will join this against web conversion events — no GA4 needed.
 */

export interface TrackerConfig {
  /** CortIQ agent-telemetry Edge Function URL */
  endpoint: string;
  /** Company API key (same as used for tracking script) */
  apiKey: string;
  /** gen_ai.agent.name — identifies your agent in the dashboard */
  agentName: string;
  /** Default model for spans that don't specify one */
  defaultModel?: string;
  /** Default provider name (default: 'anthropic') */
  defaultProvider?: string;
  /** Auto-flush when buffer reaches this size (default: 50) */
  flushThreshold?: number;
  /** Max buffer age in ms before auto-flush (default: 10000) */
  flushIntervalMs?: number;
  /** Disable sending (useful in tests) */
  disabled?: boolean;
}

export interface SpanEndOptions {
  status?: 'OK' | 'ERROR' | 'UNSET';
  statusMessage?: string;
  inputTokens?: number;
  outputTokens?: number;
  evalScore?: number;
  hadRetry?: boolean;
  escalated?: boolean;
  hasHallucinationFlag?: boolean;
  retrievalScore?: number;
  extraAttributes?: Record<string, unknown>;
}

export interface SpanStartOptions {
  /** gen_ai.operation.name */
  operation?: 'chat' | 'tool_call' | 'invoke_agent' | 'rag_retrieval' | 'create_agent' | 'embeddings' | string;
  model?: string;
  provider?: string;
  toolName?: string;
  mcpServer?: string;
  dataSourceId?: string;
  extraAttributes?: Record<string, unknown>;
}

export interface TaskStartOptions extends SpanStartOptions {
  /** Pass the CortIQ web session_id here to enable conversion attribution. */
  webSessionId?: string;
  conversationId?: string;
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── SpanBuilder ────────────────────────────────────────────────────────────────

export class SpanBuilder {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId: string | null;
  readonly spanName: string;
  private startTime: Date;
  private endTime: Date | null = null;
  private statusCode: 'OK' | 'ERROR' | 'UNSET' = 'UNSET';
  private statusMessage: string | null = null;
  private inputTokens: number | null = null;
  private outputTokens: number | null = null;
  private evalScore: number | null = null;
  private hadRetry = false;
  private escalated = false;
  private hasHallucinationFlag = false;
  private retrievalScore: number | null = null;
  private model: string | null;
  private provider: string | null;
  private operation: string | null;
  private toolName: string | null;
  private mcpServer: string | null;
  private dataSourceId: string | null;
  private webSessionId: string | null;
  private extraAttributes: Record<string, unknown>;
  private childSpans: SpanBuilder[] = [];

  constructor(
    traceId: string,
    spanName: string,
    parentSpanId: string | null,
    opts: SpanStartOptions & { webSessionId?: string; conversationId?: string },
    private readonly agentName: string,
    private readonly defaultModel: string | null,
    private readonly defaultProvider: string,
    private readonly onEnd: (span: SpanBuilder) => void,
  ) {
    this.traceId        = traceId;
    this.spanId         = randomHex(8);
    this.parentSpanId   = parentSpanId;
    this.spanName       = spanName;
    this.startTime      = new Date();
    this.model          = opts.model ?? defaultModel ?? null;
    this.provider       = opts.provider ?? defaultProvider;
    this.operation      = opts.operation ?? null;
    this.toolName       = opts.toolName ?? null;
    this.mcpServer      = opts.mcpServer ?? null;
    this.dataSourceId   = opts.dataSourceId ?? null;
    this.webSessionId   = (opts as { webSessionId?: string }).webSessionId ?? (opts as { conversationId?: string }).conversationId ?? null;
    this.extraAttributes = opts.extraAttributes ?? {};
  }

  /** Create a child span inside this span. */
  startSpan(name: string, opts: SpanStartOptions = {}): SpanBuilder {
    const child = new SpanBuilder(
      this.traceId, name, this.spanId,
      { ...opts, webSessionId: this.webSessionId ?? undefined },
      this.agentName, this.defaultModel, this.defaultProvider,
      (s) => { this.childSpans.push(s); this.onEnd(s); },
    );
    return child;
  }

  /** End this span and schedule it for flush. */
  end(opts: SpanEndOptions = {}): this {
    this.endTime              = new Date();
    this.statusCode           = opts.status ?? 'OK';
    this.statusMessage        = opts.statusMessage ?? null;
    this.inputTokens          = opts.inputTokens  ?? null;
    this.outputTokens         = opts.outputTokens ?? null;
    this.evalScore            = opts.evalScore ?? null;
    this.hadRetry             = opts.hadRetry ?? false;
    this.escalated            = opts.escalated ?? false;
    this.hasHallucinationFlag = opts.hasHallucinationFlag ?? false;
    this.retrievalScore       = opts.retrievalScore ?? null;
    if (opts.extraAttributes) {
      Object.assign(this.extraAttributes, opts.extraAttributes);
    }
    this.onEnd(this);
    return this;
  }

  /** Convenience: mark as error and end. */
  endWithError(message: string): this {
    return this.end({ status: 'ERROR', statusMessage: message });
  }

  /** The agent name this span belongs to (used by MCP telemetry). */
  get agentNamePub(): string { return this.agentName; }

  /**
   * W3C TraceContext traceparent header value for this span.
   * Inject this into MCP tool calls via `_meta.traceparent` so the MCP server
   * can create child spans that belong to the same trace.
   *
   *   await mcpClient.callTool('get_weather', args, {
   *     _meta: { traceparent: toolSpan.traceparent }
   *   });
   */
  get traceparent(): string {
    return `00-${this.traceId}-${this.spanId}-01`;
  }

  toJSON(): Record<string, unknown> {
    const attrs: Record<string, unknown> = {
      'gen_ai.agent.name':      this.agentName,
      'gen_ai.provider.name':   this.provider,
      'gen_ai.request.model':   this.model,
      'gen_ai.operation.name':  this.operation,
      'gen_ai.tool.name':       this.toolName,
      'cortiq.mcp_server':      this.mcpServer,
      'gen_ai.data_source.id':  this.dataSourceId,
      'gen_ai.evaluation.score': this.evalScore,
      'cortiq.retrieval_score': this.retrievalScore,
      'cortiq.had_retry':       this.hadRetry,
      'cortiq.escalated':       this.escalated,
      'cortiq.has_hallucination_flag': this.hasHallucinationFlag,
      ...this.extraAttributes,
    };
    // Remove null/undefined
    for (const k of Object.keys(attrs)) {
      if (attrs[k] === null || attrs[k] === undefined) delete attrs[k];
    }

    return {
      trace_id:       this.traceId,
      span_id:        this.spanId,
      parent_span_id: this.parentSpanId,
      name:           this.spanName,
      status_code:    this.statusCode,
      status_message: this.statusMessage,
      start_time:     this.startTime.toISOString(),
      end_time:       this.endTime?.toISOString() ?? null,
      input_tokens:   this.inputTokens,
      output_tokens:  this.outputTokens,
      web_session_id: this.webSessionId,
      attributes:     attrs,
    };
  }
}

// ── CortIQAgentTracker ─────────────────────────────────────────────────────────

export class CortIQAgentTracker {
  private readonly config: Required<TrackerConfig>;
  private buffer: SpanBuilder[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: TrackerConfig) {
    this.config = {
      defaultModel:    config.defaultModel    ?? null as unknown as string,
      defaultProvider: config.defaultProvider ?? 'anthropic',
      flushThreshold:  config.flushThreshold  ?? 50,
      flushIntervalMs: config.flushIntervalMs ?? 10_000,
      disabled:        config.disabled        ?? false,
      ...config,
    };
    this._scheduleFlush();
  }

  /**
   * Start a root task span (represents one agent task / conversation turn).
   *
   * Pass webSessionId to enable agent-assisted conversion attribution in CortIQ.
   * This should be the CortIQ session_id from the tracking script.
   */
  startTask(name: string, opts: TaskStartOptions = {}): SpanBuilder {
    const traceId = randomHex(16);
    const task = new SpanBuilder(
      traceId, name, null,
      { operation: 'invoke_agent', ...opts },
      this.config.agentName,
      this.config.defaultModel,
      this.config.defaultProvider,
      (s) => this._enqueue(s),
    );
    return task;
  }

  /** Create a standalone span (not a root task). */
  startSpan(traceId: string, name: string, parentSpanId: string | null, opts: SpanStartOptions = {}): SpanBuilder {
    return new SpanBuilder(
      traceId, name, parentSpanId, opts,
      this.config.agentName,
      this.config.defaultModel,
      this.config.defaultProvider,
      (s) => this._enqueue(s),
    );
  }

  private _enqueue(span: SpanBuilder): void {
    if (this.config.disabled) return;
    this.buffer.push(span);
    if (this.buffer.length >= this.config.flushThreshold) {
      this.flush();
    }
  }

  private _scheduleFlush(): void {
    if (this.config.disabled) return;
    this.flushTimer = setTimeout(async () => {
      await this.flush();
      this._scheduleFlush();
    }, this.config.flushIntervalMs);
  }

  /** Send all buffered spans to CortIQ. Resolves when sent. */
  async flush(): Promise<{ sent: number; error?: string }> {
    if (this.config.disabled || this.buffer.length === 0) return { sent: 0 };

    const toSend = this.buffer.splice(0);
    const payload = { spans: toSend.map(s => s.toJSON()) };

    try {
      const res = await fetch(this.config.endpoint, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn('[CortIQAgentTracker] Flush failed:', res.status, text);
        // Re-queue on transient errors (429, 5xx)
        if (res.status >= 500 || res.status === 429) {
          this.buffer.unshift(...toSend);
        }
        return { sent: 0, error: text };
      }

      const data = await res.json();
      return { sent: data.accepted ?? toSend.length };
    } catch (e) {
      console.warn('[CortIQAgentTracker] Network error:', e);
      this.buffer.unshift(...toSend); // re-queue on network error
      return { sent: 0, error: String(e) };
    }
  }

  /** Flush and stop the periodic flush timer. Call before process exit. */
  async shutdown(): Promise<void> {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    await this.flush();
  }
}

// ── Named export for convenience ──────────────────────────────────────────────
export default CortIQAgentTracker;
