# Dependency audit and repository guardrails

Recorded during QA item 4 on 4 October 2026, on the patched Next.js 16.3.8 branch. Audit results reflect the registry response at this time, not a guarantee about future advisories.

`npm audit fix --ignore-scripts` applies compatible updates. The scoped override `tar@^7.0.0: ^7.5.22` updates the vulnerable tar 7 dependency within its major version. It does not force tar 6 callers onto tar 7.

The full dependency audit fell from 57 advisories (3 critical) to 47 (0 critical, 37 high, 9 moderate, 1 low). These counts include affected parent packages, not 47 distinct vulnerabilities. Next.js is no longer listed.

## Remaining runtime dependencies

`npm audit --omit=dev` lists five affected packages: `@anthropic-ai/sdk` (moderate) and `@grpc/grpc-js`, `@firebase/firestore`, `@firebase/firestore-compat`, `firebase` (high). The SDK advisory concerns the filesystem memory tool, which this app does not use. The gRPC advisories concern certificate authorization context and server error details; the app uses Firebase's client SDK, but the transitive dependency remains vulnerable and is not dismissed as fixed.

Firestore currently constrains gRPC to `~1.9.0`; a patched gRPC requires crossing that constraint. Resolve via an upstream Firebase update or a separately tested compatibility change. Do not blindly force an override. The audit also proposes Anthropic 0.131.0, Vercel 62.2.0, and downgrades of Firebase and eslint-config-next. These are outside this compatible-update pass; downgrading the patched Next.js ESLint pairing is inappropriate.

Most other affected packages arrive through the development-only Vercel CLI and ESLint tooling. They still matter when those tools process untrusted input. The list below deliberately retains them rather than hiding dev dependencies.

## Repository checks

`verify-exports` now fails CI if any exported Vite project fails to compile. The protected `checks` job depends on it, so a failed export cannot bypass the existing required check. All five systems pass locally. Existing main protection was inspected read-only: pull requests and checks are required, including for administrators. No GitHub settings were changed.

## Remaining audit packages

| Package | Severity |
| --- | --- |
| @anthropic-ai/sdk | moderate |
| @fastify/busboy | high |
| @firebase/firestore | high |
| @firebase/firestore-compat | high |
| @grpc/grpc-js | high |
| @next/eslint-plugin-next | high |
| @tootallnate/once | low |
| @ts-morph/common | high |
| @vercel/backends | high |
| @vercel/build-utils | high |
| @vercel/cervel | high |
| @vercel/elysia | moderate |
| @vercel/express | high |
| @vercel/fastify | moderate |
| @vercel/fun | high |
| @vercel/gatsby-plugin-vercel-builder | high |
| @vercel/h3 | moderate |
| @vercel/hono | high |
| @vercel/hydrogen | high |
| @vercel/koa | moderate |
| @vercel/nestjs | moderate |
| @vercel/node | high |
| @vercel/python | high |
| @vercel/python-analysis | high |
| @vercel/redwood | high |
| @vercel/remix-builder | high |
| @vercel/rust | moderate |
| @vercel/static-build | high |
| @vercel/static-config | high |
| ajv | moderate |
| basic-ftp | high |
| braces | high |
| eslint-config-next | high |
| fast-glob | high |
| firebase | high |
| get-uri | high |
| js-yaml | high |
| micromatch | high |
| minimatch | high |
| pac-proxy-agent | high |
| path-to-regexp | high |
| proxy-agent | high |
| smol-toml | high |
| srvx | moderate |
| ts-morph | high |
| undici | high |
| vercel | high |
