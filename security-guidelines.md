# CortIQ Security Guidelines

## Overview

This document outlines security best practices and requirements for the CortIQ Analytics platform. All developers must adhere to these guidelines to maintain the security posture of the application.

---

## 1. SQL Injection Prevention

SQL injection is a code injection technique where an attacker inserts malicious SQL statements into entry fields.

### Best Practices

1. **Use Parameterized Queries (Prepared Statements)**
   - Always use Supabase parameterized query methods: `.eq()`, `.neq()`, `.gt()`, `.gte()`, `.lt()`, `.lte()`, `.ilike()`, etc.
   - Never concatenate user input directly into query strings.

   **Good:**
   ```typescript
   const { data } = await supabase
     .from('tracking_sessions')
     .select('*')
     .eq('site_id', siteId)  // Parameterized
     .gte('created_at', startDate);
   ```

   **Bad:**
   ```typescript
   // NEVER DO THIS
   const query = `SELECT * FROM tracking_sessions WHERE site_id = '${siteId}'`;
   ```

2. **Input Validation**
   - Validate all user inputs against expected types and formats
   - Use the utilities in `src/lib/inputValidation.ts`
   - Enforce maximum length limits on all string inputs

3. **Least Privilege Principle**
   - Use Row Level Security (RLS) policies in Supabase
   - Each user should only access data they're authorized to see
   - API keys should have minimal required permissions

4. **Stored Procedures and Functions**
   - Use Supabase Edge Functions or database functions for complex operations
   - These execute on the server with parameterized queries
   - Avoid exposing raw query construction to client code

### Implementation in CortIQ

- All database access goes through Supabase client
- Supabase automatically handles parameterization
- RLS policies are defined in `supabase/migrations/`
- Input validation occurs in `src/lib/inputValidation.ts`

---

## 2. XSS (Cross-Site Scripting) Prevention

XSS occurs when an attacker injects malicious scripts that execute in users' browsers.

### Best Practices

1. **Never Use innerHTML with User Input**
   - Avoid `innerHTML` when displaying user-controlled data
   - Use `.textContent` instead of `.innerHTML` for dynamic content
   - Use React's automatic escaping in JSX

   **Good:**
   ```typescript
   // React automatically escapes
   const message = userInput;
   <div>{message}</div>  // Safe

   // Or manual escaping
   element.textContent = userInput;  // Safe
   ```

   **Bad:**
   ```typescript
   // NEVER DO THIS
   element.innerHTML = userInput;  // Vulnerable to XSS
   ```

2. **Avoid dangerouslySetInnerHTML**
   - Never use dangerouslySetInnerHTML with user input
   - If absolutely necessary, sanitize HTML using a library like DOMPurify
   - Document why it's necessary with a security comment

   **Acceptable (with static content only):**
   ```typescript
   <style dangerouslySetInnerHTML={{
     __html: `/* Static CSS generated from config */`
   }} />
   ```

3. **Content Security Policy (CSP)**
   - Implement CSP headers to prevent inline script execution
   - Restrict script sources to trusted origins only
   - Define in web server configuration

4. **URL Validation**
   - Validate URLs before using them in `href` or `src` attributes
   - Only allow http:// and https:// protocols
   - Use the `validateUrl()` function from inputValidation.ts

   **Good:**
   ```typescript
   if (validateUrl(userProvidedUrl)) {
     element.href = userProvidedUrl;
   }
   ```

5. **Event Handler Attributes**
   - Never set event handlers via innerHTML or string manipulation
   - Use React event handlers or addEventListener with proper handlers
   - Do not use eval() or Function() constructor

### Implementation in CortIQ

- React JSX provides automatic HTML escaping
- Input validation utilities in `src/lib/inputValidation.ts`
- sanitizeInput() and sanitizeHtml() functions for manual sanitization
- setAttribute() function validates URLs for security-sensitive attributes

---

## 3. Command Injection Prevention

Command injection occurs when an attacker executes arbitrary system commands.

### Best Practices

1. **Never Execute User Input as Commands**
   - Avoid `exec()`, `system()`, `shell_exec()` with user input
   - If system commands are necessary, use allowlists for permitted operations

2. **Use Built-in Libraries**
   - Use purpose-built libraries instead of system commands
   - Example: Use Node.js file system APIs instead of shell commands

3. **Input Validation**
   - Validate inputs against strict patterns before any command execution
   - Use an allowlist approach for acceptable values

### Implementation in CortIQ

- No server-side code directly executes user input as commands
- All file operations use Node.js or Supabase APIs
- WordPress plugin uses WordPress APIs, not direct shell commands

---

## 4. Path Traversal Prevention

Path traversal attacks allow attackers to access files outside intended directories.

### Best Practices

1. **Validate File Paths**
   - Never concatenate user input directly into file paths
   - Use path normalization functions
   - Check that resolved paths are within the intended directory

   **Good:**
   ```typescript
   const path = require('path');
   const basePath = '/allowed/directory';
   const userInput = userProvidedPath;
   const resolvedPath = path.resolve(basePath, userInput);

   // Ensure resolved path starts with base path
   if (!resolvedPath.startsWith(basePath)) {
     throw new Error('Invalid path');
   }
   ```

