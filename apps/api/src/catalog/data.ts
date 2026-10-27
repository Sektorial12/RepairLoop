import type { CatalogData } from "./types.js";

const ACCESSED_AT = new Date("2026-10-26T12:00:00.000Z");
const VERIFIED_AT = new Date("2026-10-26T12:00:00.000Z");

const sources: CatalogData["sources"] = [
  {
    id: "src-dell-spec",
    publisher: "Dell",
    url: "https://www.dell.com/support/manuals/en-us/latitude-14-5400-laptop/latitude_5400_setupspecs/battery",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public manufacturer documentation; facts used with attribution.",
    notes: "42Wh/51Wh 3-cell 11.4V; 68Wh 4-cell 7.6V; 300-cycle life for standard packs."
  },
  {
    id: "src-dell-manual",
    publisher: "Dell",
    url: "https://www.dell.com/support/manuals/en-us/latitude-14-5400-laptop/latitude_5400_servicemanual/removing-the-battery",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public manufacturer documentation; link only, no copied images.",
    notes: "Battery removal: disconnect cable, loosen captive screw, lift/slide."
  },
  {
    id: "src-dell-parts",
    publisher: "Dell",
    url: "https://www.dell.com/en-us/shop/dell-parts/partsforyourdell",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public parts lookup; facts used with attribution.",
    notes: "Dell asks users to identify exact system configuration by Service Tag or part number."
  },
  {
    id: "src-dell-42wh",
    publisher: "Dell",
    url: "https://www.dell.com/en-us/shop/dell-3-cell-42-wh-lithium-ion-replacement-battery-for-select-laptops/apd/cpx-7t0d3/pc-accessories",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public product page; facts used with attribution.",
    notes: "Dell 3-cell 42Wh replacement battery, CPX-7T0D3, compatible with Latitude 5400/5500/Precision 3540."
  },
  {
    id: "src-parts-people",
    publisher: "Parts-People",
    url: "https://www.parts-people.com/index.php?action=category&id=140&refine=battery&subid=1311",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public product listing; facts used; no images copied.",
    notes: "Latitude 5400 battery list; notes that the same battery type can have multiple part numbers."
  },
  {
    id: "src-parts-people-4gvmp",
    publisher: "Parts-People",
    url: "https://www.parts-people.com/index.php?action=item&id=30351",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public product listing; facts used; no images copied.",
    notes: "Genuine Dell OEM 4-cell 68Wh 7.6V battery for Latitude 5400/5500/Precision 3540; DP/N RF7WM, C5GV2, X77XY, 9JRYT, MCV1G, 5H46R."
  },
  {
    id: "src-parts-people-r8d7n",
    publisher: "Parts-People",
    url: "https://www.parts-people.com/index.php?action=item&id=30356",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public product listing; facts used; no images copied.",
    notes: "Dell OEM 3-cell 51Wh battery for Latitude 5400/5401/5500/Precision 3540; part R8D7N."
  },
  {
    id: "src-ifixit-guide",
    publisher: "iFixit",
    url: "https://www.ifixit.com/Guide/Dell+Latitude+5400+Battery+Replacement/201472",
    accessedAt: ACCESSED_AT,
    licenseTerms: "CC BY-NC-SA 4.0; link only, no copied text or images.",
    notes: "Battery replacement guide, 10–40 minutes, moderate difficulty."
  },
  {
    id: "src-ifixit-parts",
    publisher: "iFixit",
    url: "https://www.ifixit.com/Parts/Dell_Latitude_5400/Batteries",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public parts listing; facts used; no images copied.",
    notes: "Lists 1V1XF, R8D7N, 4GVMP, and 3HWPP for Latitude 5400; 3HWPP is 68Wh 15.2V."
  },
  {
    id: "src-laptopbatteryexpress",
    publisher: "LaptopBatteryExpress",
    url: "https://www.laptopbatteryexpress.com/Dell-Latitude-5400-battery-p/dell-e5501-5400.htm",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public product listing; facts used; no images copied.",
    notes: "Cross-reference: 42Wh 1V1XF; 51Wh R8D7N; 68Wh 4GVMP; 15.2V 3HWPP variant."
  },
  {
    id: "src-dell-battery-health",
    publisher: "Dell",
    url: "https://www.dell.com/support/contents/en-us/article/product-support/self-support-knowledgebase/battery-and-power/battery",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public support article; facts used with attribution.",
    notes: "Use powercfg /batteryreport; Dell says replace if full charge capacity is below 40% of design capacity."
  },
  {
    id: "src-dell-community-68wh",
    publisher: "Dell Community",
    url: "https://www.dell.com/community/en/conversations/latitude/latitude-5400-ec-firmware-charging-issue-with-oem-68wh-battery/697f0cc10ea28a52ddeb8eb4",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public user forum; anecdote only.",
    notes: "User report of 68Wh 4GVMP charging behavior after replacing a 42Wh battery; not official guidance."
  }
];

