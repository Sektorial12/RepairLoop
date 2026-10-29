import Link from "next/link";
import { LegalPage } from "../components/LegalPage";

export const metadata = { title: "AI disclosure — RepairLoop" };

export default function AiDisclosurePage() {
  return (
    <LegalPage
      eyebrow="AI disclosure"
      title="AI reads. The catalog decides."
      updated="Prototype AI disclosure · last updated 28 October 2026."
    >
      <p>
        RepairLoop uses a server-side Gemini model for extraction, source-cited
        explanation, and AI-assisted repair reports. The configured model name is intentionally not published in
        this repository. AI is a helper, not the authority.
      </p>

      <h2>What AI does</h2>
      <ul>
        <li>
          Reads a redacted battery report or label image and returns structured
          text fields for the user to review.
        </li>
        <li>
          Maps free-text symptoms to controlled tags, with a safety flag for
          damaged-battery descriptions.
        </li>
        <li>
          Extracts device/part/symptom facts from a shop customer request for a
          human-reviewed quote.
        </li>
        <li>
          Explains a catalog-selected part using only the cited catalog/source
          evidence, with a deterministic fallback.
        </li>
        <li>
          Writes an AI-assisted repair report from the confirmed fields, the
          optional redacted image, and the catalog evidence. The selected part
          and fitment remain catalog-authoritative.
        </li>
      </ul>

      <h2>What AI never does</h2>
      <ul>
        <li>Choose compatibility or invent a part recommendation.</li>
        <li>Set price, stock, seller, shipping, or payment status.</li>
        <li>Create catalog rows or authorize/capture a payment.</li>
        <li>Override a no-match or safety stop.</li>
      </ul>

      <h2>Privacy and limits</h2>
      <p>
        Images, free-text symptom/shop text, and the case details used for a
        source-cited explanation or AI repair report are sent to Gemini after
        the user checks an AI-consent box; the free tier may use submitted content
        to improve Google products. Images are re-encoded server-side to strip
        EXIF/GPS/device metadata before the Gemini request, but the browser
        preview can retain the local file. Crop and redact serials, service
        tags, and personal data. Do not upload payment credentials or customer
        data. AI extraction can be wrong; the user confirms the fields, and
        manual entry remains the fallback. The catalog and cited sources remain
        authoritative. The API’s “grounded” explanation check verifies the
        cited URL, not the semantics of every sentence.
      </p>

      <p>
        Read the implementation notes in <code>AI_USAGE.md</code> in the public
        repository, the <Link href="/privacy">privacy disclosure</Link>, and the{" "}
        <Link href="/terms">terms</Link>.
      </p>
    </LegalPage>
  );
}
