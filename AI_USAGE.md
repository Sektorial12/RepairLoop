# AI usage and guardrails

## Model

- **Model:** configured via the server-side `GEMINI_MODEL` environment variable; no model name is committed to the repository.
- **SDK:** `@google/genai` (server-side only)
- **Fallback:** manual entry if the API is unavailable, rate-limited, or returns invalid JSON

## What AI does

1. **Battery-report extraction:** read a redacted screenshot and return structured fields:
   - battery name, part number, design capacity (mWh), full charge capacity (mWh), health %, cycle count, confidence, warnings
2. **Label extraction:** read a model/battery label photo and return:
   - brand, model, regulatory model, part number, capacity, voltage, confidence, warnings; serials are not requested or stored
3. **Symptom structuring:** map free text to controlled symptom tags and one optional clarifying question
4. **Source-cited explanation:** explain why a catalog-verified part fits, using only retrieved evidence, with a citation. The API field is named `grounded`, but it only verifies that the cited URL matches the catalog source.
5. **Shop intake:** extract explicit device/part/symptom facts from a customer message, then let the deterministic catalog draft a human-reviewed quote
6. **AI repair report:** write a customer-facing narrative from the confirmed fields, the redacted report/label image when available, and the catalog-verified result. The narrative may explain, prioritize, and summarize; it cannot change fitment, price, stock, or payment.

## What AI must never do

- Decide compatibility or fitment
- Create or alter catalog rows
- Invent part numbers, prices, inventory, sellers, or provider credentials
- Authorize or capture a payment
- Diagnose a condition or certify safety
- Override a deterministic no-match or safety stop

## Structured output

- Use `responseMimeType: application/json` with a JSON schema.
- Validate the response with Zod before use.
- Reject impossible values (e.g., full charge > design, negative health, unknown part family).
- Never trust the model's confidence as a substitute for the catalog check.
- The user must confirm extracted fields before matching.

## Prompt rules

- Transcribe only visible text; do not infer missing characters.
- Return `null` when uncertain.
- Highlight low-confidence characters rather than guessing.
- Never output a part recommendation without a catalog record.
- Never let the repair report change the catalog-verified selected part.
- For damaged-battery symptoms (swollen, leaking, overheating, burning smell), return a safety flag; do not suggest a DIY replacement.

## Evaluation

Evaluation target (not yet complete): 20–30 redacted battery-report/label images and 10 symptom descriptions. The committed harness currently uses 2 synthetic images, 10 symptom strings, and 1 explanation case. Metrics:

- Top-1 exact extraction
- Top-3 candidate extraction
- Hallucination rate
- No-match correctness
- Safety-flag recall

Targets: top-1 exact ≥80%, top-3 ≥95%, zero unsupported fitment claims, no-match correctness ≥95%. Results must be reproducible and honest. If targets are not met, manual entry becomes the primary path.

### Evaluation snapshot (26 Oct 2026)

- **Symptom set:** 10 descriptions. All 10 mapped to the expected tag; both damaged-battery descriptions triggered the safety flag; the non-battery description returned no tags and one clarifying question.
- **Battery report:** synthetic image containing the real values (`68,005 / 46,907 mWh`, `X77XY`) returned the battery name, part, capacities, 69% health, and confidence 0.95.
- **Label:** synthetic label returned `DELL`, `Latitude 5400`, `P98G`, `X77XY`, 68Wh, 7.6V, and confidence 0.95.
- **Synthetic harness (2026-10-27):** 25/25 checks passed against the deployed API: 5 report checks, 7 label checks, 10 symptom cases, and 3 source-cited explanation checks. One transient Render 502 was retried successfully. This is not a substitute for the 20–30-image target.
- **Limitations:** the full 20–30 image set and adversarial/prompt-injection evaluation remain pending. The synthetic harness is reproducible; no real redacted media is committed to the repository. Use the optional `EVAL_REPORT_IMAGE` / `EVAL_LABEL_IMAGE` paths for a local spot check. Manual entry remains the fallback. “Grounded” in the API means the cited source URL matches the catalog source; it is not semantic verification of every sentence.

Run the reproducible harness (uses the deployed API and synthetic fixtures):

```bash
EVAL_BASE_URL=https://repairloop-api.onrender.com npm run eval:ai -w @repairloop/api

# Optional real redacted media:
# EVAL_REPORT_IMAGE=/local/report.jpg EVAL_LABEL_IMAGE=/local/label.jpg \
#   EVAL_BASE_URL=https://repairloop-api.onrender.com npm run eval:ai -w @repairloop/api
```

## Privacy and free-tier terms

- Gemini’s free tier may use submitted content to improve Google products. Treat all uploaded images as potentially public.
- Crop to the “Installed batteries” section, redact serial numbers/service tags, and avoid personal data.
- Do not store the full uploaded image or report; store only the extracted fields needed for the repair case.
- Do not send payment credentials, card data, or customer data to the model.
- Symptom and shop text are wrapped as JSON untrusted data and the wrapper is unit-tested; adversarial image/prompt-injection model behavior remains pending. Image uploads are re-encoded server-side to strip metadata. The consumer/shop UI requires AI consent before sending text, images, explanation case details, or a repair-report request.
- The API key stays server-side; never expose it in the browser or repository.
