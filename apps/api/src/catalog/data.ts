import type { CatalogData, PartAvailabilityStatus } from "./types.js";

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
    url: "https://www.dell.com/support/manuals/en-us/latitude-14-5400-laptop/latitude_5400_setupspecs/battery",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public manufacturer documentation; facts used with attribution.",
    notes: "Dell Latitude 5400 spec: 42Wh 3-cell 11.4V battery. The former Dell shop URL redirected to a generic accessories page, so it is not used as the source link."
  },
  {
    id: "src-parts-people-1v1xf",
    publisher: "Parts-People",
    url: "https://www.parts-people.com/index.php?action=item&id=30353",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public product listing; facts used; no images copied.",
    notes: "Genuine Dell OEM 3-cell 42Wh 11.4V battery for Latitude 5400/5401/5500/5501/5510/5511/5410/5411, Precision 3540/3541/3550/3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise; DP/N XV8CJ, 27W58, 7VTMN."
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
    notes: "Genuine Dell OEM 4-cell 68Wh 7.6V battery for Latitude 5400/5500/Precision 3540, Inspiron 7590/7591/7791 2-in-1, and Latitude 5400 Chromebook; DP/N RF7WM, C5GV2, X77XY, 9JRYT, MCV1G, 5H46R."
  },
  {
    id: "src-parts-people-r8d7n",
    publisher: "Parts-People",
    url: "https://www.parts-people.com/index.php?action=item&id=30356",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public product listing; facts used; no images copied.",
    notes: "Dell OEM 3-cell battery for Latitude 5400/5401/5500/5501/5510/5511/5410/5411, Precision 3540/3541/3550/3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise; part R8D7N. Source conflict: Parts-People/Dell list 51Wh; iFixit lists 48.5Wh. Verify the label before treating capacity as exact."
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
  },
  {
    id: "src-lenovo-t480s-frubom",
    publisher: "Lenovo",
    url: "https://download.lenovo.com/parts/ThinkPad/t480s_frubom_mt_20l7_20l8_20180226.pdf",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public Lenovo parts BOM; facts used; link only.",
    notes: "ThinkPad T480s (20L7/20L8) FRU BOM: 01AV478/01AV479/01AV480 are internal 3-cell 57Wh Li-ion batteries."
  },
  {
    id: "src-ifixit-t480s-battery",
    publisher: "iFixit",
    url: "https://www.ifixit.com/products/lenovo-thinkpad-t480s-battery",
    accessedAt: ACCESSED_AT,
    licenseTerms: "Public product listing; facts used; no images copied.",
    notes: "Lenovo ThinkPad T480s battery 01AV478: 57Wh, 11.58V, 3-cell, 4708mAh; compatible with ThinkPad T480s."
  }
];

