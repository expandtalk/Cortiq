export type ConceptId = string;

export interface OntologyConcept {
  id: ConceptId;
  label: string;
  description: string;
  parent?: ConceptId;
  children?: ConceptId[];
}

export interface AgentConcept extends OntologyConcept {
  kind: 'agent-class' | 'agent-instance';
  vendor?: string;
  /** Serializable strings used to build RegExp for UA matching */
  uaPatterns?: string[];
  aliases?: string[];
  browserType?: 'visual' | 'headless' | 'text-based' | 'unknown';
}

export interface EventConcept extends OntologyConcept {
  kind: 'event-class' | 'event-instance';
  /** Value used in tracking_events.event_type */
  trackingCode?: string;
}

export interface TrafficConcept extends OntologyConcept {
  kind: 'traffic-class' | 'traffic-instance';
  utmMedium?: string;
  utmSources?: string[];
  referrerPatterns?: string[];
}

export type AnyConcept = AgentConcept | EventConcept | TrafficConcept;

export interface Ontology {
  version: string;
  description: string;
  agents: Record<ConceptId, AgentConcept>;
  events: Record<ConceptId, EventConcept>;
  traffic: Record<ConceptId, TrafficConcept>;
  integrations?: Record<ConceptId, OntologyConcept>;
}
