import { Link } from 'react-router-dom';

function Home() {
  return (
    <article>
      <h1>POC 2 — Module Federation (rsbuild build)</h1>
      <p>
        This shell consumes a component exposed by the third-party app at
        runtime via Webpack Module Federation. It never imports their source.
      </p>

      <h2>Why rsbuild instead of Next.js?</h2>
      <p>
        The earlier <code>shell-poc2</code> attempt used Next.js 16 App Router
        with <code>@module-federation/enhanced</code>. The configuration is
        correct and the remote serves <code>remoteEntry.js</code>, but the
        federation share runtime fails with <code>loadShareSync</code> errors
        on the client because Next 16 App Router has no equivalent of the
        legacy <code>nextjs-mf</code> Pages-Router wrapper. See{' '}
        <code>../shell-poc2/README.md</code> for the full negative-result
        writeup. This rsbuild rebuild uses{' '}
        <code>@module-federation/rsbuild-plugin</code> from the same team
        that owns the Module Federation enhanced engine — no Next-specific
        async-boundary plumbing needed.
      </p>

      <h2>Try the federated component</h2>
      <p>
        Visit <Link to="/tool">/tool</Link> to see{' '}
        <code>thirdparty/Tool</code> loaded from{' '}
        <code>http://localhost:3011/_next/static/chunks/remoteEntry.js</code>{' '}
        at runtime, wrapped in this shell&rsquo;s USWDS chrome.
      </p>

      <h2>Branding</h2>
      <p>
        The shell loads <code>/brand/overrides.css</code> at the top of every
        page. Because the federated component mounts inside this shell&rsquo;s
        DOM, it inherits the same <code>:root</code> tokens by normal CSS
        cascade — POC 1&rsquo;s overlay mechanism transfers without
        modification.
      </p>

      <h2>Auth handoff</h2>
      <p>
        The federated <code>Tool</code> component accepts an optional{' '}
        <code>session</code> prop. The shell passes a mock session for the
        demo. Three propagation patterns are documented in the README
        (React context, JWT forwarding, shared-cookie subdomain) with
        federal SSO/PIV refresh notes.
      </p>
    </article>
  );
}

export default Home;
