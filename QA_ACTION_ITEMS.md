# CortIQ Analytics Platform - QA Action Items

**Generated:** February 9, 2026
**Priority Levels:** 1 (Critical), 2 (High), 3 (Medium), 4 (Low)

---

## CRITICAL ACTIONS (Priority 1)

### 1.1 Fix Unsafe Regular Expressions
**Severity:** HIGH - Security Risk
**Files Affected:**
- `/c/projects/cortiq/src/types/validation.ts`

**Issues:**
```typescript
// Line 25 - Unsafe special character regex
.regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// Line 56 - Slug format regex
.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
```

**Action:** Add pattern clarification or use safe alternatives
```typescript
// Improved version with anchors
.regex(/^(?=.*[^A-Za-z0-9])/, 'Password must contain at least one special character')
.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
```

**Estimated Effort:** 30 minutes
**Files to Review:** 1
**Related Tests:** Input validation tests

---

### 1.2 Address React Hook Dependencies
**Severity:** HIGH - Correctness & Performance
**Total Issues:** 40 components with exhaustive-deps warnings

**Affected Components (Top 10):**
1. HeatmapVisualization.tsx (line 48)
2. ABTestingOverview.tsx (line 49)
3. CMPDashboard.tsx (line 29)
4. CampaignDashboard.tsx (line 47)
5. ConversionGoalsConfig.tsx (line 39)
6. SessionRecordingPlayback.tsx (line 31-106)
7. NavigationAnalytics.tsx (line 158)
8. PageFunnelAnalyzer.tsx (line 52-101)
9. ScheduledReports.tsx (line 95)
10. AITrafficOverview.tsx (line 91-164)

**Command to Apply Auto-Fix:**
```bash
npx eslint src --fix
```

**Manual Review Required:** Yes - verify after auto-fix

**Estimated Effort:** 2-3 hours
**Files to Review:** 40 components
**Related Tests:** Component re-render tests needed

---

### 1.3 Replace `any` Types with Specific Interfaces
**Severity:** HIGH - Type Safety
**Total Issues:** 291 instances

**Top Files (by error count):**
1. Dashboard.tsx - 54 errors
2. useCookieDefinitions.tsx - 32 errors
3. PageFunnelAnalyzer.tsx - 28 errors
4. tagManager.ts - 9 errors
5. validation.ts - 8 errors

**Strategy:**
1. Create interface files for complex types
2. Replace inline `any` with proper types
3. Use `unknown` temporarily if needed with type guards
4. Add proper type annotations

**Example Refactor:**
```typescript
// Before
function process(data: any): any {
  return data.transform();
}

// After
interface ProcessData {
  transform(): unknown;
}
function process(data: ProcessData): unknown {
  return data.transform();
}
```

**Estimated Effort:** 4-6 hours
**Priority Files to Start:** Dashboard.tsx, useCookieDefinitions.tsx
**Related Tests:** TypeScript strict mode tests

---

### 1.4 Reduce Bundle Size
**Severity:** HIGH - Performance
**Current Size:** 2.27 MB (599 KB gzip)
**Target Size:** <1.5 MB (<350 KB gzip)

**Strategy:**
1. Implement code splitting for dashboard components
2. Use React.lazy() for route-based splitting
3. Lazy load heavy dependencies (charts, maps)
4. Defer non-critical components

**Implementation:**
```typescript
// Before
import PageFunnelAnalyzer from '@/components/dashboard/PageFunnelAnalyzer';

// After
const PageFunnelAnalyzer = React.lazy(
  () => import('@/components/dashboard/PageFunnelAnalyzer')
);

// In JSX
<Suspense fallback={<LoadingSpinner />}>
  <PageFunnelAnalyzer />
</Suspense>
```

**Candidates for Lazy Loading:**
- All dashboard tab components (78 components)
- Integration components (15+ components)
- Visualization components (charts, heatmaps)

**Estimated Effort:** 3-4 hours
**Tools Needed:** rollup-plugin-visualizer
**Related Tests:** Performance profiling

---

## HIGH PRIORITY ACTIONS (Priority 2)

### 2.1 Add Component Documentation
**Severity:** MEDIUM - Developer Experience
**Issue:** 156 components lack JSDoc documentation

**Implementation Template:**
```typescript
/**
 * DashboardHeader Component
 *
 * Displays the main dashboard header with site selection and date range picker.
 *
 * @component
 * @example
 * <DashboardHeader
 *   selectedSite={site}
 *   sites={allSites}
 *   onSiteSelect={handleSelect}
 * />
 *
 * @param {DashboardHeaderProps} props - Component props
 * @param {Site | null} props.selectedSite - Currently selected site
 * @param {Site[]} props.sites - List of available sites
 * @param {(site: Site) => void} props.onSiteSelect - Callback when site is selected
 * @param {DateRange} [props.dateRange] - Optional date range
 * @param {(range: DateRange | undefined) => void} [props.onDateRangeChange] - Date range callback
 * @returns {JSX.Element} The rendered component
 */
```

