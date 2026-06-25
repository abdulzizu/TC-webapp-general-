export type StylePairing = {
  item: string;
  reason: string;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  size: string;          // single fixed size — one of one
  colours: string[];
  tag: "NEW" | "2 LEFT" | "1 LEFT" | "SOLD OUT";
  image: string;
  description: string;
  available: boolean;
  pairsWith: StylePairing[];  // suggested items to pair with
};

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Inter Milan Lautaro #10 Jersey",
    category: "Clothing",
    subcategory: "T-shirts",
    price: 14500,
    size: "L",
    colours: ["Blue", "Black"],
    tag: "NEW",
    image: "/products/lautaro inter milan jersey.jpeg",
    description: "Iconic Inter Milan home jersey featuring Lautaro Martínez #10. Python-print design, Lenovo sponsor. Good-as-new condition.",
    available: true,
    pairsWith: [
      { item: "Black Baggy Jeans", reason: "The contrast between the bold blue jersey and black denim keeps the fit clean and grounded." },
      { item: "Grey Acid Wash Sweatpants", reason: "A relaxed, tonal pairing. Grey neutralises the jersey's colour without competing with it." },
      { item: "Adidas × FOG Sneakers", reason: "Chunky white sneakers add weight to the bottom of the fit and balance the oversized jersey top." },
    ],
  },
  {
    id: 2,
    name: "Liverpool FC 2006 Jersey",
    category: "Clothing",
    subcategory: "T-shirts",
    price: 12500,
    size: "M",
    colours: ["Red", "White"],
    tag: "2 LEFT",
    image: "/products/liverpool 2006 jersey.jpeg",
    description: "Classic Liverpool FC 2006 home kit. Adidas. Carlsberg sponsor. A collector's piece in great condition.",
    available: true,
    pairsWith: [
      { item: "Black Baggy Jeans", reason: "Black denim lets the red jersey do the talking. A timeless combo." },
      { item: "Black Sweatpants", reason: "Keeps the vibe relaxed and street-ready — jersey as a statement piece." },
      { item: "Vintage Puma Cap", reason: "The red cap pulls colour from the jersey and ties the whole look together." },
    ],
  },
  {
    id: 3,
    name: "Burgundy Vintage Windbreaker",
    category: "Clothing",
    subcategory: "Jackets",
    price: 18000,
    size: "M",
    colours: ["Burgundy", "White", "Blue"],
    tag: "NEW",
    image: "/products/burgundy wind breaker jacket.jpeg",
    description: "Retro Nassau windbreaker in bold burgundy. Striking graphic panelling, full zip, lightweight feel. Perfect for the drop.",
    available: true,
    pairsWith: [
      { item: "Black Baggy Jeans", reason: "Burgundy over black is a classic contrast — the baggier the jeans, the better the silhouette." },
      { item: "Navy Stripe Oversized Tee", reason: "Layer the tee underneath with it slightly visible at the hem for that 90s layering look." },
      { item: "Adidas × FOG Sneakers", reason: "The clean white sneaker base grounds the bold jacket colour palette." },
    ],
  },
  {
    id: 4,
    name: "Bomber Jacket",
    category: "Clothing",
    subcategory: "Jackets",
    price: 16500,
    size: "L",
    colours: ["Black"],
    tag: "NEW",
    image: "/products/bomber jacket.jpeg",
    description: "Clean, minimal bomber. Streetwear staple. Versatile enough for any fit.",
    available: true,
    pairsWith: [
      { item: "Navy Stripe Oversized Tee", reason: "The stripe tee adds visual interest under the bomber without breaking the clean black palette." },
      { item: "Black Baggy Jeans", reason: "Full black monochrome. Simple, sharp, and effective." },
      { item: "Pink MLB Cap", reason: "A pop of pink cuts through the all-black and adds personality to the fit." },
    ],
  },
  {
    id: 5,
    name: "Navy Blue Quarter-Zip Sweatshirt",
    category: "Clothing",
    subcategory: "Track suits",
    price: 13500,
    size: "M",
    colours: ["Navy", "White"],
    tag: "1 LEFT",
    image: "/products/navy blue sweatshirt.jpeg",
    description: "Outlier 1991 RC Rider Supply Co. quarter-zip. Navy/white colourblock. Collegiate aesthetic. One left — move fast.",
    available: true,
    pairsWith: [
      { item: "Blue Jeans", reason: "Tonal navy-on-blue denim is a smart, understated pairing with a collegiate edge." },
      { item: "Black Baggy Jeans", reason: "The dark contrast between navy top and black jeans keeps the look clean and structured." },
      { item: "Adidas × FOG Sneakers", reason: "White sneakers lift the navy colour and keep the collegiate energy going." },
    ],
  },
  {
    id: 6,
    name: "Light Grey Sweatshirt",
    category: "Clothing",
    subcategory: "Track suits",
    price: 12000,
    size: "S",
    colours: ["Grey"],
    tag: "NEW",
    image: "/products/light grey sweatshirt.jpeg",
    description: "Relaxed-fit light grey crewneck. Everyday comfort, clean silhouette.",
    available: true,
    pairsWith: [
      { item: "Black Baggy Jeans", reason: "A grey/black combo is the most versatile everyday fit — it always works." },
      { item: "Grey Acid Wash Sweatpants", reason: "Tonal grey matching top and bottom for that clean, intentional streetwear look." },
      { item: "Vintage Puma Cap", reason: "The red cap pops against grey for a confident colour accent." },
    ],
  },
  {
    id: 7,
    name: "Classic Polo Shirt",
    category: "Clothing",
    subcategory: "Shirts",
    price: 9000,
    size: "L",
    colours: ["White"],
    tag: "NEW",
    image: "/products/polo shirt.jpeg",
    description: "Crisp polo shirt. Timeless cut. Great for layering or wearing standalone.",
    available: true,
    pairsWith: [
      { item: "Blue Jeans", reason: "White polo and blue denim is a classic smart-casual combination that never ages." },
      { item: "Black Baggy Jeans", reason: "White over black is sharp — the polo tucks for a cleaner look or worn loose for streetwear." },
      { item: "Adidas × FOG Sneakers", reason: "The chunky white sneakers match the polo's clean white and elevate the full look." },
    ],
  },
  {
    id: 8,
    name: "Navy Stripe Oversized Tee",
    category: "Clothing",
    subcategory: "T-shirts",
    price: 7500,
    size: "XL",
    colours: ["Navy", "White"],
    tag: "NEW",
    image: "/products/t-shirt.jpeg",
    description: "Boxy navy/white stripe tee. Heavy cotton. Worn oversized or tucked — both work.",
    available: true,
    pairsWith: [
      { item: "Black Baggy Jeans", reason: "The stripe tee is a statement on its own — let the black jeans stay out of the way." },
      { item: "Grey Acid Wash Sweatpants", reason: "Relaxed tee with relaxed sweats. Laid-back energy, intentional look." },
      { item: "Pink MLB Cap", reason: "A soft pink cap adds warmth and contrast to the cool navy/white stripe palette." },
    ],
  },
  {
    id: 9,
    name: "Red Casual Shorts",
    category: "Clothing",
    subcategory: "Shorts",
    price: 6500,
    size: "M",
    colours: ["Red"],
    tag: "NEW",
    image: "/products/red casual short.jpeg",
    description: "Easy-wearing red shorts. Comfortable fit. Perfect for warmer days.",
    available: true,
    pairsWith: [
      { item: "Navy Stripe Oversized Tee", reason: "The stripe tee's navy picks up on the red shorts' boldness for a colour-blocked summer look." },
      { item: "Classic Polo Shirt", reason: "White polo and red shorts is a clean, sporty combination." },
      { item: "Adidas × FOG Sneakers", reason: "White chunky sneakers complete the bold colour scheme without adding more colour." },
    ],
  },
  {
    id: 10,
    name: "White Casual Shorts",
    category: "Clothing",
    subcategory: "Shorts",
    price: 6500,
    size: "S",
    colours: ["White"],
    tag: "NEW",
    image: "/products/white casual short.jpeg",
    description: "Minimal white shorts. Clean look. Pairs with everything.",
    available: true,
    pairsWith: [
      { item: "Inter Milan Lautaro #10 Jersey", reason: "White shorts let the jersey pop without competition. Classic football-inspired look." },
      { item: "Light Grey Sweatshirt", reason: "White and grey is effortlessly minimal — an easy go-to pairing." },
      { item: "Vintage Puma Cap", reason: "The red cap adds colour to the all-white/grey outfit and finishes it off." },
    ],
  },
  {
    id: 11,
    name: "Black Baggy Jeans",
    category: "Clothing",
    subcategory: "Jeans",
    price: 15000,
    size: "32",
    colours: ["Black"],
    tag: "NEW",
    image: "/products/black baggy jeans.jpeg",
    description: "Wide-leg black denim with a relaxed, barrel-leg silhouette. Drawstring hem. Statement piece.",
    available: true,
    pairsWith: [
      { item: "Burgundy Vintage Windbreaker", reason: "The bold jacket over clean black denim is a textbook streetwear combination." },
      { item: "Bomber Jacket", reason: "All-black top and bottom with a bomber creates a sleek, put-together silhouette." },
      { item: "Adidas × FOG Sneakers", reason: "Chunky white sneakers under baggy black jeans creates the perfect proportional contrast." },
    ],
  },
  {
    id: 12,
    name: "Blue Jeans",
    category: "Clothing",
    subcategory: "Jeans",
    price: 13000,
    size: "32",
    colours: ["Blue"],
    tag: "NEW",
    image: "/products/blue jeans.jpeg",
    description: "Classic blue denim. Straight fit. Goes with everything in the wardrobe.",
    available: true,
    pairsWith: [
      { item: "Classic Polo Shirt", reason: "White polo and blue jeans is timeless. Smart, clean, and versatile." },
      { item: "Navy Blue Quarter-Zip Sweatshirt", reason: "Tonal navy and denim blue is a cohesive, put-together look." },
      { item: "Adidas × FOG Sneakers", reason: "Chunky sneakers with straight blue denim creates a modern silhouette." },
    ],
  },
  {
    id: 13,
    name: "Black Sweatpants",
    category: "Clothing",
    subcategory: "Sweatpants",
    price: 9000,
    size: "L",
    colours: ["Black"],
    tag: "NEW",
    image: "/products/black sweatpants.jpeg",
    description: "Essential black sweatpants. Comfortable, relaxed fit for everyday wear.",
    available: true,
    pairsWith: [
      { item: "Liverpool FC 2006 Jersey", reason: "Red jersey over black sweats is easy and expressive — a classic combination." },
      { item: "Light Grey Sweatshirt", reason: "Grey top and black bottoms is the foundation of a clean athleisure look." },
      { item: "Vintage Puma Cap", reason: "The red cap adds a colour punch to a neutral black-and-grey outfit." },
    ],
  },
  {
    id: 14,
    name: "Grey Acid Wash Sweatpants",
    category: "Clothing",
    subcategory: "Sweatpants",
    price: 9500,
    size: "M",
    colours: ["Grey"],
    tag: "NEW",
    image: "/products/greys weatpants.jpeg",
    description: "Washed grey sweatpants with a vintage, faded look. Wide leg. Drawstring waist.",
    available: true,
    pairsWith: [
      { item: "Inter Milan Lautaro #10 Jersey", reason: "The washed grey tones down the jersey's colour intensity for a balanced, relaxed look." },
      { item: "Light Grey Sweatshirt", reason: "Full grey co-ord. When tones match, the intentionality comes through." },
      { item: "Adidas × FOG Sneakers", reason: "White sneakers under grey washed sweats lifts the overall look." },
    ],
  },
  {
    id: 15,
    name: "Vintage Puma Cap",
    category: "Accessories",
    subcategory: "Caps and hats",
    price: 5000,
    size: "One Size",
    colours: ["Red"],
    tag: "NEW",
    image: "/products/puma cap.jpeg",
    description: "Vintage Puma 6-panel cap in red corduroy. Original tags still on. Rare find.",
    available: true,
    pairsWith: [
      { item: "Light Grey Sweatshirt", reason: "The red cap pops against grey and adds the finishing colour accent the outfit needs." },
      { item: "Black Sweatpants", reason: "Red cap over a neutral fit injects personality without changing the whole vibe." },
      { item: "Navy Stripe Oversized Tee", reason: "The warmth of the red cap contrasts nicely with the cool navy/white stripe palette." },
    ],
  },
  {
    id: 16,
    name: "Pink MLB Cap",
    category: "Accessories",
    subcategory: "Caps and hats",
    price: 5500,
    size: "One Size",
    colours: ["Pink"],
    tag: "NEW",
    image: "/products/pink MLB cap.jpeg",
    description: "MLB-style pink cap. Clean embroidery. Adjustable strap.",
    available: true,
    pairsWith: [
      { item: "Bomber Jacket", reason: "Pink against all-black adds an unexpected but intentional pop of colour." },
      { item: "Navy Stripe Oversized Tee", reason: "The softness of pink plays off the bold navy/white stripe for a balanced look." },
      { item: "White Casual Shorts", reason: "White shorts keep the focus upward on the colourful cap and top." },
    ],
  },
  {
    id: 17,
    name: "Adidas × FOG Sneakers",
    category: "Shoes",
    subcategory: "Sneakers",
    price: 28000,
    size: "42",
    colours: ["White", "Grey"],
    tag: "NEW",
    image: "/products/adidas x fog sneakers.jpeg",
    description: "Adidas Fear of God collaboration. Chunky sole, premium materials. Limited and hard to find.",
    available: true,
    pairsWith: [
      { item: "Black Baggy Jeans", reason: "The contrast between the white chunky sole and black denim is one of the best sneaker pairings in streetwear." },
      { item: "Grey Acid Wash Sweatpants", reason: "Wide leg sweats and chunky sneakers are made for each other — proportions are perfect." },
      { item: "Navy Blue Quarter-Zip Sweatshirt", reason: "The white base of the sneakers picks up the white panels in the quarter-zip for a cohesive look." },
    ],
  },
];

export const CATEGORIES = {
  Clothing: ["Jackets", "T-shirts", "Shirts", "Cargo pants", "Jeans", "Shorts", "Track suits", "Sweatpants"],
  Accessories: ["Caps and hats", "Ties", "Beanies", "Gloves"],
  Shoes: ["Clogs", "Slippers", "Sneakers", "Sandals"],
};

export const POPULAR_SEARCHES = [
  "Liverpool jersey", "Windbreaker", "Baggy jeans", "Puma cap", "Sweatpants", "Oversized tee",
];

export function getProduct(id: number): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductByName(name: string): Product | undefined {
  return PRODUCTS.find((p) => p.name === name);
}
