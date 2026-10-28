# RepairLoop

**Tagline:** AI reads the mess. The catalog decides. PayPal completes the repair.

**Track targets:** Best Use of PayPal + AI; Most Impactful

**Live demo:** https://repair-loop-nu.vercel.app
**Guided demo:** https://repair-loop-nu.vercel.app/check?demo=1
**No-match:** https://repair-loop-nu.vercel.app/check?demo=no-match
**Safety stop:** https://repair-loop-nu.vercel.app/check?demo=safety
**Shop mode:** https://repair-loop-nu.vercel.app/shop
**Catalog:** https://repair-loop-nu.vercel.app/catalog
**Code:** https://github.com/Sektorial12/RepairLoop

> Devpost video placeholder: add the final YouTube/Vimeo URL after recording.

## Inspiration

Laptop battery replacement looks simple until the part number is wrong. A Dell Latitude 5400 family can use 42Wh, 51Wh, or 68Wh packs with different voltages, dimensions, and multiple Dell part numbers. A 68Wh 15.2V pack can look plausible and still be incompatible with a 68Wh 7.6V configuration. The result is a wasted purchase, a returned part, and another repair abandoned.

RepairLoop starts with that narrow, verifiable decision: read the battery report or label, let AI extract messy input, and let a source-linked catalog decide whether an exact replacement exists. If it cannot verify fitment, it refuses and keeps checkout closed.

## What it does

1. **Consumer check:** upload a redacted battery report or label image. Gemini extracts the model, installed part number, capacities, and health into editable fields. The user corrects and confirms the fields before matching.
2. **Catalog verification:** a deterministic matcher maps confirmed facts to a source-linked replacement family. It offers the exact part, labels lower-capacity options, explicitly excludes the unverified 15.2V variant, and stops on unknown parts or damaged-battery symptoms.
3. **Grounded explanation:** “Explain with AI” can explain a catalog-verified fitment using only cited catalog evidence. The citation is validated.
4. **PayPal Sandbox checkout:** the buyer reviews the selected part and server-created total, approves a PayPal Sandbox payment, and sees success only after a verified `COMPLETED` capture. The receipt can be refreshed and shared.
5. **Shop mode:** a repair shop pastes a customer request. AI extracts device, installed-part, and symptom facts; the catalog drafts a quote; the shop owner reviews each field, confirms human approval, and can share a customer checkout link. AI never chooses fitment or captures payment.

A no-match is not an error page. It is the product: no verified source, no match, no checkout.

## How we built it

- **Web:** Next.js 16, React 19, TypeScript
- **API:** Fastify 5, TypeScript
- **Data:** Neon PostgreSQL, Drizzle ORM
- **AI:** Gemini via `@google/genai`, server-side only, structured JSON validated with Zod
- **Payments:** PayPal Orders v2 + JavaScript SDK v5 Buttons, Sandbox only
- **Tests:** Vitest, Playwright, GitHub Actions
- **Hosting:** Vercel web, Render API

The catalog is deliberately small and auditable: **17 models, 5 parts, 15 sources, and 38 compatibility rows** across shared Dell 42/51/68Wh families and the Lenovo ThinkPad T480s 57Wh family. Sources include Dell manuals and FRU lists, Lenovo FRU BOMs, iFixit, and retailer references. The live catalog shows source publisher, URL, and verification date.

The app enforces the boundary in code, not just copy: AI output cannot create or alter catalog rows, the matcher is deterministic, server-side amount/currency checks run before capture, and webhook signatures are validated. The public shop queue was removed; approved quotes are local to the browser and the customer link opens a single case by ID.

## Where AI is used — and where it is not

**AI is used for:**
- extracting structured fields from redacted battery reports and labels
- structuring free-text symptoms into controlled tags
- drafting a shop quote from a customer message
- explaining a catalog-verified match from cited evidence

**AI is not used for:**
- deciding compatibility, fitment, price, stock, or availability
- creating catalog rows or inventing part numbers, sellers, or prices
- authorizing or capturing a payment
- overriding a deterministic no-match or safety stop
- diagnosing a condition or certifying safety

Every gate is explicit: the consumer confirms extracted fields, the shop owner approves the quote, and the buyer approves the PayPal total.

## Challenges

- **The part-number trap:** sources disagree on some Lenovo T480 data, so we skipped T480 rather than publish an ambiguous row. T480s was added only after Lenovo FRU and iFixit sources agreed on the 57Wh family.
- **Making refusal usable:** a no-match needs to explain what to check next without recommending an unverified part. The UI keeps the exact exclusion and the safety stop visible.
- **AI guardrails that are testable:** prompt wrappers, Zod validation, magic-byte image checks, and a deterministic matcher keep model output away from the money path.
- **A real shop workflow without faking a store:** we added human-reviewed quotes and a customer link, but no inventory, fulfillment, warranty, or seller agreement.
- **Sandbox payment recovery:** the UI recovers an order from a PayPal return and shows success only after a verified capture; cancel and failure paths are explicit.

## Accomplishments

- Live Gemini report/label extraction, symptom structuring, grounded explanation, and shop intake against the deployed API.
- A working PayPal Sandbox checkout and a real completed capture receipt.
- Source-linked exact/no-match/safety flows across 17 models, including an adjacent Lenovo family.
- **26 API tests** and **15 Playwright scenarios** (45 desktop/mobile/WebKit runs in CI); CI is green.
- Live shop quote → human review → customer checkout link → existing PayPal flow.
- Public legal, privacy, AI-disclosure, security, and judge quick-start documentation.

## What we learned

The model is good at reading a messy image and bad at being an authority. The product works because AI is bounded by a small, cited catalog and the human confirmation gate. The strongest demo moment is not a generated answer; it is the moment the app refuses an unverified part and keeps checkout closed.

## What's next

- Run the full 20–30-image extraction and adversarial evaluation; keep manual entry as the fallback.
- Add signed, tenant-scoped receipt and case tokens instead of public ID lookup.
- Expand the catalog only where sources agree; keep the request-a-model path for the long tail.
- Run a real small-shop pilot and add seller/affiliate handoff only after inventory, returns, and warranty terms are explicit.
- Add more payment failure/retry coverage and production observability.

## Limitations (honest)

- PayPal is **Sandbox only**. This is not a real parts store.
- Prices are demo prices; there is no live stock, shipping, fulfillment, returns, or warranty.
- Receipt and case lookup are public by ID; signed tokens are post-hackathon.
- The catalog is intentionally narrow: 17 models and 5 parts.
- The AI evaluation is 25/25 on the synthetic harness plus a redacted real-media spot check; the full 20–30-image set is still pending.
- No shop pilot, testimonial, or LOI is claimed.

## Built with

`next.js` `react` `typescript` `fastify` `postgresql` `neon` `drizzle-orm` `gemini` `google-genai` `paypal-orders-v2` `paypal-js-sdk` `playwright` `vitest` `github-actions` `vercel` `render`

## Try it

- Hosted demo: https://repair-loop-nu.vercel.app
- Guided demo: https://repair-loop-nu.vercel.app/check?demo=1
- Shop mode: https://repair-loop-nu.vercel.app/shop
- Real completed Sandbox receipt: https://repair-loop-nu.vercel.app/receipt/7LS832802T701580V
- Source: https://github.com/Sektorial12/RepairLoop

The submission video is the judge completion path for the PayPal buyer step; the hosted app does not include buyer credentials. Do not use a real PayPal account.

## Team

RepairLoop team.
