export interface CustomizationOption {
  id: string;
  category: "base" | "toppings" | "fillings";
  name: string;
  description?: string;
  price: number;
  maxQuantity: number;
}

export const ORDER_CUSTOMIZATIONS: CustomizationOption[] = [
  // ── Base ──────────────────────────────────────────────────────────────────
  {
    id: "base-white",
    category: "base",
    name: "White Chocolate",
    description: "Creamy and sweet white chocolate base",
    price: 150.0,
    maxQuantity: 1,
  },
  {
    id: "base-dark",
    category: "base",
    name: "Dark Chocolate",
    description: "Rich, bold 70% dark chocolate base",
    price: 200.0,
    maxQuantity: 1,
  },
  {
    id: "base-milk",
    category: "base",
    name: "Milk Chocolate",
    description: "Classic smooth milk chocolate base",
    price: 100.0,
    maxQuantity: 1,
  },

  // ── Toppings ──────────────────────────────────────────────────────────────
  {
    id: "topping-nuts",
    category: "toppings",
    name: "Nuts",
    description: "Mixed roasted nuts (cashews, almonds, hazelnuts)",
    price: 3.0,
    maxQuantity: 3,
  },
  {
    id: "topping-chocochips",
    category: "toppings",
    name: "Choco Chips",
    description: "Mini chocolate chips for extra texture",
    price: 5.0,
    maxQuantity: 3,
  },
  {
    id: "topping-sprinkles",
    category: "toppings",
    name: "Sprinkles",
    description: "Colorful sugar sprinkles",
    price: 3.5,
    maxQuantity: 3,
  },
  {
    id: "topping-caramel-drizzle",
    category: "toppings",
    name: "Caramel Drizzle",
    description: "Warm, buttery caramel sauce drizzled on top",
    price: 6.0,
    maxQuantity: 2,
  },
  {
    id: "topping-coconut",
    category: "toppings",
    name: "Coconut Flakes",
    description: "Freshly shredded organic coconut",
    price: 5.0,
    maxQuantity: 2,
  },
  {
    id: "topping-seasalt",
    category: "toppings",
    name: "Sea Salt",
    description: "Gourmet sea salt crystals for a sweet-salty balance",
    price: 2.5,
    maxQuantity: 2,
  },

  // ── Fillings ──────────────────────────────────────────────────────────────
  {
    id: "filling-caramel",
    category: "fillings",
    name: "Caramel",
    description: "Smooth buttery caramel filling",
    price: 5.0,
    maxQuantity: 2,
  },
  {
    id: "filling-strawberry",
    category: "fillings",
    name: "Strawberry",
    description: "Sweet strawberry jam filling",
    price: 10.0,
    maxQuantity: 2,
  },
  {
    id: "filling-almond",
    category: "fillings",
    name: "Almond Paste",
    description: "Crunchy roasted almond paste filling",
    price: 12.0,
    maxQuantity: 2,
  },
  {
    id: "filling-hazelnut",
    category: "fillings",
    name: "Hazelnut",
    description: "Creamy roasted hazelnut praline",
    price: 8.0,
    maxQuantity: 2,
  },
];

/** Returns the catalog grouped by category for easy frontend rendering */
export function getCustomizationsByCategory() {
  return {
    base: ORDER_CUSTOMIZATIONS.filter((c) => c.category === "base"),
    toppings: ORDER_CUSTOMIZATIONS.filter((c) => c.category === "toppings"),
    fillings: ORDER_CUSTOMIZATIONS.filter((c) => c.category === "fillings"),
  };
}

/** Validates that all provided selection IDs exist in the catalog */
export function validateCustomizationIds(ids: string[]): boolean {
  const validIds = new Set(ORDER_CUSTOMIZATIONS.map((c) => c.id));
  return ids.every((id) => validIds.has(id));
}
