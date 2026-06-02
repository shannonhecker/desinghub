/**
 * sampleImages — a curated, HTTP-200-verified library of stock imagery for
 * populating builder templates and previews with realistic, non-lorem visuals.
 *
 * Every entry was curl-verified to return 200 from its source (Pexels,
 * Unsplash, or Pravatar). Use `getImagesByCategory` to pull a themed set, or
 * `pickImage` to resolve a template slot name (hero, product, feature-1..3,
 * testimonial, background) to a sensible default image.
 *
 * Sources are free-to-use under their respective licenses (Pexels License,
 * Unsplash License, Pravatar). Keep URLs intact — the width/quality query
 * params are part of the verified request.
 */

export type SampleImageCategory =
  | "product-ui"
  | "people"
  | "office-business"
  | "nature-lifestyle"
  | "abstract-texture";

export type SampleImageAspect = "landscape" | "portrait" | "square";

export type SampleImageSource = "pexels" | "unsplash" | "pravatar";

export interface SampleImage {
  /** Stable kebab-case id, unique across the whole library. */
  id: string;
  url: string;
  alt: string;
  category: SampleImageCategory;
  aspect: SampleImageAspect;
  source: SampleImageSource;
}

/** Ordered list of every category, for menus / filters. */
export const SAMPLE_IMAGE_CATEGORIES: SampleImageCategory[] = [
  "product-ui",
  "people",
  "office-business",
  "nature-lifestyle",
  "abstract-texture",
];

/**
 * Template slot names a layout can request. `pickImage` maps each to a
 * sensible default image id below.
 */
export type ImageSlot =
  | "hero"
  | "product"
  | "feature-1"
  | "feature-2"
  | "feature-3"
  | "testimonial"
  | "background";