const models: CatalogData["models"] = [
  {
    id: "dell-latitude-5400",
    brand: "Dell",
    family: "Latitude",
    model: "Latitude 5400",
    aliases: ["Latitude 5400", "Dell Latitude 5400", "P98G", "P98G001", "P92G"],
    regulatoryModel: "P98G / P98G001 / P92G"
  },
  {
    id: "dell-latitude-5401",
    brand: "Dell",
    family: "Latitude",
    model: "Latitude 5401",
    aliases: ["Latitude 5401", "Dell Latitude 5401"],
    regulatoryModel: null
  },
  {
    id: "dell-latitude-5500",
    brand: "Dell",
    family: "Latitude",
    model: "Latitude 5500",
    aliases: ["Latitude 5500", "Dell Latitude 5500"],
    regulatoryModel: null
  },
  {
    id: "dell-precision-3540",
    brand: "Dell",
    family: "Precision",
    model: "Precision 3540",
    aliases: ["Precision 3540", "Dell Precision 3540"],
    regulatoryModel: null
  }
];

const parts: CatalogData["parts"] = [
  {
    id: "part-4gvmp-68wh",
    name: "Dell 68Wh 4-cell replacement battery (7.6V)",
    category: "battery",
    capacityWh: 68,
    voltage: "7.6",
    cells: 4,
    partNumber: "4GVMP",
    altPartNumbers: [
      "X77XY",
      "RF7WM",
      "C5GV2",
      "9JRYT",
      "MCV1G",
      "5H46R"
    ],
    seller: "Parts-People",
    priceDemo: "109.95",
    currency: "USD",
    status: "verified",
    sourceId: "src-parts-people-4gvmp",
    verifiedAt: VERIFIED_AT,
    notes:
      "Exact 68Wh 7.6V 4-cell family. The installed reference X77XY is an alternate Dell part number in this family. Community reports of 68Wh charging behavior exist; check BIOS/EC state and the exact original configuration."
  },
  {
    id: "part-1v1xf-42wh",
    name: "Dell 42Wh 3-cell replacement battery (11.4V)",
    category: "battery",
    capacityWh: 42,
    voltage: "11.4",
    cells: 3,
    partNumber: "1V1XF",
    altPartNumbers: ["7T0D3", "XV8CJ", "7VTMN", "27W58"],
    seller: "Parts-People",
    priceDemo: "59.95",
    currency: "USD",
    status: "verified",
    sourceId: "src-dell-42wh",
    verifiedAt: VERIFIED_AT,
    notes:
      "Lower-capacity 42Wh 3-cell 11.4V option. It is not the exact original for a 68Wh configuration; show it only as a lower-capacity alternative."
  },
  {
    id: "part-r8d7n-51wh",
    name: "Dell 51Wh 3-cell replacement battery (11.4V)",
    category: "battery",
    capacityWh: 51,
    voltage: "11.4",
    cells: 3,
    partNumber: "R8D7N",
    altPartNumbers: ["W8GMW", "49HG8", "TNT6H", "CP5GR"],
    seller: "Parts-People",
    priceDemo: "99.99",
    currency: "USD",
    status: "verified",
    sourceId: "src-parts-people-r8d7n",
    verifiedAt: VERIFIED_AT,
    notes:
      "Lower-capacity 51Wh 3-cell 11.4V option. It is not the exact original for a 68Wh configuration; show it only as a lower-capacity alternative."
  },
  {
    id: "part-3hwpp-68wh-15v",
    name: "Dell 68Wh 4-cell battery (15.2V variant)",
    category: "battery",
    capacityWh: 68,
    voltage: "15.2",
    cells: 4,
    partNumber: "3HWPP",
    altPartNumbers: ["10X1J", "N2NLL"],
    seller: "iFixit",
    priceDemo: "79.99",
    currency: "USD",
    status: "unverified",
    sourceId: "src-ifixit-parts",
    verifiedAt: null,
    notes:
      "68Wh but 15.2V. It does not match the Dell 7.6V 68Wh specification for this configuration. Keep it out of checkout and use it as the explicit wrong-variant example."
  }
];

