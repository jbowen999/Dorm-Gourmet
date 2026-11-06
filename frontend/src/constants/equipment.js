// Keep values in sync with backend/constants.js.
export const EQUIPMENT = [
  { value: "microwave", label: "Microwave", icon: "📡" },
  { value: "hot-plate", label: "Hot plate", icon: "🔥" },
  { value: "mini-fridge", label: "Mini-fridge", icon: "🧊" },
  { value: "no-cook", label: "No-cook", icon: "🥪" },
];

export const EQUIPMENT_VALUES = EQUIPMENT.map((e) => e.value);

export function equipmentInfo(value) {
  return EQUIPMENT.find((e) => e.value === value) ?? { value, label: value, icon: "🍽️" };
}