2. **Use URL-Safe Characters**
   - Only allow alphanumeric characters, hyphens, underscores in file identifiers
   - Reject paths containing `..`, `/`, or other special characters

3. **Serve Files Through APIs**
   - Don't directly expose file system paths to clients
   - Use download/streaming APIs that perform path validation

### Implementation in CortIQ

- File uploads are processed through JSZip (zip file handling)
- Plugin downloads are generated programmatically, not served directly
- No raw filesystem access from client code

---

## 5. CSRF (Cross-Site Request Forgery) Protection

CSRF attacks trick users into performing unintended actions on sites where they're authenticated.

### Best Practices

1. **SameSite Cookies**
   - Set `SameSite=Strict` or `SameSite=Lax` on authentication cookies
   - SameSite=Strict prevents cookies from being sent in cross-site requests

2. **CSRF Tokens**
   - For state-changing operations (POST, PUT, DELETE), require CSRF tokens
   - Tokens should be unique per session and validated server-side
   - Include tokens in request headers, not GET parameters

3. **Supabase Auth**
   - Supabase provides built-in CSRF protection via secure cookies
   - No additional token implementation required if using Supabase auth correctly

4. **Origin Verification**
   - Verify the `Origin` or `Referer` header matches expected domain
   - Reject requests from unexpected origins

### Implementation in CortIQ

- Supabase Auth handles session security automatically
- Authentication cookies are HttpOnly and Secure
- All state-changing operations go through authenticated Supabase APIs

---

## 6. Authentication Bypass Prevention

### Best Practices

1. **Session Security**
   - Use strong, random session identifiers
   - Implement proper session expiration and timeout
   - Clear sessions on logout
   - Don't store sensitive data in sessions

2. **Password Security**
   - Enforce strong password requirements
   - Use bcrypt or similar for password hashing (never store plaintext)
   - Implement rate limiting on login attempts
   - Use multi-factor authentication when possible

3. **API Authentication**
   - Use secure API keys with appropriate scoping
   - Store API keys in environment variables, never in code
   - Rotate keys regularly
   - Implement API key expiration

4. **Authorization Checks**
   - Always verify authorization, not just authentication
   - Check that users have permission to access specific resources
   - Implement role-based access control (RBAC)

### Implementation in CortIQ

- Supabase Auth provides session management
- RLS policies enforce per-row authorization
- API keys stored in environment variables
- User roles and permissions defined in database

---

## 7. Secrets Management

### Best Practices

1. **Never Hardcode Secrets**
   - API keys, passwords, and tokens must never appear in source code
   - Use environment variables for all secrets
   - Never commit `.env` or secret files to version control

2. **Environment Variables**
   - Store all sensitive configuration in `.env` or similar
   - Use different secrets for development, staging, and production
   - Rotate secrets regularly

3. **Secret Rotation**
   - Implement mechanisms to rotate secrets without downtime
   - Monitor for exposed secrets and rotate immediately
   - Use secret management services (AWS Secrets Manager, HashiCorp Vault, etc.)

4. **Access Control**
   - Limit who has access to secrets
   - Use role-based access for secret management systems
   - Audit all access to secrets

### Implementation in CortIQ

- Supabase URL and keys in `.env` (not committed)
- API keys stored in environment variables
- No secrets in source code or configuration files
- `.env` and sensitive files in `.gitignore`

---

## 8. Input Validation Requirements

All user input must be validated before use, regardless of source.

### Validation Rules

1. **Whitelist Validation**
   - Only allow known-good values
   - Define explicit allowed values for enums and selects
   - Reject anything not in the whitelist

2. **Type Validation**
   - Verify input matches expected data type
   - Use TypeScript for compile-time type checking
   - Validate at runtime for API inputs

3. **Length Validation**
   - Enforce maximum length limits on all string inputs
   - Enforce valid ranges on numeric inputs
   - Prevent buffer overflow and DoS attacks

4. **Format Validation**
   - Use regular expressions for pattern matching
   - Validate emails, URLs, phone numbers with appropriate patterns
   - Reject malformed input

5. **Encoding Validation**
   - Ensure input uses expected character encoding (UTF-8)
   - Reject unexpected encoding or control characters
   - Handle special characters appropriately

### Validation Functions

Use provided utilities in `src/lib/inputValidation.ts`:

```typescript
validateEmail(email: string): boolean
validateUrl(url: string): boolean
validateDomain(domain: string): boolean
sanitizeInput(input: string, maxLength?: number): string
validateTrackingId(trackingId: string): boolean
validateUuid(uuid: string): boolean
```

### Implementation in CortIQ

- Input validation utilities in `src/lib/inputValidation.ts`
- Zod for schema validation in forms
- Server-side validation in Supabase Edge Functions
- TypeScript for compile-time type safety

---

## 9. Rate Limiting Standards

Rate limiting prevents abuse by limiting the number of requests from a single source.

### Rate Limiting Policies

