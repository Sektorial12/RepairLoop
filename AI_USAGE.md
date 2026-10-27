# AI usage and guardrails

## Model

- **Model:** configured via the server-side `GEMINI_MODEL` environment variable; no model name is committed to the repository.
- **SDK:** `@google/genai` (server-side only)
- **Fallback:** manual entry if the API is unavailable, rate-limited, or returns invalid JSON

## What AI does

1. **Battery-report extraction:** read a redacted screenshot and return structured fields:
   - model, part number, design capacity (mWh), full charge capacity (mWh), health %, cycle count, confidence, warnings
2. **Label extraction:** read a model/battery label photo and return:
   - brand, model, regulatory model, serial prefix, part number, capacity, voltage, confidence, warnings
3. **Symptom structuring:** map free text to controlled symptom tags and one optional clarifying question
4. **Grounded explanation:** explain why a catalog-verified part fits, using only retrieved evidence, with a citation

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
- For damaged-battery symptoms (swollen, leaking, overheating, burning smell), return a safety flag; do not suggest a DIY replacement.

## Evaluation

The evaluation set includes 20–30 redacted battery-report/label images and 10 symptom descriptions. Metrics:

- Top-1 exact extraction
- Top-3 candidate extraction
- Hallucination rate
- No-match correctness
- Safety-flag recall

Targets: top-1 exact ≥80%, top-3 ≥95%, zero unsupported fitment claims, no-match correctness ≥95%. Results must be reproducible and honest. If targets are not met, manual entry becomes the primary path.

### Evaluation snapshot (26 Oct 2026)

- **Symptom set:** 10 descriptions. All 10 mapped to the expected tag; both damaged-battery descriptions triggered the safety flag; the non-battery description returned no tags and one clarifying question.
- **Battery report:** synthetic image containing the real values (`68,005 / 46,907 mWh`, `X77XY`) returned the exact model, part, capacities, 69% health, and confidence 0.95.
- **Label:** synthetic label returned `DELL`, `Latitude 5400`, `P98G`, `X77XY`, 68Wh, 7.6V, and confidence 0.95.
- **Automated harness (2026-10-27):** 25/25 checks passed against the deployed API: 5 report checks, 7 label checks, 10 symptom cases, and 3 grounded-explanation checks. One transient Render 502 was retried successfully.
- **Limitation:** the full 20–30 image set remains pending. The synthetic harness and a redacted real-media pass are documented; manual entry remains the fallback. No unsupported fitment was observed.

Run the reproducible harness (uses the deployed API and synthetic fixtures):

```bash
EVAL_BASE_URL=https://repairloop-api.onrender.com npm run eval:ai -w @repairloop/api
```

## Privacy and free-tier terms

- Gemini’s free tier may use submitted content to improve Google products. Treat all uploaded images as potentially public.
- Crop to the “Installed batteries” section, redact serial numbers/service tags, and avoid personal data.
- Do not store the full uploaded image or report; store only the extracted fields needed for the repair case.
- Do not send payment credentials, card data, or customer data to the model.
- The API key stays server-side; never expose it in the browser or repository.
