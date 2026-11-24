// Placeholder visuals until real art arrives in Week 2.
export const PLANTS = {
  fern: { label: "Fern", emoji: "🌿" },
  sunflower: { label: "Sunflower", emoji: "🌻" },
  tulip: { label: "Tulip", emoji: "🌷" },
  cactus: { label: "Cactus", emoji: "🌵" },
  rose: { label: "Rose", emoji: "🌹" },
  tree: { label: "Tree", emoji: "🌳" },
} as const;

export type PlantType = keyof typeof PLANTS;

export function isPlantType(v: string): v is PlantType {
  return v in PLANTS;
}