const compatibility: CatalogData["compatibility"] = [
  {
    id: "compat-5400-4gvmp",
    modelId: "dell-latitude-5400",
    partId: "part-4gvmp-68wh",
    fitmentNote:
      "Exact 68Wh 7.6V 4-cell family; matches the installed X77XY reference.",
    sourceId: "src-parts-people-4gvmp",
    evidenceQuote:
      "Genuine DELL OEM 4-Cell 68Wh battery for Latitude 5400, 5500, Precision 3540; DP/N: RF7WM; C5GV2; X77XY; 9JRYT; MCV1G; 5H46R.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-5401-4gvmp",
    modelId: "dell-latitude-5401",
    partId: "part-4gvmp-68wh",
    fitmentNote:
      "Exact 68Wh 7.6V 4-cell family for the shared Latitude 5401 battery family.",
    sourceId: "src-laptopbatteryexpress",
    evidenceQuote:
      "Dell 68Whr 4GVMP battery fits Latitude 5400, 5401, 5500, Precision 3540, Inspiron 7590/7591/7791 2-in-1.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-5500-4gvmp",
    modelId: "dell-latitude-5500",
    partId: "part-4gvmp-68wh",
    fitmentNote:
      "Exact 68Wh 7.6V 4-cell family for the shared Latitude 5500 battery family.",
    sourceId: "src-parts-people-4gvmp",
    evidenceQuote:
      "Genuine DELL OEM 4-Cell 68Wh battery for Latitude 5400, 5500, Precision 3540.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-p3540-4gvmp",
    modelId: "dell-precision-3540",
    partId: "part-4gvmp-68wh",
    fitmentNote:
      "Exact 68Wh 7.6V 4-cell family for the shared Precision 3540 battery family.",
    sourceId: "src-parts-people-4gvmp",
    evidenceQuote:
      "Genuine DELL OEM 4-Cell 68Wh battery for Latitude 5400, 5500, Precision 3540.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-5400-1v1xf",
    modelId: "dell-latitude-5400",
    partId: "part-1v1xf-42wh",
    fitmentNote:
      "Lower-capacity 42Wh 3-cell 11.4V option; not the exact original for a 68Wh configuration.",
    sourceId: "src-dell-42wh",
    evidenceQuote:
      "Dell 3-cell 42 Wh Lithium Ion Replacement Battery compatible with Latitude 5400, Latitude 5500, Precision 3540.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-5401-1v1xf",
    modelId: "dell-latitude-5401",
    partId: "part-1v1xf-42wh",
    fitmentNote:
      "Lower-capacity 42Wh 3-cell 11.4V option; not the exact original for a 68Wh configuration.",
    sourceId: "src-laptopbatteryexpress",
    evidenceQuote:
      "This 1V1XF battery fits Latitude 5400, 5401, 5500, 5501, 5510, 5511 and Precision 3540/3541/3550.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-5500-1v1xf",
    modelId: "dell-latitude-5500",
    partId: "part-1v1xf-42wh",
    fitmentNote:
      "Lower-capacity 42Wh 3-cell 11.4V option; not the exact original for a 68Wh configuration.",
    sourceId: "src-dell-42wh",
    evidenceQuote:
      "Dell 3-cell 42 Wh Lithium Ion Replacement Battery compatible with Latitude 5400, Latitude 5500, Precision 3540.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-p3540-1v1xf",
    modelId: "dell-precision-3540",
    partId: "part-1v1xf-42wh",
    fitmentNote:
      "Lower-capacity 42Wh 3-cell 11.4V option; not the exact original for a 68Wh configuration.",
    sourceId: "src-dell-42wh",
    evidenceQuote:
      "Dell 3-cell 42 Wh Lithium Ion Replacement Battery compatible with Latitude 5400, Latitude 5500, Precision 3540.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-5400-r8d7n",
    modelId: "dell-latitude-5400",
    partId: "part-r8d7n-51wh",
    fitmentNote:
      "Lower-capacity 51Wh 3-cell 11.4V option; not the exact original for a 68Wh configuration.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote:
      "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, Precision 3540; R8D7N.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-5401-r8d7n",
    modelId: "dell-latitude-5401",
    partId: "part-r8d7n-51wh",
    fitmentNote:
      "Lower-capacity 51Wh 3-cell 11.4V option; not the exact original for a 68Wh configuration.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote:
      "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, Precision 3540; R8D7N.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-5500-r8d7n",
    modelId: "dell-latitude-5500",
    partId: "part-r8d7n-51wh",
    fitmentNote:
      "Lower-capacity 51Wh 3-cell 11.4V option; not the exact original for a 68Wh configuration.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote:
      "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, Precision 3540; R8D7N.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-p3540-r8d7n",
    modelId: "dell-precision-3540",
    partId: "part-r8d7n-51wh",
    fitmentNote:
      "Lower-capacity 51Wh 3-cell 11.4V option; not the exact original for a 68Wh configuration.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote:
      "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, Precision 3540; R8D7N.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-5400-3hwpp-unverified",
    modelId: "dell-latitude-5400",
    partId: "part-3hwpp-68wh-15v",
    fitmentNote:
      "Unverified for this 7.6V configuration: 68Wh but 15.2V. Do not offer at checkout.",
    sourceId: "src-ifixit-parts",
    evidenceQuote:
      "Dell 3HWPP is a 68Wh 15.2V battery. Dell's Latitude 5400 68Wh specification is 7.6V.",
    status: "unverified",
    verifiedAt: null
  }
];