const models: CatalogData["models"] = [
  {
    id: "dell-latitude-5400",
    brand: "Dell",
    family: "Latitude",
    model: "Latitude 5400",
    aliases: ["Latitude 5400", "Dell Latitude 5400", "P98G", "P98G001"],
    regulatoryModel: "P98G / P98G001"
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
  },
  {
    id: "dell-latitude-5410",
    brand: "Dell",
    family: "Latitude",
    model: "Latitude 5410",
    aliases: ["Latitude 5410", "Dell Latitude 5410", "5410"],
    regulatoryModel: null
  },
  {
    id: "dell-latitude-5411",
    brand: "Dell",
    family: "Latitude",
    model: "Latitude 5411",
    aliases: ["Latitude 5411", "Dell Latitude 5411", "5411"],
    regulatoryModel: null
  },
  {
    id: "dell-latitude-5501",
    brand: "Dell",
    family: "Latitude",
    model: "Latitude 5501",
    aliases: ["Latitude 5501", "Dell Latitude 5501", "5501"],
    regulatoryModel: null
  },
  {
    id: "dell-latitude-5510",
    brand: "Dell",
    family: "Latitude",
    model: "Latitude 5510",
    aliases: ["Latitude 5510", "Dell Latitude 5510", "5510"],
    regulatoryModel: null
  },
  {
    id: "dell-latitude-5511",
    brand: "Dell",
    family: "Latitude",
    model: "Latitude 5511",
    aliases: ["Latitude 5511", "Dell Latitude 5511", "5511"],
    regulatoryModel: null
  },
  {
    id: "dell-precision-3541",
    brand: "Dell",
    family: "Precision",
    model: "Precision 3541",
    aliases: ["Precision 3541", "Dell Precision 3541", "3541"],
    regulatoryModel: null
  },
  {
    id: "dell-precision-3550",
    brand: "Dell",
    family: "Precision",
    model: "Precision 3550",
    aliases: ["Precision 3550", "Dell Precision 3550", "3550"],
    regulatoryModel: null
  },
  {
    id: "dell-precision-3551",
    brand: "Dell",
    family: "Precision",
    model: "Precision 3551",
    aliases: ["Precision 3551", "Dell Precision 3551", "3551"],
    regulatoryModel: null
  },
  {
    id: "dell-inspiron-7590-2in1",
    brand: "Dell",
    family: "Inspiron",
    model: "Inspiron 7590 2-in-1",
    aliases: ["Inspiron 7590 2-in-1", "Inspiron 15 7590 2-in-1"],
    regulatoryModel: null
  },
  {
    id: "dell-inspiron-7591-2in1",
    brand: "Dell",
    family: "Inspiron",
    model: "Inspiron 7591 2-in-1",
    aliases: ["Inspiron 7591 2-in-1", "Inspiron 15 7591 2-in-1"],
    regulatoryModel: null
  },
  {
    id: "dell-inspiron-7791-2in1",
    brand: "Dell",
    family: "Inspiron",
    model: "Inspiron 7791 2-in-1",
    aliases: ["Inspiron 7791 2-in-1", "Inspiron 17 7791 2-in-1"],
    regulatoryModel: null
  },
  {
    id: "dell-latitude-5400-chromebook",
    brand: "Dell",
    family: "Latitude",
    model: "Latitude 5400 Chromebook",
    aliases: ["Latitude 5400 Chromebook", "Latitude 5400 Chromebook Enterprise", "Dell Latitude 5400 Chromebook", "5400 Chromebook"],
    regulatoryModel: null
  },
  {
    id: "lenovo-thinkpad-t480s",
    brand: "Lenovo",
    family: "ThinkPad",
    model: "ThinkPad T480s",
    aliases: ["ThinkPad T480s", "Lenovo ThinkPad T480s", "T480s", "20L7", "20L8"],
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
      "Lower-capacity 3-cell 11.4V option; Parts-People/Dell list 51Wh while iFixit lists 48.5Wh. It is not the exact original for a 68Wh configuration; disclose the capacity conflict and verify the label."
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
  },
  {
    id: "part-01av478-57wh",
    name: "Lenovo ThinkPad T480s 57Wh 3-cell battery (11.58V)",
    category: "battery",
    capacityWh: 57,
    voltage: "11.58",
    cells: 3,
    partNumber: "01AV478",
    altPartNumbers: ["01AV479", "01AV480", "SB10K97620", "SB10K97621", "SB10K97622", "L17M3P71", "L17L3P71", "L17M3P72"],
    seller: "iFixit",
    priceDemo: "58.99",
    currency: "USD",
    status: "verified",
    sourceId: "src-ifixit-t480s-battery",
    verifiedAt: VERIFIED_AT,
    notes: "Exact 57Wh 3-cell 11.58V internal battery for ThinkPad T480s (20L7/20L8); Lenovo FRU 01AV478/479/480."
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
  },
  {
    id: "compat-latitude-5410-1v1xf",
    modelId: "dell-latitude-5410",
    partId: "part-1v1xf-42wh",
    fitmentNote: "Verified 42Wh 3-cell 11.4V option for the shared battery family; lower capacity when the original is 51Wh or 68Wh.",
    sourceId: "src-parts-people-1v1xf",
    evidenceQuote: "Genuine DELL OEM 3-Cell 42Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3540, 3541, 3550, 3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5410-r8d7n",
    modelId: "dell-latitude-5410",
    partId: "part-r8d7n-51wh",
    fitmentNote: "Verified 51Wh 3-cell 11.4V option for the shared battery family; exact when the installed configuration is 51Wh.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote: "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3551, 3541, 3540, 3550, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5411-1v1xf",
    modelId: "dell-latitude-5411",
    partId: "part-1v1xf-42wh",
    fitmentNote: "Verified 42Wh 3-cell 11.4V option for the shared battery family; lower capacity when the original is 51Wh or 68Wh.",
    sourceId: "src-parts-people-1v1xf",
    evidenceQuote: "Genuine DELL OEM 3-Cell 42Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3540, 3541, 3550, 3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5411-r8d7n",
    modelId: "dell-latitude-5411",
    partId: "part-r8d7n-51wh",
    fitmentNote: "Verified 51Wh 3-cell 11.4V option for the shared battery family; exact when the installed configuration is 51Wh.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote: "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3551, 3541, 3540, 3550, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5501-1v1xf",
    modelId: "dell-latitude-5501",
    partId: "part-1v1xf-42wh",
    fitmentNote: "Verified 42Wh 3-cell 11.4V option for the shared battery family; lower capacity when the original is 51Wh or 68Wh.",
    sourceId: "src-parts-people-1v1xf",
    evidenceQuote: "Genuine DELL OEM 3-Cell 42Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3540, 3541, 3550, 3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5501-r8d7n",
    modelId: "dell-latitude-5501",
    partId: "part-r8d7n-51wh",
    fitmentNote: "Verified 51Wh 3-cell 11.4V option for the shared battery family; exact when the installed configuration is 51Wh.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote: "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3551, 3541, 3540, 3550, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5510-1v1xf",
    modelId: "dell-latitude-5510",
    partId: "part-1v1xf-42wh",
    fitmentNote: "Verified 42Wh 3-cell 11.4V option for the shared battery family; lower capacity when the original is 51Wh or 68Wh.",
    sourceId: "src-parts-people-1v1xf",
    evidenceQuote: "Genuine DELL OEM 3-Cell 42Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3540, 3541, 3550, 3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5510-r8d7n",
    modelId: "dell-latitude-5510",
    partId: "part-r8d7n-51wh",
    fitmentNote: "Verified 51Wh 3-cell 11.4V option for the shared battery family; exact when the installed configuration is 51Wh.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote: "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3551, 3541, 3540, 3550, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5511-1v1xf",
    modelId: "dell-latitude-5511",
    partId: "part-1v1xf-42wh",
    fitmentNote: "Verified 42Wh 3-cell 11.4V option for the shared battery family; lower capacity when the original is 51Wh or 68Wh.",
    sourceId: "src-parts-people-1v1xf",
    evidenceQuote: "Genuine DELL OEM 3-Cell 42Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3540, 3541, 3550, 3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5511-r8d7n",
    modelId: "dell-latitude-5511",
    partId: "part-r8d7n-51wh",
    fitmentNote: "Verified 51Wh 3-cell 11.4V option for the shared battery family; exact when the installed configuration is 51Wh.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote: "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3551, 3541, 3540, 3550, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-precision-3541-1v1xf",
    modelId: "dell-precision-3541",
    partId: "part-1v1xf-42wh",
    fitmentNote: "Verified 42Wh 3-cell 11.4V option for the shared battery family; lower capacity when the original is 51Wh or 68Wh.",
    sourceId: "src-parts-people-1v1xf",
    evidenceQuote: "Genuine DELL OEM 3-Cell 42Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3540, 3541, 3550, 3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-precision-3541-r8d7n",
    modelId: "dell-precision-3541",
    partId: "part-r8d7n-51wh",
    fitmentNote: "Verified 51Wh 3-cell 11.4V option for the shared battery family; exact when the installed configuration is 51Wh.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote: "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3551, 3541, 3540, 3550, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-precision-3550-1v1xf",
    modelId: "dell-precision-3550",
    partId: "part-1v1xf-42wh",
    fitmentNote: "Verified 42Wh 3-cell 11.4V option for the shared battery family; lower capacity when the original is 51Wh or 68Wh.",
    sourceId: "src-parts-people-1v1xf",
    evidenceQuote: "Genuine DELL OEM 3-Cell 42Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3540, 3541, 3550, 3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-precision-3550-r8d7n",
    modelId: "dell-precision-3550",
    partId: "part-r8d7n-51wh",
    fitmentNote: "Verified 51Wh 3-cell 11.4V option for the shared battery family; exact when the installed configuration is 51Wh.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote: "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3551, 3541, 3540, 3550, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-precision-3551-1v1xf",
    modelId: "dell-precision-3551",
    partId: "part-1v1xf-42wh",
    fitmentNote: "Verified 42Wh 3-cell 11.4V option for the shared battery family; lower capacity when the original is 51Wh or 68Wh.",
    sourceId: "src-parts-people-1v1xf",
    evidenceQuote: "Genuine DELL OEM 3-Cell 42Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3540, 3541, 3550, 3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-precision-3551-r8d7n",
    modelId: "dell-precision-3551",
    partId: "part-r8d7n-51wh",
    fitmentNote: "Verified 51Wh 3-cell 11.4V option for the shared battery family; exact when the installed configuration is 51Wh.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote: "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3551, 3541, 3540, 3550, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-inspiron-7591-2in1-1v1xf",
    modelId: "dell-inspiron-7591-2in1",
    partId: "part-1v1xf-42wh",
    fitmentNote: "Verified 42Wh 3-cell 11.4V option for the shared battery family; lower capacity when the original is 51Wh or 68Wh.",
    sourceId: "src-parts-people-1v1xf",
    evidenceQuote: "Genuine DELL OEM 3-Cell 42Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3540, 3541, 3550, 3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-inspiron-7591-2in1-r8d7n",
    modelId: "dell-inspiron-7591-2in1",
    partId: "part-r8d7n-51wh",
    fitmentNote: "Verified 51Wh 3-cell 11.4V option for the shared battery family; exact when the installed configuration is 51Wh.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote: "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3551, 3541, 3540, 3550, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5400-chromebook-1v1xf",
    modelId: "dell-latitude-5400-chromebook",
    partId: "part-1v1xf-42wh",
    fitmentNote: "Verified 42Wh 3-cell 11.4V option for the shared battery family; lower capacity when the original is 51Wh or 68Wh.",
    sourceId: "src-parts-people-1v1xf",
    evidenceQuote: "Genuine DELL OEM 3-Cell 42Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3540, 3541, 3550, 3551, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5400-chromebook-r8d7n",
    modelId: "dell-latitude-5400-chromebook",
    partId: "part-r8d7n-51wh",
    fitmentNote: "Verified 51Wh 3-cell 11.4V option for the shared battery family; exact when the installed configuration is 51Wh.",
    sourceId: "src-parts-people-r8d7n",
    evidenceQuote: "Genuine DELL OEM 3-Cell 51Wh battery for Latitude 5400, 5401, 5500, 5501, 5510, 5511, 5410, 5411, Precision 3551, 3541, 3540, 3550, Inspiron 7591 2-in-1, and Latitude 5400 Chromebook Enterprise.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-inspiron-7590-2in1-4gvmp",
    modelId: "dell-inspiron-7590-2in1",
    partId: "part-4gvmp-68wh",
    fitmentNote: "Exact 68Wh 7.6V 4-cell family for this shared Dell battery family.",
    sourceId: "src-parts-people-4gvmp",
    evidenceQuote: "Genuine DELL OEM 4-Cell 68Wh battery for Latitude 5400, 5500, Precision 3540, Inspiron 7590/7591/7791 2-in-1, and Latitude 5400 Chromebook.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-inspiron-7591-2in1-4gvmp",
    modelId: "dell-inspiron-7591-2in1",
    partId: "part-4gvmp-68wh",
    fitmentNote: "Exact 68Wh 7.6V 4-cell family for this shared Dell battery family.",
    sourceId: "src-parts-people-4gvmp",
    evidenceQuote: "Genuine DELL OEM 4-Cell 68Wh battery for Latitude 5400, 5500, Precision 3540, Inspiron 7590/7591/7791 2-in-1, and Latitude 5400 Chromebook.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-inspiron-7791-2in1-4gvmp",
    modelId: "dell-inspiron-7791-2in1",
    partId: "part-4gvmp-68wh",
    fitmentNote: "Exact 68Wh 7.6V 4-cell family for this shared Dell battery family.",
    sourceId: "src-parts-people-4gvmp",
    evidenceQuote: "Genuine DELL OEM 4-Cell 68Wh battery for Latitude 5400, 5500, Precision 3540, Inspiron 7590/7591/7791 2-in-1, and Latitude 5400 Chromebook.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-latitude-5400-chromebook-4gvmp",
    modelId: "dell-latitude-5400-chromebook",
    partId: "part-4gvmp-68wh",
    fitmentNote: "Exact 68Wh 7.6V 4-cell family for this shared Dell battery family.",
    sourceId: "src-parts-people-4gvmp",
    evidenceQuote: "Genuine DELL OEM 4-Cell 68Wh battery for Latitude 5400, 5500, Precision 3540, Inspiron 7590/7591/7791 2-in-1, and Latitude 5400 Chromebook.",
    status: "verified",
    verifiedAt: VERIFIED_AT
  },
  {
    id: "compat-t480s-01av478",
    modelId: "lenovo-thinkpad-t480s",
    partId: "part-01av478-57wh",
    fitmentNote: "Exact 57Wh 3-cell 11.58V internal battery for ThinkPad T480s (20L7/20L8); Lenovo FRU 01AV478/479/480.",
    sourceId: "src-lenovo-t480s-frubom",
    evidenceQuote: "Lenovo T480s FRU BOM (20L7/20L8): 01AV478 N Internal, 3c, 57Wh, LiIon, LGC; 01AV479/480 are SMP alternates.",
    status: "verified",
    verifiedAt: VERIFIED_AT
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

export const modelSourceIds: Record<string, string> = {
  "dell-latitude-5400": "src-dell-spec",
  "dell-latitude-5401": "src-parts-people-1v1xf",
  "dell-latitude-5500": "src-parts-people-1v1xf",
  "dell-precision-3540": "src-parts-people-1v1xf",
  "dell-latitude-5410": "src-parts-people-1v1xf",
  "dell-latitude-5411": "src-parts-people-1v1xf",
  "dell-latitude-5501": "src-parts-people-1v1xf",
  "dell-latitude-5510": "src-parts-people-1v1xf",
  "dell-latitude-5511": "src-parts-people-1v1xf",
  "dell-precision-3541": "src-parts-people-1v1xf",
  "dell-precision-3550": "src-parts-people-1v1xf",
  "dell-precision-3551": "src-parts-people-1v1xf",
  "dell-inspiron-7590-2in1": "src-parts-people-4gvmp",
  "dell-inspiron-7591-2in1": "src-parts-people-4gvmp",
  "dell-inspiron-7791-2in1": "src-parts-people-4gvmp",
  "dell-latitude-5400-chromebook": "src-parts-people-4gvmp",
  "lenovo-thinkpad-t480s": "src-lenovo-t480s-frubom"
};

export const partAvailability: Record<
  string,
  {
    status: PartAvailabilityStatus;
    checkedAt: Date | null;
    note: string;
    sourceUrl?: string;
  }
> = {
  "part-4gvmp-68wh": {
    status: "reported_in_stock",
    checkedAt: new Date("2026-10-28T12:00:00.000Z"),
    note: "Parts-People showed the 4GVMP listing in stock at $109.95 on 2026-10-28; this is a point-in-time seller report, not live inventory.",
    sourceUrl: "https://www.parts-people.com/index.php?action=item&id=30351"
  },
  "part-1v1xf-42wh": {
    status: "reported_in_stock",
    checkedAt: new Date("2026-10-28T12:00:00.000Z"),
    note: "Parts-People showed the 1V1XF listing at $59.95 on 2026-10-28; stock and price are not live.",
    sourceUrl: "https://www.parts-people.com/index.php?action=item&id=30353"
  },
  "part-r8d7n-51wh": {
    status: "reported_out_of_stock",
    checkedAt: new Date("2026-10-28T12:00:00.000Z"),
    note: "Parts-People showed the R8D7N listing Out Of Stock (used $49.95) on 2026-10-28. Fitment is verified; availability is not.",
    sourceUrl: "https://www.parts-people.com/index.php?action=item&id=30356"
  },
  "part-3hwpp-68wh-15v": {
    status: "unknown",
    checkedAt: null,
    note: "Excluded by voltage; seller availability is not checked.",
    sourceUrl: "https://www.ifixit.com/Parts/Dell_Latitude_5400/Batteries"
  },
  "part-01av478-57wh": {
    status: "unknown",
    checkedAt: new Date("2026-10-26T12:00:00.000Z"),
    note: "Lenovo/iFixit sources verify the 57Wh family; seller availability is not live.",
    sourceUrl: "https://www.ifixit.com/products/lenovo-thinkpad-t480s-battery"
  }
};

export const catalogData: CatalogData = {
  sources,
  models,
  parts,
  compatibility,
  symptoms,
  symptomRules
};