**Files to Document:**
- All 158 React components
- All 45 custom hooks
- All 11 type definition files
- Top 20 Edge Functions

**Estimated Effort:** 6-8 hours
**Tools:** JSDoc parser/generator
**Related Tests:** Documentation validation

---

### 2.2 Implement Unit Tests
**Severity:** MEDIUM - Code Quality
**Current Coverage:** 0%
**Target Coverage:** 60%+

**Test Framework Setup:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Critical Paths to Test (Priority Order):**
1. Authentication (useAuth hook)
2. Rate limiting (rateLimiting.ts)
3. Data export functions
4. Validation schemas (Zod)
5. GDPR compliance logic
6. Core dashboard components

**Test Patterns:**

```typescript
// Example: Rate Limiting Tests
describe('createRateLimiter', () => {
  it('should allow requests within limit', () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      maxRequests: 5
    });
    // Test implementation
  });

  it('should reject requests exceeding limit', () => {
    // Test implementation
  });
});

// Example: Component Tests
describe('DashboardHeader', () => {
  it('should render with provided site', () => {
    render(<DashboardHeader selectedSite={mockSite} sites={[]} onSiteSelect={jest.fn()} />);
    expect(screen.getByText(mockSite.site_name)).toBeInTheDocument();
  });
});
```

**File Structure:**
```
src/
  ├── __tests__/
  │   ├── hooks/
  │   │   ├── useAuth.test.ts
  │   │   └── ...
  │   ├── components/
  │   │   └── ...
  │   └── lib/
  │       └── rateLimiting.test.ts
```

**Estimated Effort:** 8-12 hours
**Files to Create:** ~20-30 test files
**Related Tests:** CI/CD integration tests

---

### 2.3 Migrate Rate Limiting to Redis
**Severity:** MEDIUM - Production Readiness
**Current State:** In-memory store (single server only)
**Issue:** Not suitable for distributed systems

**Implementation Steps:**

```typescript
// New Redis-based rate limiter
import Redis from 'redis';

class RedisRateLimitStore {
  private client: Redis.RedisClient;

  async increment(key: string, limit: number): Promise<boolean> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, this.windowMs / 1000);
    }
    return count <= limit;
  }
}
```

**Setup Requirements:**
1. Redis instance (Docker or managed service)
2. redis npm package
3. Configuration for development vs. production
4. Connection pooling

**Estimated Effort:** 3-4 hours
**Dependencies:** redis, redis-py (backend)
**Related Tests:** Distributed rate limiting tests

---

### 2.4 Add Error Boundary Components
**Severity:** MEDIUM - Error Handling
**Issue:** Missing error boundaries in components

**Implementation:**

```typescript
// ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

**Wrap High-Value Components:**
- Dashboard pages
- Integration components
- Export functionality
- Analytics charts

**Estimated Effort:** 2-3 hours
**Files to Create:** 1 ErrorBoundary component
**Files to Modify:** 20+ components

---

## MEDIUM PRIORITY ACTIONS (Priority 3)

### 3.1 Database Query Optimization
**Severity:** LOW-MEDIUM - Performance
**Areas to Improve:**
- Add composite indexes
- Implement query caching
- Monitor slow queries

**Actions:**

```sql
-- Add frequently used indexes
CREATE INDEX idx_tracking_events_site_date
  ON tracking_events(site_id, measured_at);

CREATE INDEX idx_page_views_site_session
  ON page_views(site_id, session_id);

CREATE INDEX idx_ai_bot_traffic_site_date
  ON ai_bot_traffic(site_id, detected_at);
