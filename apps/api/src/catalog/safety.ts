const DAMAGED_TAG = "battery_damaged";

export function addDamagedBatteryTag(
  symptomTags: string[],
  safetyFlag: boolean
): string[] {
  if (!safetyFlag || symptomTags.includes(DAMAGED_TAG)) return symptomTags;
  return [...symptomTags, DAMAGED_TAG];
}
