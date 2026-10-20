export type TreeShape = 'round' | 'pine' | 'tall' | 'blossom' | 'palm' | 'cactus' | 'flower' | 'mushroom'

export interface Species {
  id: string
  name: string
  price: number
  shape: TreeShape
  trunk: string
  leaf: string
  leafLight: string
  accent?: string
  blurb: string
}

export const SPECIES: Species[] = [
  { id: 'oak', name: 'Oak', price: 0, shape: 'round', trunk: '#8a5a3b', leaf: '#5b9a54', leafLight: '#7cbd6d', blurb: 'Steady and strong. The classic.' },
  { id: 'pine', name: 'Pine', price: 0, shape: 'pine', trunk: '#7a4e33', leaf: '#3f7f4f', leafLight: '#58a066', blurb: 'Evergreen focus, all year round.' },
  { id: 'birch', name: 'Birch', price: 150, shape: 'tall', trunk: '#e9e4d8', leaf: '#8cc06a', leafLight: '#b2d98a', accent: '#4a4a4a', blurb: 'Light, bright and slender.' },
  { id: 'sunflower', name: 'Sunflower', price: 200, shape: 'flower', trunk: '#5f8f3e', leaf: '#f2b33d', leafLight: '#f7cf62', accent: '#7a4a24', blurb: 'Always turns towards the light.' },
  { id: 'cherry', name: 'Cherry Blossom', price: 300, shape: 'blossom', trunk: '#7d4b3a', leaf: '#f2a7c0', leafLight: '#f9cadb', accent: '#ffffff', blurb: 'Soft pink petals for calm sessions.' },
  { id: 'cactus', name: 'Cactus', price: 350, shape: 'cactus', trunk: '#4f8d5a', leaf: '#5fa36a', leafLight: '#7fbf86', accent: '#f37a9b', blurb: 'Thrives even on the driest topics.' },
  { id: 'maple', name: 'Autumn Maple', price: 400, shape: 'round', trunk: '#7b4a30', leaf: '#d9692f', leafLight: '#f0944a', blurb: 'Warm colours for cosy evenings.' },
  { id: 'palm', name: 'Palm', price: 500, shape: 'palm', trunk: '#a0764c', leaf: '#3f9b5d', leafLight: '#62b97a', blurb: 'A little holiday for your brain.' },
  { id: 'mushroom', name: 'Mushroom', price: 600, shape: 'mushroom', trunk: '#f1e8d6', leaf: '#d9534f', leafLight: '#e8736f', accent: '#ffffff', blurb: 'Grows quietly in the shade.' },
  { id: 'lavender', name: 'Wisteria', price: 800, shape: 'blossom', trunk: '#6d4c3d', leaf: '#a58bd6', leafLight: '#c6b2ec', accent: '#efe7ff', blurb: 'Rare and dreamy.' },
  { id: 'spruce', name: 'Snowy Spruce', price: 1000, shape: 'pine', trunk: '#6b4a35', leaf: '#2f6b5a', leafLight: '#4d8e7b', accent: '#ffffff', blurb: 'Dusted with fresh snow.' },
  { id: 'golden', name: 'Golden Tree', price: 2500, shape: 'round', trunk: '#8a6a3b', leaf: '#e3b23c', leafLight: '#f6d778', accent: '#fff6c9', blurb: 'For the truly dedicated.' },
]

export const DEFAULT_SPECIES = SPECIES[0]

export function getSpecies(id: string): Species {
  return SPECIES.find((s) => s.id === id) ?? DEFAULT_SPECIES
}
