# shell-poc2-rsbuild — Module Federation host (POC 2, rsbuild) — **WORKING**

This is the working POC 2 demo. The earlier
[`../shell-poc2/`](../shell-poc2/) attempt — Next.js 16 App Router with
`@module-federation/enhanced` — got configurations right but the
federation share runtime fails with `loadShareSync` errors at the
browser. Read its README for the negative-result documentation.

This rsbuild version pairs with
[`../third-party-poc2-rsbuild/`](../third-party-poc2-rsbuild/) (the
remote). Together they deliver federation end-to-end: the federated
`thirdparty/Tool` component renders inside the shell's USWDS chrome, the
session prop is propagated from host to remote, the form is interactive,
and the brand overlay cascades into the federated DOM.

## Topology

| Repo | Role | Port |
|---|---|---|
| `shell-poc1` | CSS-overlay shell (POC 1) | 3000 |
| `third-party-poc1` | CSS-overlay target (POC 1) | 3001 |
| `shell-poc2` | Next.js federation host — **negative-result documentation** | — |
| `third-party-poc2` | Next.js federation remote — same | — |
| `shell-poc2-rsbuild` (this) | rsbuild federation host — **working** | 3010 |
| `third-party-poc2-rsbuild` | rsbuild federation remote | 3011 |

## How federation works here

The host's `rsbuild.config.ts` configures
`@module-federation/rsbuild-plugin` as a consumer of the `thirdparty`
remote. At browser runtime, the MF runtime fetches `remoteEntry.js`
from the remote URL, evaluates it, picks up `window.thirdparty`, and
returns the federated module to `import('thirdparty/Tool')`. React 19
is shared between host and remote as a singleton.

`src/routes/Tool.tsx` does:
```ts
const FederatedTool = lazy(() => import('thirdparty/Tool'));
```
…wrapped in `Suspense` (loading state) and a custom error boundary
(remote-down fallback with retry).

## Why rsbuild instead of Next.js

Two stacked blockers ruled out the Next.js path:

1. **Consumer side (shell-poc2)**: `@module-federation/nextjs-mf` (the
   spec choice) declares peer `next@^12 || ^13 || ^14 || ^15` — explicit
   ERESOLVE on Next 16. `@module-federation/enhanced` installs but its
   share runtime emits `loadShareSync` errors on the client because Next
   16 App Router has no async-boundary wrapper equivalent to the legacy
   `nextjs-mf` Pages Router wrapper.
2. **Producer side (third-party-poc2)**: even with the consumer issue
   resolved, Next.js wraps every webpack chunk — including the
   federation entry — in its `webpackChunk_N_E` chunk-loading protocol.
   The remote's `remoteEntry.js` ends with `window.thirdparty = …` but
   that initializer is inside the chunk-queue handler the host never
   invokes. The script loads with `200`, executes, but never sets the
   expected global.

The rsbuild stack uses `@module-federation/rsbuild-plugin` from the
same team that owns the Module Federation enhanced engine. The runtime
plumbing is built for this — no Next-specific patching required.

## Branding

`/brand/overrides.css` (copied from POC 1) is injected at the top of
`<head>` via rsbuild's `html.tags` config. Because the federated
component mounts inside this shell's DOM, it inherits `:root` tokens
through normal CSS cascade. POC 1's overlay mechanism transfers
without modification — the federated `thirdparty/Tool` paints with the
shell's USWDS palette.

## Auth handoff — three propagation patterns (documented only)

The federated component runs inside the host's origin (`:3010`); its
chunks are fetched from `:3011` but execute as host code. That means
cookies are the host's cookies — same-origin scope. The remote's own
API calls go to `:3011` unless explicitly routed — that's the real
trust boundary.

| Pattern | How | Tradeoff |
|---|---|---|
| React context | Host puts session into context; remote reads it | Tight coupling: the context shape is a contract pinned by both teams |
| Token forwarding | Host mints a short-lived JWT scoped to the remote's API, passes via prop or `Authorization` header | Cleanest separation; requires both teams to agree on token format (probably OIDC) |
| Cookie-shared subdomain | Host sets cookie on `.example.gov`; remote API at `tool.example.gov` reads it | Easiest if deployment topology supports it |