```

**Estimated Effort:** 3-4 hours
**Files to Modify:** Supabase migrations
**Related Tests:** Query performance benchmarks

---

### 3.2 Dependency Upgrade Plan
**Severity:** LOW-MEDIUM - Maintenance
**Current Issues:** 2 moderate vulnerabilities in esbuild

**Action Items:**
1. Monitor Vite 7.3.1 stability
2. Plan quarterly security updates
3. Test breaking changes before upgrading
4. Create upgrade branch for testing

**Upgrade Schedule:**
- Q1 2026: Evaluate esbuild/vite upgrade
- Ongoing: Monitor security advisories
- Quarterly: Dependency audit

**Estimated Effort:** 2-3 hours per quarter
**Related Tests:** Regression testing after upgrades

---

### 3.3 Add Monitoring & Observability
**Severity:** MEDIUM - Operations
**Recommendations:**

1. **Error Tracking (Sentry)**
   ```bash
   npm install @sentry/react
   ```

2. **Performance Monitoring (Datadog/New Relic)**
   - Track API response times
   - Monitor Edge Function execution
   - Track user experience metrics

3. **Logging (Structured Logging)**
   - Implement Winston or Pino
   - Add correlation IDs
   - Centralized log aggregation

**Implementation Priority:**
1. Error tracking (highest ROI)
2. Performance monitoring
3. Centralized logging

**Estimated Effort:** 4-6 hours
**Related Tests:** Monitoring dashboards

---

## LOW PRIORITY ACTIONS (Priority 4)

### 4.1 Add E2E Testing
**Severity:** LOW - Test Coverage
**Framework:** Cypress or Playwright

**Critical Flows to Test:**
1. User authentication flow
2. Create site and add tracking
3. View analytics dashboard
4. Export data (CSV/JSON)
5. Configure integrations

**Estimated Effort:** 8-10 hours
**Related Tests:** CI/CD pipeline integration

---

### 4.2 API Documentation
**Severity:** LOW - Developer Experience
**Tools:** OpenAPI/Swagger

**Items to Document:**
- All REST endpoints
- Edge Function contracts
- WebSocket subscriptions
- Rate limit policies
- Example requests/responses

**Estimated Effort:** 6-8 hours
**Output:** API spec (Swagger/OpenAPI format)

---

### 4.3 Code Style Improvements
**Severity:** LOW - Code Maintainability
**Actions:**
1. Add Prettier configuration
2. Create component templates
3. Establish naming conventions guide
4. Add pre-commit hooks

**Estimated Effort:** 2-3 hours
**Tools:** Prettier, Husky, lint-staged

---

## IMPLEMENTATION ROADMAP

### Week 1 (Immediate)
- [ ] Fix unsafe regex patterns (1.1)
- [ ] Run ESLint --fix for hooks (1.2)
- [ ] Begin type replacement (1.3)

### Week 2-3
- [ ] Complete type replacement (1.3)
- [ ] Add component documentation (2.1)
- [ ] Setup unit tests (2.2)

### Week 4-5
- [ ] Implement code splitting (1.4)
- [ ] Bundle size optimization
- [ ] Test coverage improvements

### Week 6+
- [ ] Database optimization (3.1)
- [ ] Redis rate limiting (2.3)
- [ ] Add error boundaries (2.4)
- [ ] Monitoring setup (3.3)
- [ ] E2E tests (4.1)

---

## RESOURCE REQUIREMENTS

### Development Time
- **Total Hours:** 40-50 hours
- **Developers:** 1-2
- **Timeline:** 8-10 weeks (part-time)

### Testing Time
- **Unit Tests:** 8-12 hours
- **Integration Tests:** 4-6 hours
- **E2E Tests:** 8-10 hours
- **Performance Tests:** 4-6 hours

### Tools & Services
- Jest + React Testing Library (free)
- Cypress/Playwright (free)
- Redis (free or managed)
- Sentry (free tier available)
- ESLint/Prettier (free)

---

## SUCCESS METRICS

### Code Quality
- ESLint errors: 305 → 0
- TypeScript `any` types: 291 → 0
- Test coverage: 0% → 60%+

### Performance
- Bundle size: 2.27 MB → <1.5 MB
- Gzip size: 599 KB → <350 KB
- Page load time: baseline → -20%

### Security
- Unsafe regex: 3 → 0
- Vulnerabilities: 2 → 0
- Test coverage for security: 0% → 80%+

### Documentation
- Components without docs: 156 → 0
- API docs: Missing → Complete
- README examples: Basic → Comprehensive

---

## VALIDATION CHECKLIST

After implementing each action item:

- [ ] Code compiles without errors
- [ ] ESLint passes with --max-warnings 0
- [ ] All tests pass
- [ ] Bundle size meets targets
- [ ] No security vulnerabilities
- [ ] TypeScript strict mode passes
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Code review approved
- [ ] Deployed to staging successfully

---

## NOTES

### Important Considerations

1. **Breaking Changes:** Vite upgrade to 7.3.1 is breaking - test thoroughly
2. **Redis Setup:** Consider managed Redis (AWS ElastiCache, Azure Cache)
3. **Testing:** Start with critical paths for maximum ROI
4. **Documentation:** Use consistent format across all files
5. **Performance:** Profile before and after optimizations

### Risk Mitigation

- Create feature branch for each major change
- Test in staging before production
- Communicate changes to team
- Have rollback plan ready
- Monitor metrics after deployment

### Questions to Address

1. What's the capacity for performance impact during refactoring?
2. Should Redis be mandatory for production?
3. What's the target test coverage percentage?
4. Which integrations are most critical to test?
5. Are there specific browsers/devices to support?

---

**Document Generated:** February 9, 2026
**Status:** Ready for Sprint Planning
**Next Review:** After Priority 1 items complete

