/**
 * Shared shapes for every AI provider. Providers (claude, openai, gemini,
 * mock) implement these; the rest of the app only ever sees these types,
 * never a vendor SDK. See MEMORYLANE_MASTER_PLAN.md §7.
 */

/** How sure the model is, in words. Drives the badge on every AI value. */
export type ConfidenceLabel =
  | "high" // "High confidence"
  | "likely" // "Likely"
  | "possible" // "Possible match"
  | "review"; // "Needs expert review"

export function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= 0.85) return "high";
  if (score >= 0.65) return "likely";
  if (score >= 0.4) return "possible";
  return "review";
}

export const CONFIDENCE_TEXT: Record<ConfidenceLabel, string> = {
  high: "High confidence",
  likely: "Likely",
  possible: "Possible match",
  review: "Needs expert review",
};

/**
 * Risk flags float an item up the review queue. The platform never *certifies*
 * anything (precious metal, authenticity, attribution) — these just say
 * "a person should look closely".
 */
export type RiskFlag =
  | "possible_high_value"
  | "possible_precious_metal"
  | "possible_designer"
  | "possible_signed_artwork"
  | "possible_antique"
  | "possible_collectable_watch"
  | "hallmark_detected"
  | "identification_uncertain";

export const RISK_FLAG_TEXT: Record<RiskFlag, string> = {
  possible_high_value: "Possible high value",
  possible_precious_metal: "Possible precious metal",
  possible_designer: "Possible designer item",
  possible_signed_artwork: "Possible signed artwork",
  possible_antique: "Possible antique",
  possible_collectable_watch: "Possible collectable watch",
  hallmark_detected: "Hallmark detected",
  identification_uncertain: "Identification uncertain",
};

/** One object the model believes it can see in a photo or video frame. */
export type DetectedObject = {
  /** Short human description, e.g. "Mid-century teak sideboard". */
  label: string;
  /** Best-guess storefront category, or null. */
  categoryGuess: string | null;
  /** 0..1. */
  confidence: number;
  /** How many of this item (a matched set becomes one candidate, qty 6). */
  quantity: number;
  /** Normalised box {x,y,w,h} in 0..1, or null if the provider can't. */
  boundingBox: { x: number; y: number; w: number; h: number } | null;
  riskFlags: RiskFlag[];
  /** Rough asking price the model would suggest, GBP, or null. */
  suggestedAskingPrice: number | null;
  /** Index of the source photo in the input array. */
  sourcePhotoIndex: number;
};

export type DetectionResult = {
  provider: string;
  model: string;
  promptVersion: string;
  objects: DetectedObject[];
  /** Provider cost for this call in pence, if known. */
  costPence: number | null;
};

/** A photo handed to a provider: a signed URL plus its DB id. */
export type PhotoInput = {
  mediaId: string;
  url: string;
};

/**
 * A deep look at a SINGLE item — run after detection, on the item's own
 * photos (and any close-ups of marks/labels). Every field is a best guess
 * or null; nothing here is asserted as fact.
 */
export type Identification = {
  category: string | null;
  itemType: string | null;
  brand: string | null;
  maker: string | null;
  model: string | null;
  era: string | null;
  approximateAge: string | null;
  material: string | null;
  colour: string | null;
  style: string | null;
  countryOfOrigin: string | null;
  visibleMarkings: string | null;
  condition: string | null;
  notableDefects: string | null;
  collectability: string | null;
  possibleSearchTerms: string[];
  /** One or two sentences a person can read. Hedged where uncertain. */
  summary: string;
  confidence: number;
  riskFlags: RiskFlag[];
};

export type IdentificationResult = {
  provider: string;
  model: string;
  promptVersion: string;
  identification: Identification;
  costPence: number | null;
};

export interface VisionProvider {
  readonly name: string;
  /** Find the individual saleable objects across a set of photos. */
  detectObjects(photos: PhotoInput[]): Promise<DetectionResult>;
  /**
   * Identify one item in depth. `hint` is the detection label / anything the
   * staff member has already typed. `markPhotos` are close-ups of hallmarks,
   * signatures, labels, stamps.
   */
  identifyItem(
    photos: PhotoInput[],
    hint: string | null,
    markPhotos?: PhotoInput[]
  ): Promise<IdentificationResult>;
}
