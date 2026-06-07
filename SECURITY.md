# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in CortIQ, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Contact:

- **Email:** daniel.larsson@expandtalk.se
- **LinkedIn:** https://www.linkedin.com/in/larssondaniel

Include a description of the vulnerability, steps to reproduce, and potential impact. You will receive a response within 48 hours.

## Scope

| Area | In scope |
|---|---|
| Row Level Security bypass | ✅ |
| Edge Function injection | ✅ |
| Auth / session vulnerabilities | ✅ |
| Tracking script XSS | ✅ |
| Exposed credentials in code | ✅ |
| Third-party dependencies | ❌ Report upstream |

## Security design

- All database tables have Row Level Security enabled
- Secrets are loaded via `Deno.env.get()` in Edge Functions — never hardcoded
- The anon/publishable key is browser-safe by design; data access is controlled by RLS
- Public tracking endpoints validate input and apply rate limiting
- `.env` files are excluded from version control via `.gitignore`