const symptoms: CatalogData["symptoms"] = [
  {
    id: "sym-runtime",
    tag: "battery_runtime_short",
    label: "Runs briefly / short runtime",
    description: "The laptop runs for minutes or less, or shuts down early.",
    safetyFlag: false
  },
  {
    id: "sym-charge",
    tag: "battery_wont_charge",
    label: "Won't charge",
    description: "The battery does not charge, or the laptop only works plugged in.",
    safetyFlag: false
  },
  {
    id: "sym-light",
    tag: "battery_red_light",
    label: "Red / flashing light",
    description: "The laptop shows a red or flashing battery light.",
    safetyFlag: false
  },
  {
    id: "sym-damaged",
    tag: "battery_damaged",
    label: "Swollen, leaking, overheating, or burning smell",
    description:
      "A damaged lithium-ion battery can be hazardous. Stop and seek professional service.",
    safetyFlag: true
  }
];

const symptomRules: CatalogData["symptomRules"] = [
  {
    id: "rule-runtime-battery",
    symptomTag: "battery_runtime_short",
    partCategory: "battery",
    rationale:
      "Dell battery-health guidance: reduced runtime can indicate capacity loss; replacement is reasonable if runtime no longer meets the user's needs.",
    sourceId: "src-dell-battery-health"
  },
  {
    id: "rule-charge-battery",
    symptomTag: "battery_wont_charge",
    partCategory: "battery",
    rationale:
      "Dell troubleshooting/spec guidance: battery capacity and charging behavior are battery-related; verify the exact part before purchase.",
    sourceId: "src-dell-spec"
  },
  {
    id: "rule-light-battery",
    symptomTag: "battery_red_light",
    partCategory: "battery",
    rationale:
      "Dell battery-health guidance: flashing battery lights can indicate a battery issue; confirm with Dell diagnostics.",
    sourceId: "src-dell-battery-health"
  },
  {
    id: "rule-damaged-safety",
    symptomTag: "battery_damaged",
    partCategory: "battery",
    rationale:
      "Damaged lithium-ion batteries are a safety hazard; do not sell a DIY replacement. Recommend professional service.",
    sourceId: "src-dell-manual"
  }
];

export const catalogData: CatalogData = {
  sources,
  models,
  parts,
  compatibility,
  symptoms,
  symptomRules
};
