export type AddOn = {
  id: string;
  label: string;
  price: number; // price per piece in INR
  description?: string;
};

export const addOns: AddOn[] = [
  {
    id: "gloss",
    label: "Gloss Lamination",
    price: 0.75,
    description: "High-shine coating ideal for vibrant colours.",
  },
  {
    id: "matte",
    label: "Matte Lamination",
    price: 0.75,
    description: "Soft-touch finish that resists glare and fingerprints.",
  },
  {
    id: "uv",
    label: "Spot UV",
    price: 1.2,
    description: "Selective UV coating to highlight logos or titles.",
  },
  {
    id: "folding",
    label: "Folding / Creasing",
    price: 3,
    description: "Precision folds with creasing to avoid cracking.",
  },
];
