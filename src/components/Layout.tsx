import { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import styles from './Layout.module.css';

function Layout({ children }: PropsWithChildren) {
  return (
    <div className={styles.page}>
      <a href="#main" className={styles.skip}>
        Skip to main content
      </a>
      <header className={styles.header} role="banner">
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            Shell Application (POC 2 — Module Federation, rsbuild)
          </Link>
          <nav aria-label="Primary">
            <ul className={styles.nav}>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/tool">Tool</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer} role="contentinfo">
        <p>POC 2 (rsbuild). Federation consumer of third-party-poc2.</p>
      </footer>
    </div>
  );
}

export default Layout;
