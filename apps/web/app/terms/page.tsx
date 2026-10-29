import Link from "next/link";
import { LegalPage } from "../components/LegalPage";

export const metadata = { title: "Terms — RepairLoop" };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="A Sandbox prototype, not a store."
      updated="Prototype terms · last updated 28 October 2026 · not legal advice."
    >
      <p>
        RepairLoop demonstrates a source-linked battery fitment check and a
        PayPal Sandbox payment. It is not a commercial offer, a merchant of
        record, or a parts seller.
      </p>

      <h2>No real sale or fulfillment</h2>
      <ul>
        <li>No real money is charged; PayPal is in Sandbox mode.</li>
        <li>
          No part is sold, reserved, shipped, installed, returned, or warranted.
        </li>
        <li>
          Prices, sellers, stock, and availability are demo or point-in-time
          seller reports, not live inventory. The catalog verifies fitment, not
          that a part is currently purchasable. The app has no seller
          integration, authentication, fulfillment, returns, or warranty flow.
        </li>
        <li>
          Do not use real payment credentials, a real PayPal account, or personal
          data.
        </li>
      </ul>

      <h2>Fitment and safety</h2>
      <p>
        Compatibility is a source-linked catalog decision, not an AI guess. The
        user must review and confirm the model, part number, and extracted
        fields. RepairLoop is not a repair professional and does not diagnose
        hardware. A swollen, leaking, overheating, or burning battery is a safety
        stop: do not attempt a DIY replacement.
      </p>

      <h2>No warranty; limitation</h2>
      <p>
        The prototype is provided as-is for demonstration, without warranties of
        accuracy, availability, fitness, or non-infringement. To the maximum
        extent permitted by applicable law, the maintainer is not liable for
        decisions, purchases, repairs, or damages arising from use of the
        prototype. Verify the exact part with the manufacturer or a repair
        professional before buying anything.
      </p>

      <h2>Intellectual property and changes</h2>
      <p>
        Dell and Lenovo are trademarks of their respective owners. RepairLoop is
        not affiliated with or endorsed by either company. Source links remain the property of their publishers.
        The prototype and these terms may change without notice. Contact the
        maintainer through the public GitHub repository for questions.
      </p>

      <p>
        See the <Link href="/privacy">privacy disclosure</Link> and{" "}
        <Link href="/ai-disclosure">AI disclosure</Link>. Return to the{" "}
        <Link href="/check">battery check</Link>.
      </p>
    </LegalPage>
  );
}