1. **API Rate Limits**
   - **Public APIs**: 100 requests per minute per IP
   - **Authenticated APIs**: 1,000 requests per minute per user
   - **Tracking Endpoint**: 10,000 events per minute per site
   - **Export/Import**: 10 requests per minute per user

2. **Login Attempts**
   - **Max failed attempts**: 5 attempts
   - **Lockout duration**: 15 minutes
   - **Progressive backoff**: Increase delay after each failure

3. **Email/SMS**
   - **Max emails per hour**: 10 per user
   - **Max SMS per day**: 5 per user
   - **Prevention of email bombing**

4. **Implementation**
   - Track requests by IP address for anonymous users
   - Track requests by user ID for authenticated users
   - Use sliding window or token bucket algorithm
   - Return 429 Too Many Requests when limit exceeded

### Rate Limiting Headers

Include these headers in all responses:

```
X-RateLimit-Limit: <max requests per window>
X-RateLimit-Remaining: <requests remaining in window>
X-RateLimit-Reset: <unix timestamp when window resets>
```

### Implementation in CortIQ

- Rate limiting middleware in `src/lib/rateLimiting.ts`
- Different limits for authenticated vs. anonymous users
- Tracking endpoint has higher limits for legitimate use
- Returns 429 status code when exceeded

---

## 10. OWASP Top 10 Coverage

This section maps security controls to the OWASP Top 10 vulnerabilities.

### A01: Broken Access Control
- **Controls**: RLS policies, authorization checks, role-based access
- **Implementation**: Supabase RLS in `supabase/migrations/`
- **Testing**: Verify unauthorized access is blocked

### A02: Cryptographic Failures
- **Controls**: HTTPS only, secure API keys, encrypted secrets
- **Implementation**: Supabase enforces HTTPS, environment variables for secrets
- **Testing**: Verify secrets aren't logged or exposed

### A03: Injection
- **Controls**: Parameterized queries, input validation, command restrictions
- **Implementation**: Supabase parameterized APIs, input validation utilities
- **Testing**: Test with SQL/XSS payloads to verify filtering

### A04: Insecure Design
- **Controls**: Security requirements in design, threat modeling, secure defaults
- **Implementation**: GDPR-first design, security-first defaults
- **Testing**: Security code review, penetration testing

### A05: Security Misconfiguration
- **Controls**: Security hardening, minimal permissions, secure defaults
- **Implementation**: Environment-specific config, principle of least privilege
- **Testing**: Configuration audits, security scanning

### A06: Vulnerable and Outdated Components
- **Controls**: Dependency scanning, regular updates, version pinning
- **Implementation**: npm audit, dependabot, regular updates
- **Testing**: Run `npm audit` regularly, fix vulnerabilities promptly

### A07: Identification and Authentication Failures
- **Controls**: Strong session management, MFA, secure password practices
- **Implementation**: Supabase Auth, rate limiting on login
- **Testing**: Test session fixation, credential stuffing prevention

### A08: Software and Data Integrity Failures
- **Controls**: Code signing, dependency verification, update integrity
- **Implementation**: npm package verification, git commit signing
- **Testing**: Verify package integrity, check for unauthorized changes

### A09: Logging and Monitoring Failures
- **Controls**: Security logging, audit trails, monitoring
- **Implementation**: Activity logging in database, error tracking
- **Testing**: Verify sensitive data isn't logged, check audit trails

### A10: Using Components with Known Vulnerabilities
- **Controls**: Vulnerability scanning, prompt patching
- **Implementation**: npm audit, automatic dependency updates
- **Testing**: Regular scanning with tools like Snyk, audit logs

---

## Code Review Checklist

Use this checklist during code reviews:

- [ ] No hardcoded secrets or API keys
- [ ] All user input is validated
- [ ] Database queries use parameterized queries
- [ ] No dangerous functions (eval, innerHTML with user input, exec)
- [ ] Sensitive data is not logged
- [ ] Authentication and authorization checks are present
- [ ] Error messages don't leak sensitive information
- [ ] HTTPS is enforced for all communications
- [ ] Security headers are configured
- [ ] Input/output encoding is appropriate
- [ ] Race conditions are prevented where applicable
- [ ] Rate limiting is implemented for sensitive operations

---

## Security Incident Response

1. **Discovery**
   - Stop and isolate affected systems
   - Preserve logs and evidence
   - Notify security team immediately

2. **Investigation**
   - Determine scope and impact
   - Identify root cause
   - Check for lateral movement or data theft

3. **Remediation**
   - Apply fix or patch
   - Test in staging environment
   - Deploy fix to production

4. **Recovery**
   - Restore affected systems
   - Verify normal operation
   - Monitor for re-exploitation

5. **Post-Incident**
   - Document findings and timeline
   - Perform root cause analysis
   - Implement preventive measures
   - Notify affected users if necessary
   - Update security guidelines if applicable

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/nodejs-security/)
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

---

## Approval and Review

- **Last Updated**: 2025-12-16
- **Maintained By**: Security Team
- **Review Frequency**: Quarterly

All developers must acknowledge these guidelines and agree to follow them.
