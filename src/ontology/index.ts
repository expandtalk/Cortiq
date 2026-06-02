import type { AgentConcept, AnyConcept, ConceptId, Ontology } from './types';
import { agents } from './agents';
import { events } from './events';
import { traffic } from './traffic';
import { integrations } from './integrations';

export * from './types';
export * from './integrations';
export { agents } from './agents';
export { events } from './events';
export { traffic } from './traffic';
export { integrations } from './integrations';

/* ── Combined ontology object ────────────────────────────────────── */

export const ontology: Ontology = {
  version: '1.1.0',
  description: 'CortIQ analytics ontology — agents, events, traffic sources, and integration providers for the agentic web.',
  agents,
  events,
  traffic,
  integrations,
};

/* ── Utility: hierarchy traversal ───────────────────────────────── */

function conceptsOf(domain: Record<string, AnyConcept>) {
  return {
    get(id: ConceptId): AnyConcept | undefined {
      return domain[id];
    },

    /** All ancestor IDs, from immediate parent up to root */
    ancestors(id: ConceptId): ConceptId[] {
      const result: ConceptId[] = [];
      let current = domain[id];
      while (current?.parent) {
        result.push(current.parent);
        current = domain[current.parent];
      }
      return result;
    },

    /** All descendant IDs (recursive) */
    descendants(id: ConceptId): ConceptId[] {
      const result: ConceptId[] = [];
      const queue = [...(domain[id]?.children ?? [])];
      while (queue.length) {
        const next = queue.shift()!;
        result.push(next);
        const children = domain[next]?.children;
        if (children) queue.push(...children);
      }
      return result;
    },

    /** Is `candidate` the same as or a descendant of `ancestor`? */
    isA(candidate: ConceptId, ancestor: ConceptId): boolean {
      if (candidate === ancestor) return true;
      return this.ancestors(candidate).includes(ancestor);
    },
  };
}

export const agentOntology = conceptsOf(agents as Record<string, AnyConcept>);
export const eventOntology = conceptsOf(events as Record<string, AnyConcept>);
export const trafficOntology = conceptsOf(traffic as Record<string, AnyConcept>);
export const integrationOntology = conceptsOf(integrations as Record<string, AnyConcept>);

/* ── Utility: agent detection ───────────────────────────────────── */

/**
 * Match a User-Agent string against the ontology and return the most
 * specific matching agent concept ID, or null if no match.
 */
export function detectAgent(userAgent: string): ConceptId | null {
  // Only leaf instances carry uaPatterns
  for (const [id, concept] of Object.entries(agents)) {
    if (concept.kind !== 'agent-instance') continue;
    const patterns = (concept as AgentConcept).uaPatterns;
    if (!patterns?.length) continue;
    const regex = new RegExp(patterns.join('|'), 'i');
    if (regex.test(userAgent)) return id;
  }
  return null;
}

/**
 * Return true if the given agent ID is any kind of AI agent
 * (browser, text-based, or unspecified).
 */
export function isAIAgent(agentId: ConceptId): boolean {
  return agentOntology.isA(agentId, 'ai_agent');
}

/**
 * Return true if the agent is a visual (full-browser) AI agent.
 */
export function isBrowserAIAgent(agentId: ConceptId): boolean {
  return agentOntology.isA(agentId, 'browser_ai_agent');
}

/* ── Utility: serialisation ─────────────────────────────────────── */

/**
 * Export the full ontology as a plain JSON-serialisable object.
 * Suitable for serving as /api/ontology or writing to public/ontology.json.
 */
export function toJSON(): string {
  return JSON.stringify(ontology, null, 2);
}