export const SAMPLE_IMAGES: SampleImage[] = [
  // ── product-ui ──────────────────────────────────────────────────────────
  {
    id: "product-ui-laptop-code-dark",
    url: "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Open laptop on a desk displaying code on a dark screen in a clean modern workspace",
    category: "product-ui",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "product-ui-colorful-code-monitor",
    url: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Close-up of colorful software code displayed on a computer monitor",
    category: "product-ui",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "product-ui-laptop-code-wooden-desk",
    url: "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Laptop showing lines of programming code on its screen on a wooden desk",
    category: "product-ui",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "product-ui-analytics-dashboard-laptop",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format&fit=crop",
    alt: "Laptop displaying an analytics dashboard with charts and graphs on a desk",
    category: "product-ui",
    aspect: "landscape",
    source: "unsplash",
  },
  {
    id: "product-ui-marketing-analytics-laptop",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80&auto=format&fit=crop",
    alt: "Marketing analytics data dashboard shown on a laptop screen beside a notebook",
    category: "product-ui",
    aspect: "landscape",
    source: "unsplash",
  },
  {
    id: "product-ui-imac-app-interface",
    url: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1200&q=80&auto=format&fit=crop",
    alt: "iMac desktop computer displaying a clean app interface on a minimal desk",
    category: "product-ui",
    aspect: "landscape",
    source: "unsplash",
  },
  {
    id: "product-ui-wireframe-review",
    url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&q=80&auto=format&fit=crop",
    alt: "Designer reviewing a user interface wireframe and product layout on screen",
    category: "product-ui",
    aspect: "landscape",
    source: "unsplash",
  },

  // ── people ──────────────────────────────────────────────────────────────
  {
    id: "people-avatar-smiling-man",
    url: "https://i.pravatar.cc/240?img=12",
    alt: "Square avatar portrait of a smiling man, suitable for a CRM contact profile",
    category: "people",
    aspect: "square",
    source: "pravatar",
  },
  {
    id: "people-avatar-young-woman",
    url: "https://i.pravatar.cc/240?img=5",
    alt: "Square avatar portrait of a young woman with a friendly expression, for a contact list thumbnail",
    category: "people",
    aspect: "square",
    source: "pravatar",
  },
  {
    id: "people-avatar-bearded-man",
    url: "https://i.pravatar.cc/240?img=33",
    alt: "Square avatar portrait of a bearded man, ideal for a testimonial author photo",
    category: "people",
    aspect: "square",
    source: "pravatar",
  },
  {
    id: "people-avatar-dark-hair-woman",
    url: "https://i.pravatar.cc/240?img=47",
    alt: "Square avatar portrait of a woman with dark hair, for a CRM contact avatar",
    category: "people",
    aspect: "square",
    source: "pravatar",
  },
  {
    id: "people-headshot-man-light-shirt",
    url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Professional headshot of a smiling man in a light shirt against a neutral background",
    category: "people",
    aspect: "portrait",
    source: "pexels",
  },
  {
    id: "people-portrait-man-dark-jacket",
    url: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Portrait of a smiling man wearing a dark jacket, suitable for a customer testimonial",
    category: "people",
    aspect: "portrait",
    source: "pexels",
  },
  {
    id: "people-portrait-businesswoman",
    url: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Professional portrait of a confident businesswoman in formal attire",
    category: "people",
    aspect: "portrait",
    source: "pexels",
  },
  {
    id: "people-portrait-young-woman-outdoors",
    url: "https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Portrait of a smiling young woman outdoors, ideal for a testimonial profile photo",
    category: "people",
    aspect: "portrait",
    source: "pexels",
  },

  // ── office-business ─────────────────────────────────────────────────────
  {
    id: "office-business-team-meeting-table",
    url: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Diverse business team collaborating around a table during an office meeting, reviewing documents together",
    category: "office-business",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "office-business-colleagues-at-laptop",
    url: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Two colleagues working together at a laptop in a bright modern office workspace",
    category: "office-business",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "office-business-handshake-conference",
    url: "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Business professionals shaking hands at the end of a team meeting in a conference room",
    category: "office-business",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "office-business-open-plan-interior",
    url: "https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Open-plan office interior with empty desks, monitors, and ergonomic chairs in a corporate workspace",
    category: "office-business",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "office-business-minimal-workspace",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop",
    alt: "Modern minimalist office workspace with desks, chairs, and natural light through large windows",
    category: "office-business",
    aspect: "landscape",
    source: "unsplash",
  },
  {
    id: "office-business-planning-meeting",
    url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80&auto=format&fit=crop",
    alt: "Team of coworkers in a planning meeting around a desk with laptops and notes in a contemporary office",
    category: "office-business",
    aspect: "landscape",
    source: "unsplash",
  },

  // ── nature-lifestyle ────────────────────────────────────────────────────
  {
    id: "nature-lifestyle-misty-mountain-valley",
    url: "https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Misty green mountain valley with rolling hills under soft daylight",
    category: "nature-lifestyle",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "nature-lifestyle-ocean-golden-hour",
    url: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Ocean waves rolling onto a sandy beach at golden hour with a calm horizon",
    category: "nature-lifestyle",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "nature-lifestyle-mountain-ridges-haze",
    url: "https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Forested mountain ridges fading into layers of blue haze at dawn",
    category: "nature-lifestyle",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "nature-lifestyle-forest-path",
    url: "https://images.pexels.com/photos/210243/pexels-photo-210243.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Quiet forest path lined with tall trees and dappled sunlight",
    category: "nature-lifestyle",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "nature-lifestyle-city-skyline-dusk",
    url: "https://images.pexels.com/photos/325044/pexels-photo-325044.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "City skyline at dusk with illuminated skyscrapers reflected in a river",
    category: "nature-lifestyle",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "nature-lifestyle-traveler-cliff-sunrise",
    url: "https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Traveler standing on a cliff overlooking a vast mountain landscape at sunrise",
    category: "nature-lifestyle",
    aspect: "landscape",
    source: "pexels",
  },

  // ── abstract-texture ────────────────────────────────────────────────────
  {
    id: "abstract-texture-pastel-pink-blue-gradient",
    url: "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Smooth flowing abstract gradient in soft pastel pink and blue tones, ideal as a clean hero background",
    category: "abstract-texture",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "abstract-texture-purple-teal-liquid",
    url: "https://images.pexels.com/photos/3109807/pexels-photo-3109807.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Vivid abstract liquid swirl blending purple and teal hues, suitable for a colorful section fill",
    category: "abstract-texture",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "abstract-texture-muted-neutral-blur",
    url: "https://images.pexels.com/photos/1471122/pexels-photo-1471122.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Soft minimal blurred gradient texture in muted neutral tones for a subtle background",
    category: "abstract-texture",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "abstract-texture-marbled-ink-waves",
    url: "https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Marbled abstract pattern with swirling ink-like waves of color for a textured hero fill",
    category: "abstract-texture",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "abstract-texture-warm-orange-pink-gradient",
    url: "https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Warm abstract gradient blend of orange and pink tones, clean smooth background texture",
    category: "abstract-texture",
    aspect: "landscape",
    source: "pexels",
  },
  {
    id: "abstract-texture-cool-blue-white-bands",
    url: "https://images.pexels.com/photos/3137056/pexels-photo-3137056.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Cool-toned abstract fluid texture with flowing blue and white gradient bands",
    category: "abstract-texture",
    aspect: "landscape",
    source: "pexels",
  },
];

/** Fast id → image lookup, built once at module load. */
const IMAGE_BY_ID: Record<string, SampleImage> = Object.fromEntries(
  SAMPLE_IMAGES.map((img) => [img.id, img]),
);

/** Return every image in a category, in declared order. */
export function getImagesByCategory(
  category: SampleImageCategory,
): SampleImage[] {
  return SAMPLE_IMAGES.filter((img) => img.category === category);
}

/** Look an image up by its stable id. Returns `undefined` if not found. */
export function getImageById(id: string): SampleImage | undefined {
  return IMAGE_BY_ID[id];
}

/**
 * Default image id for each template slot. Chosen for fit:
 * - hero/background → abstract texture (clean, copy-safe backdrop)
 * - product → product-ui (a real-looking app/dashboard screen)
 * - feature-1..3 → office/business scenes (varied, human, on-brand)
 * - testimonial → a portrait headshot
 */
const SLOT_DEFAULTS: Record<ImageSlot, string> = {
  hero: "abstract-texture-pastel-pink-blue-gradient",
  product: "product-ui-analytics-dashboard-laptop",
  "feature-1": "office-business-team-meeting-table",
  "feature-2": "office-business-colleagues-at-laptop",
  "feature-3": "office-business-planning-meeting",
  testimonial: "people-portrait-businesswoman",
  background: "abstract-texture-muted-neutral-blur",
};

/**
 * Resolve a template slot to a sensible default image. Always returns a real
 * image (falls back to the first entry if a default id is ever missing).
 */
export function pickImage(slot: ImageSlot): SampleImage {
  return getImageById(SLOT_DEFAULTS[slot]) ?? SAMPLE_IMAGES[0];
}
