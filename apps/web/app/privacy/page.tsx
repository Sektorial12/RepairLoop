import Link from "next/link";
import { LegalPage } from "../components/LegalPage";

export const metadata = { title: "Privacy — RepairLoop" };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="What RepairLoop handles."
      updated="Prototype disclosure · last updated 28 October 2026 · not legal advice."
    >
      <p>
        RepairLoop is a Sandbox prototype, not a commercial store. This page
        describes the data the prototype handles; it is not a promise of
        production-grade privacy practices.
      </p>

      <h2>What is collected</h2>
      <ul>
        <li>
          Battery-report and label images you choose to upload, sent to Gemini
          for extraction.
        </li>
        <li>
          Extracted or manually entered values needed for the repair case:
          model, capacities, health, part numbers, symptoms, and selected part.
        </li>
        <li>
          PayPal Sandbox order/capture identifiers and payment-event metadata
          for the receipt.
        </li>
        <li>Hosting and request logs from Render, Vercel, and Cloudflare.</li>
      </ul>

      <h2>What is not collected</h2>
      <ul>
        <li>No card data, bank credentials, or PayPal password.</li>
        <li>No account, address book, or login.</li>
        <li>
          The application does not store the full uploaded image or report; it
          keeps only extracted fields and repair/payment metadata.
        </li>
      </ul>

      <h2>Third parties</h2>
      <p>
        Images are processed by Gemini; the free tier may use submitted content
        to improve Google products. Payments run in PayPal Sandbox. The app is
        hosted on Render and Vercel, with a Neon PostgreSQL database. Do not
        upload serial numbers, service tags, names, addresses, or other personal
        data. Crop and redact before uploading.
      </p>

      <h2>Retention and contact</h2>
      <p>
        Extracted fields, repair cases, orders, and payment-event metadata may
        persist for the prototype. The receipt page is public to anyone with its
        order link; do not share a link containing sensitive information. There
        is no self-service deletion flow; contact the maintainer through the
        public GitHub repository issue tracker for a prototype data request.
      </p>

      <p>
        See the <Link href="/terms">terms</Link> and{" "}
        <Link href="/ai-disclosure">AI disclosure</Link>. Return to the{" "}
        <Link href="/check">battery check</Link>.
      </p>
    </LegalPage>
  );
}
