import type {
  DetectedObject,
  DetectionResult,
  PhotoInput,
  VisionProvider,
} from "./types";

/**
 * The mock vision provider. Returns believable Memory Lane detections so the
 * whole clearance -> review -> product workflow runs with **no API keys**.
 *
 * This is a deliberately separate adapter — it must never be wired into a
 * production identification path. `AI_VISION_PROVIDER=mock` (the default
 * until an Anthropic key is set) selects it.
 */

// A pool of plausible house-clearance finds, roughly weighted towards the
// common stuff with the odd better piece. Prices are ballpark GBP.
const POOL: Omit<DetectedObject, "sourcePhotoIndex">[] = [
  {
    label: "Mid-century teak sideboard",
    categoryGuess: "Vintage Furniture",
    confidence: 0.86,
    quantity: 1,
    boundingBox: { x: 0.08, y: 0.35, w: 0.6, h: 0.4 },
    riskFlags: ["possible_designer"],
    suggestedAskingPrice: 245,
  },
  {
    label: "Set of 4 spindle-back dining chairs",
    categoryGuess: "Vintage Furniture",
    confidence: 0.78,
    quantity: 4,
    boundingBox: { x: 0.4, y: 0.3, w: 0.45, h: 0.55 },
    riskFlags: [],
    suggestedAskingPrice: 160,
  },
  {
    label: "Brass mantel clock",
    categoryGuess: "Lighting & Clocks",
    confidence: 0.72,
    quantity: 1,
    boundingBox: { x: 0.55, y: 0.1, w: 0.2, h: 0.2 },
    riskFlags: ["possible_antique"],
    suggestedAskingPrice: 55,
  },
  {
    label: "Capodimonte-style porcelain figurine",
    categoryGuess: "Ceramics & Glass",
    confidence: 0.51,
    quantity: 1,
    boundingBox: { x: 0.3, y: 0.55, w: 0.12, h: 0.22 },
    riskFlags: ["identification_uncertain"],
    suggestedAskingPrice: 40,
  },
  {
    label: "Blue studio pottery vase",
    categoryGuess: "Ceramics & Glass",
    confidence: 0.63,
    quantity: 1,
    boundingBox: { x: 0.2, y: 0.4, w: 0.1, h: 0.2 },
    riskFlags: [],
    suggestedAskingPrice: 28,
  },
  {
    label: "Framed watercolour landscape",
    categoryGuess: "Art & Prints",
    confidence: 0.58,
    quantity: 1,
    boundingBox: { x: 0.05, y: 0.05, w: 0.3, h: 0.35 },
    riskFlags: ["possible_signed_artwork"],
    suggestedAskingPrice: 65,
  },
  {
    label: "Anglepoise-style desk lamp",
    categoryGuess: "Lighting & Clocks",
    confidence: 0.81,
    quantity: 1,
    boundingBox: { x: 0.7, y: 0.4, w: 0.18, h: 0.35 },
    riskFlags: [],
    suggestedAskingPrice: 48,
  },
  {
    label: "Box of vintage vinyl LPs",
    categoryGuess: "Books & Media",
    confidence: 0.69,
    quantity: 1,
    boundingBox: { x: 0.1, y: 0.7, w: 0.25, h: 0.2 },
    riskFlags: [],
    suggestedAskingPrice: 35,
  },
  {
    label: "Wristwatch, possibly Swiss, in a drawer",
    categoryGuess: "Watches & Jewellery",
    confidence: 0.38,
    quantity: 1,
    boundingBox: { x: 0.45, y: 0.6, w: 0.06, h: 0.06 },
    riskFlags: ["possible_high_value", "identification_uncertain"],
    suggestedAskingPrice: null,
  },
  {
    label: "Pair of upholstered footstools",
    categoryGuess: "Vintage Furniture",
    confidence: 0.74,
    quantity: 2,
    boundingBox: { x: 0.25, y: 0.6, w: 0.4, h: 0.2 },
    riskFlags: [],
    suggestedAskingPrice: 70,
  },
];

/** Deterministic-ish pick so the same photos give the same result on re-run. */
function pickForPhotos(photos: PhotoInput[]): DetectedObject[] {
  const seed = photos.reduce(
    (acc, p) => acc + p.mediaId.split("").reduce((s, c) => s + c.charCodeAt(0), 0),
    0
  );
  const out: DetectedObject[] = [];
  // 2–4 detections per photo, drawn from the pool without immediate repeats.
  photos.forEach((_, photoIndex) => {
    const count = 2 + ((seed + photoIndex) % 3);
    for (let i = 0; i < count; i++) {
      const item = POOL[(seed + photoIndex * 5 + i * 3) % POOL.length];
      out.push({ ...item, sourcePhotoIndex: photoIndex });
    }
  });
  return out;
}

export class MockVisionProvider implements VisionProvider {
  readonly name = "mock";

  async detectObjects(photos: PhotoInput[]): Promise<DetectionResult> {
    // A touch of latency so the UI's processing state is visible.
    await new Promise((r) => setTimeout(r, 600));

    return {
      provider: "mock",
      model: "mock-vision-1",
      promptVersion: "mock/2026-09-08",
      objects: photos.length === 0 ? [] : pickForPhotos(photos),
      costPence: 0,
    };
  }
}
