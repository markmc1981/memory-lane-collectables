import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { optionalEnv } from "@/lib/config";
import type {
  DetectedObject,
  DetectionResult,
  PhotoInput,
  RiskFlag,
  VisionProvider,
} from "../types";

const MODEL = optionalEnv("AI_VISION_MODEL") ?? "claude-opus-5";
const PROMPT_VERSION = "claude-detect/2026-09-08";

// Opus 5 pricing, $ per 1M tokens. Override if AI_VISION_MODEL is changed.
const PRICE = { inPerM: 5, outPerM: 25 };

const RISK_FLAGS: RiskFlag[] = [
  "possible_high_value",
  "possible_precious_metal",
  "possible_designer",
  "possible_signed_artwork",
  "possible_antique",
  "possible_collectable_watch",
  "hallmark_detected",
  "identification_uncertain",
];

const DetectionSchema = z.object({
  objects: z
    .array(
      z.object({
        label: z
          .string()
          .describe(
            "Short, specific description — e.g. 'Mid-century teak sideboard', 'Brass carriage clock'. What you can see, not what you assume."
          ),
        photoNumber: z
          .number()
          .int()
          .describe("1-based index of the photo this object appears in."),
        categoryGuess: z
          .string()
          .nullable()
          .describe(
            "Best-fit storefront category or null: Vintage Furniture, Collectables, Watches & Jewellery, Ceramics & Glass, Art & Prints, Toys & Games, Books & Media, Lighting & Clocks."
          ),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe("How sure you are this is a distinct, saleable object."),
        quantity: z
          .number()
          .int()
          .min(1)
          .describe(
            "How many of this exact item are visible as a matched set (e.g. 6 identical dining chairs -> 6). Otherwise 1."
          ),
        riskFlags: z
          .array(z.enum(RISK_FLAGS as [RiskFlag, ...RiskFlag[]]))
          .describe(
            "Flags that mean a person should look closely. Never certify — only flag. Use 'identification_uncertain' whenever confidence is low."
          ),
        suggestedAskingPrice: z
          .number()
          .nullable()
          .describe(
            "A rough UK resale asking price in GBP if you can reasonably estimate one, else null. Conservative."
          ),
      })
    )
    .describe("Every distinct saleable object across all the photos."),
});

const SYSTEM = `You identify individual saleable objects in photographs taken during a house clearance in Scotland, for a vintage/antiques resale business.

Rules:
- List each DISTINCT object once. If the same object appears in several photos, list it once, citing the clearest photo.
- Group identical matched sets into one entry with a quantity (six matching chairs = one entry, quantity 6).
- Only describe what is visibly there. Never invent a brand, maker, age or material you cannot see evidence for. If you are guessing, say so in the label and lower the confidence.
- Ignore fixtures, rubbish, and things with no resale value (built-in kitchens, radiators, bin bags, obvious junk).
- Flag — never certify — anything that could be valuable, precious metal, designer, signed, antique, or a collectable watch, and anything you are unsure about.
- Prices are rough UK resale asking prices in GBP, conservative, or null.`;

function toDetected(
  raw: z.infer<typeof DetectionSchema>["objects"][number],
  photoCount: number
): DetectedObject {
  const idx = Math.min(Math.max(raw.photoNumber - 1, 0), photoCount - 1);
  return {
    label: raw.label,
    categoryGuess: raw.categoryGuess,
    confidence: raw.confidence,
    quantity: raw.quantity,
    boundingBox: null, // structured detection doesn't return boxes yet
    riskFlags: raw.riskFlags,
    suggestedAskingPrice: raw.suggestedAskingPrice,
    sourcePhotoIndex: idx,
  };
}

export class ClaudeVisionProvider implements VisionProvider {
  readonly name = "claude";
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async detectObjects(photos: PhotoInput[]): Promise<DetectionResult> {
    if (photos.length === 0) {
      return {
        provider: this.name,
        model: MODEL,
        promptVersion: PROMPT_VERSION,
        objects: [],
        costPence: 0,
      };
    }

    const content: Anthropic.ContentBlockParam[] = [];
    photos.forEach((p, i) => {
      content.push({ type: "text", text: `Photo ${i + 1}:` });
      content.push({ type: "image", source: { type: "url", url: p.url } });
    });
    content.push({
      type: "text",
      text: "Identify every distinct saleable object across these photos.",
    });

    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      messages: [{ role: "user", content }],
      output_config: { format: zodOutputFormat(DetectionSchema) },
    });

    const parsed = response.parsed_output;
    const objects = (parsed?.objects ?? []).map((o) =>
      toDetected(o, photos.length)
    );

    const u = response.usage;
    const inTokens =
      (u.input_tokens ?? 0) +
      (u.cache_read_input_tokens ?? 0) +
      (u.cache_creation_input_tokens ?? 0);
    const costPence = Math.round(
      ((inTokens * PRICE.inPerM + (u.output_tokens ?? 0) * PRICE.outPerM) /
        1_000_000) *
        100
    );

    return {
      provider: this.name,
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      objects,
      costPence,
    };
  }
}
