import { ApiStatus } from "./components/ApiStatus";

const models = [
  "Latitude 5400",
  "Latitude 5401",
  "Latitude 5500",
  "Precision 3540"
];

const steps = [
  {
    number: "01",
    title: "Start with the battery report",
    body: "Run powercfg /batteryreport or photograph the bottom/battery label. Upload only the redacted “Installed batteries” section."
  },
  {
    number: "02",
    title: "Confirm — don’t trust",
    body: "Gemini extracts the model, capacity, and part number. You correct any character before anything is matched."
  },
  {
    number: "03",
    title: "Verify the exact part",
    body: "A source-linked catalog maps the confirmed data to the 68Wh 7.6V family. Lower-capacity options are labelled; the 15.2V variant is excluded."
  },
  {
    number: "04",
    title: "Complete with PayPal",
    body: "Review the exact item and total, approve a PayPal Sandbox payment, and see the verified capture ID — or a clear cancel/error state."
  }
];

export default function HomePage() {
  return (
    <main>
      <div className="shell">
        <nav className="nav">
          <div className="brand">
            <span className="brand-mark">R</span>
            <span>RepairLoop</span>
          </div>
          <span className="badge">Sandbox prototype</span>
        </nav>

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Verified repair parts · PayPal Sandbox</p>
            <h1>Repair the right thing, with the right part.</h1>
            <p className="lede">
              Your laptop says it needs a new battery. Dell lists three
              capacities and multiple part numbers. RepairLoop verifies the
              exact 68Wh 7.6V replacement — then completes the purchase with
              PayPal.
            </p>
            <div className="actions">
              <a className="button primary" href="/check">
                Check my laptop battery
              </a>
              <a className="button ghost" href="#models">
                See supported models
              </a>
            </div>
            <p className="fine-print">
              No AI guesses. No wrong-part checkout. Sandbox payments only.{" "}
              <a className="inline-link" href="/check?demo=1">
                Open the demo case →
              </a>
            </p>
          </div>

          <aside className="demo-card">
            <div className="demo-card-head">
              <span className="pill">Demo case</span>
              <span className="demo-device">Dell Latitude 5400</span>
            </div>
            <dl className="spec-list">
              <div>
                <dt>Installed battery</dt>
                <dd>68Wh · 4-cell · 7.6V</dd>
              </div>
              <div>
                <dt>Reported part</dt>
                <dd>
                  <code>X77XY</code>
                </dd>
              </div>
              <div>
                <dt>Health</dt>
                <dd>69% · 46,907 / 68,005 mWh</dd>
              </div>
              <div>
                <dt>Verified replacement</dt>
                <dd>
                  <code>4GVMP</code> family
                </dd>
              </div>
            </dl>
            <div className="verdict">
              <span className="verdict-label">Refuses to guess</span>
              <p>
                The 68Wh <code>3HWPP</code> is 15.2V — not verified for this
                7.6V configuration. Checkout stays disabled.
              </p>
            </div>
          </aside>
        </section>

        <section className="section" id="problem">
          <div className="section-head">
            <p className="eyebrow">The problem</p>
            <h2>A battery is not a battery.</h2>
            <p>
              The same laptop family can use 42Wh, 51Wh, or 68Wh packs, with
              different voltages and several Dell part numbers. The wrong part
              is a wasted purchase and a reason to give up on repair.
            </p>
          </div>
          <div className="grid three">
            <article className="card">
              <h3>Three capacities</h3>
              <p>
                42Wh and 51Wh are 11.4V 3-cell. 68Wh is 7.6V 4-cell. The
                physical size and connector can differ.
              </p>
            </article>
            <article className="card">
              <h3>Many part numbers</h3>
              <p>
                The 68Wh family alone includes <code>4GVMP</code>,{" "}
                <code>X77XY</code>, <code>RF7WM</code>, <code>C5GV2</code>,
                and more. Retailers cross-reference them differently.
              </p>
            </article>
            <article className="card">
              <h3>Checkout is the moment</h3>
              <p>
                A repair becomes real when the exact part is purchased. The
                app must make the item, total, and buyer approval unambiguous.
              </p>
            </article>
          </div>
        </section>

        <section className="section" id="how">
          <div className="section-head">
            <p className="eyebrow">How it works</p>
            <h2>AI handles the mess. The catalog decides.</h2>
          </div>
          <div className="steps">
            {steps.map((step) => (
              <article className="step" key={step.number}>
                <span className="step-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="refuse-card">
            <div>
              <p className="eyebrow">Built to refuse</p>
              <h2>Trust is the feature.</h2>
              <p>
                RepairLoop would rather lose a sale than sell the wrong part.
                The no-match state is not an error — it is the product.
              </p>
            </div>
            <ul className="check-list">
              <li>AI never decides fitment, price, or payment.</li>
              <li>No verified source → no match → no checkout.</li>
              <li>Damaged or swollen battery → stop; professional service.</li>
              <li>Payment success only after a verified PayPal capture.</li>
            </ul>
          </div>
        </section>

        <section className="section" id="models">
          <div className="section-head">
            <p className="eyebrow">Supported today</p>
            <h2>One battery family. Verified before it expands.</h2>
            <p>
              We start with the shared Latitude 5400 battery family because the
              part-number confusion is real and the data can be checked. Other
              models are requested, not guessed.
            </p>
          </div>
          <div className="model-row">
            {models.map((model) => (
              <span className="model-pill" key={model}>
                {model}
              </span>
            ))}
          </div>
          <div className="section" style={{ paddingBottom: 0 }}>
            <ApiStatus />
          </div>
        </section>

        <footer className="footer">
          <p>
            RepairLoop is a hackathon prototype. Sandbox payments only. Dell is
            a trademark of Dell Inc.; RepairLoop is not affiliated with or
            endorsed by Dell.
          </p>
          <span>Repair the right thing, with the right part.</span>
        </footer>
      </div>
    </main>
  );
}