**Federal-context note**: PIV/CAC and ICAM-based SSO add session-refresh
requirements that token-forwarding handles better than context-sharing —
context can go stale silently, whereas an expired token surfaces as a
401 from the API.

The POC's `Tool` accepts an optional `session` prop; the host passes a
mock value (see `src/routes/Tool.tsx`). Production would derive it from
real auth (NextAuth, etc.) — out of scope for this POC per the original
spec.

## What the third party must commit to

We don't know the third party's actual build stack — they haven't
shared it. The shape of the ask changes depending on what they use.
The two POC 2 attempts simulated Next.js (the easiest-to-reach worst
case for federation) and rsbuild (the easiest-to-reach best case).
The findings below project from those two data points.

**Stack-dependent ask** (the biggest variable):

| Their build | What we need from them | Cost to them |
|---|---|---|
| rspack / rsbuild | Add `@module-federation/rsbuild-plugin` to their config, expose the component, deploy as-is | Low |
| Standard webpack 5 (CRA, custom, anything not Next.js) | Add `ModuleFederationPlugin` to their webpack config, expose, deploy | Low |
| Vite | Add `@module-federation/vite` plugin, expose, deploy | Low–medium (vite's MF support is younger) |
| Next.js, Pages Router, ≤15 | Add `@module-federation/nextjs-mf`, expose, deploy | Low |
| Next.js, App Router, ≥15 | No working federation wrapper today. They'd need to **stand up a sidecar build pipeline** (rsbuild or raw webpack) alongside their Next.js app, just for the federated surface. Two builds, two artifacts. | **High** — this is the case where federation may not be worth pursuing vs. POC 1's CSS overlay |
| Astro, SolidStart, other non-webpack frameworks | Likely needs a sidecar build similar to the App Router case, OR pivot to POC 1's iframe + CSS overlay approach | **High** |

We should ask the third party what they use early in the proposal
conversation — that single answer determines whether federation is a
cheap ask or an expensive one.

**Stack-independent asks** (apply regardless of their build):

1. **A pinned version contract for shared deps.** React, ReactDOM, and
   anything else listed in `shared:` must agree on major version. The
   POC declares `singleton: true, requiredVersion: false` — production
   should pin to a specific range.
2. **A pinned contract for the exposed component's prop interface.** A
   breaking change in `ToolProps` breaks the host at runtime, not build
   time. Recommend a contract test in CI that imports the federated
   types and checks them.
3. **An auth-handoff pattern** (one of the three above). Without
   agreement, federation works visually but the federated component
   can't authenticate against its own API.
4. **CORS on the federation chunk URL.** The remote must serve
   `remoteEntry.js` (and chunks) with `Access-Control-Allow-Origin`
   matching the host's origin (or `*` for non-credentialed loads).

## Limitations / known caveats

- **Webpack/rspack only.** Turbopack support for MF is still maturing.
- **CSR for the federated route.** React.lazy + Suspense load the
  federated component on the client. Costs SEO and time-to-paint on
  this route specifically. The shell's other routes still SSR fine via
  rsbuild's HTML output.
- **Failure isolation.** If the remote is down, the error boundary
  renders a "Tool unavailable" fallback with a retry button. Verified
  by killing the remote dev server and reloading — no shell crash.
- **Deploy coupling.** A breaking change in the remote's exposed
  interface breaks the host at runtime, not build time. Contract tests
  recommended.

## Run

```
# Terminal 1 — remote
cd ../third-party-poc2-rsbuild
npm install
npm run dev   # http://localhost:3011

# Terminal 2 — host
cd ../shell-poc2-rsbuild
npm install
npm run dev   # http://localhost:3010
```

Visit `http://localhost:3010/tool`. You should see the USWDS-branded
shell chrome wrapping the federated `thirdparty/Tool` component, with
the session badge showing `Signed in as agency.user@example.gov (GSA)`.
Type in the textarea and click Send — the mock response renders.

To verify the failure mode: kill the remote (`Ctrl-C` on `:3011`),
reload `:3010/tool` — the error boundary renders. Restart the remote,
click Retry — the component re-mounts cleanly.

## Render.com deploy

`render.yaml` is committed. To deploy:
1. Push to GitHub, connect repo in Render, accept the blueprint.
2. Update `PUBLIC_REMOTE_URL` in Render env to point at the deployed
   `third-party-poc2-rsbuild` URL's `/remoteEntry.js`.
