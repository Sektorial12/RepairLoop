# RepairLoop demo video script

**Target:** 2:50 (hard cap 3:00)
**Format:** 1080p screen recording, 16:9, captions burned in or uploaded
**Goal:** AI-first proof of the consumer verification gate, the refusal/safety stops, the shop human-in-loop handoff, and a real PayPal Sandbox capture.

## Before recording

- Use the latest deployed app: https://repair-loop-nu.vercel.app
- Prepare an **actual redacted** battery report or label image. Crop to the “Installed batteries” section or label; blur serial numbers, service tags, names, addresses, and QR codes.
- Prepare a short shop request, e.g. “Dell Latitude 5410, label says R8D7N, battery dies after 20 minutes.”
- Sign in to a PayPal **Sandbox** buyer account in a separate window. Never show the email, password, card, or address.
- Test the upload, Explain with AI, shop quote link, PayPal approval/capture, and receipt once before recording.
- Clear local storage / use a fresh browser profile so Start over and the shop queue are clean.
- Do not stage a fake correction. If the model reads the real image correctly, show the editable fields and confirm. If it misreads a character, correct it on camera.
- Record at 1080p; hide bookmarks, notifications, terminals, `.env`, and personal data.
- Use only screen footage. No generated testimonials, no fake shop quotes, no stock inventory claims.

## Storyboard and narration

| Time | Visual | Action | Narration |
|---|---|---|---|
| 0:00–0:12 | Consumer check page | Hold on the hero and the demo case; cut to the upload box | “A laptop says it needs a battery. The hard part is not finding a battery — it is finding the right one.” |
| 0:12–0:28 | `/check` → Battery step | Upload the redacted report/label; show the preview | “RepairLoop starts with the actual report or label. Gemini reads only the redacted fields; the image is not the authority.” |
| 0:28–0:42 | Extracted fields | Show model, installed part, capacities, health; correct one low-confidence character or show the editable fields | “The model fills in the fields. I correct anything it misread, then I confirm the facts before any matching happens.” |
| 0:42–0:52 | Device + battery steps | Confirm the values; trigger the catalog match | “Only the confirmed fields reach the catalog. AI does not decide fitment.” |
| 0:52–1:10 | Verified result | Show exact 4GVMP family, lower-capacity 1V1XF/R8D7N options, and the 3HWPP exclusion | “The catalog returns the exact 68Wh 7.6V family. Lower-capacity options are labelled. The 68Wh 15.2V 3HWPP is excluded.” |
| 1:10–1:24 | No-match and safety | Open `/check?demo=no-match`, then `/check?demo=safety` | “An unknown part gets no match. A swollen, leaking, or overheating battery gets a safety stop. Checkout stays closed.” |
| 1:24–1:38 | Explain with AI | Click “Explain with AI”; show the cited source | “The AI explanation is limited to catalog evidence, and the citation is validated. It cannot invent a fitment.” |
| 1:38–1:55 | `/shop` | Paste the shop request; click Draft verified quote | “Shop mode starts from a customer message. AI extracts the facts and drafts a quote; the catalog still verifies the part.” |
| 1:55–2:08 | Shop quote | Point to model, installed part, symptoms, selected part, price, source; tick the review box | “The shop owner reviews every field and approves the quote. This is a human gate, not an AI purchase.” |
| 2:08–2:20 | Shop queue + customer link | Approve; show the customer checkout link and seller source | “The approved quote can go to the customer as a checkout link, or to the seller as an external part link. No inventory or fulfillment is claimed.” |
| 2:20–2:38 | `/check?case=…` buyer view | Open the case link; show the prefilled verified result and PayPal box | “The buyer sees the same verified part and the server-created total, then approves a PayPal Sandbox payment.” |
| 2:38–2:48 | PayPal | Approve with the Sandbox buyer; show capture completion; open the receipt and refresh | “Success is shown only after a verified capture. The receipt survives a refresh.” |
| 2:48–2:58 | Landing / AI boundaries | Cut to the “Where AI is used” section and final URL | “AI reads the mess. The catalog decides. PayPal completes the repair. Repair the right thing, with the right part.” |

## Narration notes

- Keep the upload and correction on screen long enough to read; do not rush the human confirmation gate.
- Say “redacted” and “Sandbox” explicitly.
- When showing the OpenAI/Gemini step, do not claim a model name that is not configured.
- When showing the shop link, say “customer checkout link”, not “order” or “inventory”.
- When showing the receipt, use the real completed Sandbox receipt or a new capture; do not fabricate a transaction.
- If the PayPal buyer login cannot be shown safely, cut from the approval button to the completed receipt and label it “Sandbox capture”; do not imply a live payment.

## Closing card

**RepairLoop**
AI reads the mess. The catalog decides. PayPal completes the repair.
https://repair-loop-nu.vercel.app
Sandbox prototype. No live stock, shipping, or fulfillment.

## Upload checklist

- [ ] Duration under 3:00
- [ ] Audio intelligible; captions present
- [ ] No credentials, emails, addresses, serials, or service tags visible
- [ ] Actual redacted upload, extraction, correction/confirmation, and human gate shown
- [ ] No-match and damaged-battery safety stop shown
- [ ] Explain with AI and cited source shown
- [ ] Shop quote, human approval, and customer/seller handoff shown
- [ ] Real PayPal Sandbox capture and receipt shown
- [ ] Final URL visible
- [ ] Devpost video URL added to `DEVPOST.md`
