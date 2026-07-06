import type { Property, PropertyInput } from "./types";

// Realistic listing content used two ways:
//  1. As demo content on the public pages BEFORE the app has data, so the site
//     never looks empty (loaders fall back to this when a query returns nothing).
//  2. As the payload the admin-only /seed route bulk-creates into the real
//     database (agent_email is swapped for the admin's email at seed time).
//
// Photos are hosted on Unsplash's CDN. Swap them for your own uploads in prod.

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

export const SEED_INPUTS: Omit<PropertyInput, "agent_email">[] = [
  {
    title: "Sunlit Craftsman with Bay Views",
    description:
      "A meticulously restored 1912 Craftsman perched above the harbor. Original quarter-sawn oak floors and coffered ceilings meet a chef's kitchen with marble counters and a professional range. The primary suite opens to a private deck framing the water. Walk to cafes, the ferry, and the weekend market.",
    price: 1895000,
    address: "482 Alcatraz Terrace",
    city: "San Francisco",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2840,
    property_type: "house",
    status: "for_sale",
    featured: true,
    images: [
      { url: img("photo-1600585154340-be6161a56a0c") },
      { url: img("photo-1600566753086-00f18fb6b3ea") },
      { url: img("photo-1600607687939-ce8a6c25118c") },
    ],
  },
  {
    title: "Glass-Walled Modern in the Hills",
    description:
      "Architect-designed and light-drenched, this four-bedroom retreat dissolves the line between inside and out. Floor-to-ceiling glass, an infinity-edge pool, and a great room built for gathering. A discreet home office and a two-car gallery garage complete the package.",
    price: 3250000,
    address: "17 Ridgecrest Drive",
    city: "Los Angeles",
    bedrooms: 4,
    bathrooms: 5,
    sqft: 4120,
    property_type: "house",
    status: "for_sale",
    featured: true,
    images: [
      { url: img("photo-1512917774080-9991f1c4c750") },
      { url: img("photo-1613490493576-7fde63acd811") },
      { url: img("photo-1600047509807-ba8f99d2cdde") },
    ],
  },
  {
    title: "Loft-Style Condo in the Arts District",
    description:
      "Soaring ceilings, exposed brick, and steel-framed windows in a converted 1920s warehouse. An open plan with polished concrete floors, a quartz island, and a private balcony over the gallery row. Building amenities include a rooftop lounge and secure parking.",
    price: 720000,
    address: "900 Mateo Street, Unit 5B",
    city: "Los Angeles",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1480,
    property_type: "condo",
    status: "for_sale",
    featured: true,
    images: [
      { url: img("photo-1502672260266-1c1ef2d93688") },
      { url: img("photo-1493809842364-78817add7ffb") },
    ],
  },
  {
    title: "Garden Apartment Near the Park",
    description:
      "A bright and airy two-bedroom on a leafy brownstone block. Restored moldings, a renovated kitchen, and a rare private garden for morning coffee. Steps from the park, the subway, and the neighborhood's best bakeries.",
    price: 545000,
    address: "212 Prospect Place, Apt 1",
    city: "New York",
    bedrooms: 2,
    bathrooms: 1,
    sqft: 1080,
    property_type: "apartment",
    status: "for_sale",
    featured: false,
    images: [
      { url: img("photo-1522708323590-d24dbb6b0267") },
      { url: img("photo-1560448204-e02f11c3d0e2") },
    ],
  },
  {
    title: "Waterfront Contemporary with Dock",
    description:
      "Wake to open water from nearly every room. This five-bedroom contemporary offers a private dock, a screened lanai, and a summer kitchen for entertaining. Impact glass throughout and a whole-home generator for true peace of mind.",
    price: 2450000,
    address: "31 Mariner's Cove",
    city: "Miami",
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3860,
    property_type: "house",
    status: "pending",
    featured: true,
    images: [
      { url: img("photo-1564013799919-ab600027ffc6") },
      { url: img("photo-1512915922686-57c11dde9b6b") },
    ],
  },
  {
    title: "Downtown High-Rise Condo",
    description:
      "A turnkey one-bedroom on the 24th floor with skyline views and a concierge lobby. Wide-plank floors, integrated appliances, and a spa-inspired bath. The building features a fitness center, pool deck, and resident lounge.",
    price: 389000,
    address: "45 Biscayne Blvd, Unit 2402",
    city: "Miami",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 760,
    property_type: "condo",
    status: "for_sale",
    featured: false,
    images: [
      { url: img("photo-1545324418-cc1a3fa10c00") },
      { url: img("photo-1502005229762-cf1b2da7c5d6") },
    ],
  },
  {
    title: "Historic Townhouse, Fully Renovated",
    description:
      "Four floors of classic elegance behind a landmark facade. A garden-level kitchen opens to a stone patio; the parlor floor keeps its original fireplaces and 11-foot ceilings. A top-floor primary suite adds a study and a roof terrace.",
    price: 4100000,
    address: "78 West 11th Street",
    city: "New York",
    bedrooms: 4,
    bathrooms: 4,
    sqft: 3400,
    property_type: "house",
    status: "for_sale",
    featured: false,
    images: [
      { url: img("photo-1583608205776-bfd35f0d9f83") },
      { url: img("photo-1600585154526-990dced4db0d") },
    ],
  },
  {
    title: "Buildable Ridge-Top Parcel",
    description:
      "Just over three acres of gently sloping land with panoramic valley views and mature oaks. Utilities are at the street and preliminary plans are available. A rare opportunity to build your own retreat minutes from town.",
    price: 415000,
    address: "0 Summit Vista Road",
    city: "Austin",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    property_type: "land",
    status: "for_sale",
    featured: false,
    images: [{ url: img("photo-1500382017468-9049fed747ef") }],
  },
  {
    title: "Hill Country Modern Farmhouse",
    description:
      "A brand-new farmhouse blending board-and-batten charm with clean modern lines. An open great room, a scullery off the main kitchen, and a covered porch made for long evenings. Energy-efficient throughout with a two-car garage and room for a pool.",
    price: 985000,
    address: "1440 Bluebonnet Lane",
    city: "Austin",
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2650,
    property_type: "house",
    status: "for_sale",
    featured: true,
    images: [
      { url: img("photo-1570129477492-45c003edd2be") },
      { url: img("photo-1568605114967-8130f3a36994") },
    ],
  },
  {
    title: "Restored Victorian, Sold",
    description:
      "A painted-lady Victorian lovingly returned to its original glory, sold last season. Included here so you can see a recently closed comparable in the neighborhood.",
    price: 1650000,
    address: "355 Steiner Street",
    city: "San Francisco",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2200,
    property_type: "house",
    status: "sold",
    featured: false,
    images: [{ url: img("photo-1600596542815-ffad4c1539a9") }],
  },
];

const DEMO_AGENT = "agent@base44estates.com";
const NOW = "2026-01-01T00:00:00.000Z";

// Full Property records (with ids) for demo fallback rendering.
export const SEED_PROPERTIES: Property[] = SEED_INPUTS.map((input, i) => ({
  ...input,
  id: `demo-${i + 1}`,
  agent_email: DEMO_AGENT,
  created_date: NOW,
  updated_date: NOW,
  created_by: DEMO_AGENT,
}));

export function seedById(id: string): Property | undefined {
  return SEED_PROPERTIES.find((p) => p.id === id);
}

export function seedCities(): string[] {
  return Array.from(new Set(SEED_PROPERTIES.map((p) => p.city))).sort();
}
