# Response security policy

All routes receive the headers in `next.config.ts`, including the public shared
preview. Responses prohibit framing, disable MIME sniffing, limit referrer
information, and omit `X-Powered-By`.

The CSP preserves static rendering. Next.js bootstrap scripts and the supported
design systems need inline scripts and styles, so this baseline permits
`unsafe-inline`. It is not a substitute for input validation or output escaping.
A nonce-based policy would require a separate dynamic-rendering/cache design.
Production does not permit `unsafe-eval`; development permits it for Next.js.

Allowed third-party origins serve these purposes:

- Google Fonts and Material Symbols: styles and font files.
- Google Analytics / Tag Manager: scripts and analytics requests.
- Firebase: identity, token refresh, installations and Firestore requests.
- Vercel: preview toolbar, its assets and WebSocket connection, and Web Vitals.

Model API requests stay on the server. Their origins are not allowed by the
browser policy. HTTPS images remain supported for the existing templates and
shared previews; QA item 3 separately restricts shared-preview image sources.
Workers and media allow same-origin/blob resources for existing app features.

`e2e/security-headers.spec.ts` checks production response headers and console CSP
violations on every page, including a valid shared canvas. Run it against a
production server; a dev server intentionally has a different script policy.
Credentialed Firebase and Vercel preview-toolbar behavior also need checking in
the configured preview environment before merge.

The Next.js 16.3.8 upgrade renames `src/middleware.ts` to `src/proxy.ts`, retaining
the existing route matcher and login behavior. Session and API authentication
changes belong to QA item 3.
