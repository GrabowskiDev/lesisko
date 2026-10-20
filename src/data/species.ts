export type TreeShape = 'round' | 'pine' | 'tall' | 'blossom' | 'palm' | 'cactus' | 'flower' | 'mushroom'

export const SPECIES_IDS = [
  'oak', 'pine', 'birch', 'sunflower', 'cherry', 'cactus', 'maple', 'palm', 'mushroom', 'lavender', 'spruce', 'golden',
] as const
export type SpeciesId = (typeof SPECIES_IDS)[number]

/** Names and descriptions live in the i18n dictionaries, keyed by id. */
export interface Species {
  id: SpeciesId
  price: number
  shape: TreeShape
  trunk: string
  leaf: string
  leafLight: string
  accent?: string
}

export const SPECIES: Species[] = [
  { id: 'oak', price: 0, shape: 'round', trunk: '#8a5a3b', leaf: '#5b9a54', leafLight: '#7cbd6d' },
  { id: 'pine', price: 0, shape: 'pine', trunk: '#7a4e33', leaf: '#3f7f4f', leafLight: '#58a066' },
  { id: 'birch', price: 150, shape: 'tall', trunk: '#e9e4d8', leaf: '#8cc06a', leafLight: '#b2d98a', accent: '#4a4a4a' },
  { id: 'sunflower', price: 200, shape: 'flower', trunk: '#5f8f3e', leaf: '#f2b33d', leafLight: '#f7cf62', accent: '#7a4a24' },
  { id: 'cherry', price: 300, shape: 'blossom', trunk: '#7d4b3a', leaf: '#f2a7c0', leafLight: '#f9cadb', accent: '#ffffff' },
  { id: 'cactus', price: 350, shape: 'cactus', trunk: '#4f8d5a', leaf: '#5fa36a', leafLight: '#7fbf86', accent: '#f37a9b' },
  { id: 'maple', price: 400, shape: 'round', trunk: '#7b4a30', leaf: '#d9692f', leafLight: '#f0944a' },
  { id: 'palm', price: 500, shape: 'palm', trunk: '#a0764c', leaf: '#3f9b5d', leafLight: '#62b97a' },
  { id: 'mushroom', price: 600, shape: 'mushroom', trunk: '#f1e8d6', leaf: '#d9534f', leafLight: '#e8736f', accent: '#ffffff' },
  { id: 'lavender', price: 800, shape: 'blossom', trunk: '#6d4c3d', leaf: '#a58bd6', leafLight: '#c6b2ec', accent: '#efe7ff' },
  { id: 'spruce', price: 1000, shape: 'pine', trunk: '#6b4a35', leaf: '#2f6b5a', leafLight: '#4d8e7b', accent: '#ffffff' },
  { id: 'golden', price: 2500, shape: 'round', trunk: '#8a6a3b', leaf: '#e3b23c', leafLight: '#f6d778', accent: '#fff6c9' },
]

export const DEFAULT_SPECIES = SPECIES[0]

export function getSpecies(id: string): Species {
  return SPECIES.find((s) => s.id === id) ?? DEFAULT_SPECIES
}
