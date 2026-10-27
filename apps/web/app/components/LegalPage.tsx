import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  updated,
  children
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main>
      <div className="shell">
        <nav className="nav">
          <Link className="brand" href="/">
            <span className="brand-mark">R</span>
            <span>RepairLoop</span>
          </Link>
          <div className="nav-actions">
            <Link className="nav-link" href="/check">
              Check a device
            </Link>
            <Link className="nav-link" href="/catalog">
              Catalog
            </Link>
            <span className="badge">Sandbox prototype</span>
          </div>
        </nav>

        <div className="check-shell">
          <div className="check-head">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="check-title">{title}</h1>
              <p className="lede">{updated}</p>
            </div>
          </div>

          <div className="flow-card legal-copy">{children}</div>

          <footer className="footer">
            <div>
              <p>
                RepairLoop is a hackathon prototype. Sandbox payments only. Dell
                is a trademark of Dell Inc.; RepairLoop is not affiliated with or
                endorsed by Dell.
              </p>
              <div className="footer-links">
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/ai-disclosure">AI disclosure</Link>
              </div>
            </div>
            <span>Repair the right thing, with the right part.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
