# Data sources and limits

RepairLoop uses a deliberately small, source-linked catalog. It does **not** claim that AI can determine fitment. Compatibility, capacity, voltage, and part numbers are transcribed from public manufacturer and reputable parts sources, then human-verified.

**Rule:** every verified mapping needs at least two sources and a `verified_at` date. If a source is ambiguous or missing, the part is marked `unverified` and cannot be purchased.

## Device and battery facts

| Fact | Source | Used for | Status |
|---|---|---|---|
| Latitude 5400 supports 42Wh 3-cell 11.4V, 51Wh 3-cell 11.4V, and 68Wh 4-cell 7.6V batteries | [Dell Latitude 5400 Setup and Specifications](https://www.dell.com/support/manuals/en-us/latitude-14-5400-laptop/latitude_5400_setupspecs/battery) | Capacity/voltage model | Verified |
| Battery removal: disconnect cable, loosen captive screw, lift/slide | [Dell Latitude 5400 Service Manual](https://www.dell.com/support/manuals/en-us/latitude-14-5400-laptop/latitude_5400_servicemanual/removing-the-battery) | Repair guide link | Verified |
| Dell parts lookup requires exact system configuration; search by Service Tag or part number | [Dell Parts](https://www.dell.com/en-us/shop/dell-parts/partsforyourdell) | Problem framing | Verified |
| Dell 3-cell 42Wh replacement battery is compatible with Latitude 5400/5500/Precision 3540 | [Dell CPX-7T0D3](https://www.dell.com/en-us/shop/dell-3-cell-42-wh-lithium-ion-replacement-battery-for-select-laptops/apd/cpx-7t0d3/pc-accessories) | 42Wh compatibility | Verified |
| Dell OEM 4-cell 68Wh 7.6V battery for Latitude 5400/5500/Precision 3540; DP/N includes `RF7WM`, `C5GV2`, `X77XY`, `9JRYT`, `MCV1G`, `5H46R` | [Parts-People 4GVMP](https://www.parts-people.com/index.php?action=item&id=30351) | 68Wh family | Verified |
| Dell OEM 3-cell 51Wh battery for Latitude 5400/5401/5500/Precision 3540; part `R8D7N` | [Parts-People R8D7N](https://www.parts-people.com/index.php?action=item&id=30356) | 51Wh family | Verified |
| Latitude 5400 battery guide: 10–40 minutes, moderate; parts `1V1XF`, `R8D7N`, `4GVMP`, `3HWPP` | [iFixit guide](https://www.ifixit.com/Guide/Dell+Latitude+5400+Battery+Replacement/201472), [iFixit parts](https://www.ifixit.com/Parts/Dell_Latitude_5400/Batteries) | Repair steps; cross-check | Verified |
| Cross-reference: 42Wh `1V1XF`/`7T0D3`/`XV8CJ`; 51Wh `R8D7N`/`W8GMW`; 68Wh `4GVMP`; 15.2V `3HWPP` variant | [LaptopBatteryExpress](https://www.laptopbatteryexpress.com/Dell-Latitude-5400-battery-p/dell-e5501-5400.htm) | Part-number cross-check | Verified as a reference |
| Dell battery health: replace if full charge capacity is below 40% of design; use `powercfg /batteryreport` | [Dell battery health](https://www.dell.com/support/contents/en-us/article/product-support/self-support-knowledgebase/battery-and-power/battery), [Dell powercfg](https://www.dell.com/support/kbdoc/en-us/000130117/how-to-generate-battery-report-using-the-powercfg-command) | Health guidance | Verified |
| Some Latitude 5400 units report 68Wh `4GVMP` charging behavior after replacing a 42Wh battery; user report, not official guidance | [Dell community thread](https://www.dell.com/community/en/conversations/latitude/latitude-5400-ec-firmware-charging-issue-with-oem-68wh-battery/697f0cc10ea28a52ddeb8eb4) | Catalog note / caution | Unverified anecdote |

## Demo reference battery

From a redacted demo battery report:

| Field | Value |
|---|---:|
| Design capacity | 68,005 mWh |
| Full charge capacity | 46,907 mWh |
| Health | ~69% |
| Cycle count | Not reported |
| Battery name | `DELL X77XY9A` → part `X77XY` |
| Chemistry | Li-ion |

**Interpretation:** 68Wh 4-cell, 7.6V family. `X77XY` is an alternate Dell part number for the `4GVMP` 68Wh family. The exact replacement is the 68Wh 7.6V family, not the 42/51Wh lower-capacity options and not the 15.2V `3HWPP` variant.

**Health note:** 69% is above Dell’s 40% “significantly degraded” threshold. Replacement is reasonable if runtime is insufficient; it is not an emergency.

## What is intentionally not claimed

- No market-size or adoption claim.
- No claim that AI can diagnose a battery or certify a repair.
- No claim that the 15.2V `3HWPP` is universally incompatible; it is **unverified for this 7.6V configuration**.
- No claim that 42/51Wh batteries are the exact original for this 68Wh machine; they are lower-capacity options.
- No copied Dell/iFixit images or long text. Links are provided. Product photos must be original or licensed.
- No real customer data, serial numbers, or service tags in public materials.

## Verification workflow

1. Transcribe the fact from the source.
2. Record the URL, publisher, access date, and a short evidence quote.
3. Cross-check with a second source.
4. Mark `verified`, `unverified`, `stale`, or `rejected`.
5. Set `verified_at`.
6. Re-check before submission; flag stale rows.
7. Never let AI create or alter a compatibility row.

Dell is a trademark of Dell Inc. RepairLoop is not affiliated with or endorsed by Dell.
