import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { optionalEnv } from "@/lib/config";
import type {
  DetectedObject,
  DetectionResult,
  Identification,
  IdentificationResult,
  ListingDraftResult,
  PhotoInput,
  RiskFlag,
  VisionProvider,
} from "../types";

// Sonnet 5 by default — fast + cheap, and plenty for "what is this and what's
// it worth". Set AI_VISION_MODEL=claude-opus-5 for maximum accuracy on tricky
// or high-value items (slower, ~5x the cost).
const MODEL = optionalEnv("AI_VISION_MODEL") ?? "claude-sonnet-5";
const PROMPT_VERSION = "claude-detect/2026-09-09";

// $ per 1M tokens for the default model. Opus 5 is 5 / 25.
const PRICE = MODEL.includes("opus")
  ? { inPerM: 5, outPerM: 25 }
  : { inPerM: 2, outPerM: 10 };

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

const SYSTEM_MULTI = `You identify individual saleable objects in photographs taken during a house clearance in Scotland, for a vintage/antiques resale business.

Rules:
- List each DISTINCT object once. If the same object appears in several photos, list it once, citing the clearest photo.
- Group identical matched sets into one entry with a quantity (six matching chairs = one entry, quantity 6).
- Only describe what is visibly there. Never invent a brand, maker, age or material you cannot see evidence for. If you are guessing, say so in the label and lower the confidence.
- Ignore fixtures, rubbish, and things with no resale value (built-in kitchens, radiators, bin bags, obvious junk).
- Flag — never certify — anything that could be valuable, precious metal, designer, signed, antique, or a collectable watch, and anything you are unsure about.
- Prices are rough UK resale asking prices in GBP, conservative, or null.`;

const SYSTEM_SINGLE = `These photographs are ALL of a SINGLE item that a Scottish vintage/antiques reseller wants to list for sale.

Return EXACTLY ONE object: the main item being photographed. Ignore everything else — background furniture, other objects in the room, the floor, the wall. If several photos show the same item from different angles, that is still one object.

Rules:
- Describe only what is visibly there. Never invent a brand, maker, age or material without visible evidence. If guessing, say so and lower the confidence.
- If it is clearly a matched set (e.g. a pair of lamps, six chairs) photographed together as the item for sale, set quantity accordingly.
- Flag — never certify — anything that could be valuable, precious metal, designer, signed, antique, or a collectable watch, and anything you are unsure about.
- Price is a rough, conservative UK resale asking price in GBP, or null.`;

const IdentificationSchema = z.object({
  category: z.string().nullable(),
  itemType: z.string().nullable().describe("What kind of thing it is."),
  brand: z.string().nullable(),
  maker: z.string().nullable(),
  model: z.string().nullable(),
  era: z.string().nullable().describe("e.g. '1960s', 'Victorian'."),
  approximateAge: z.string().nullable().describe("e.g. '50–70 years'."),
  material: z.string().nullable(),
  colour: z.string().nullable(),
  style: z.string().nullable(),
  countryOfOrigin: z.string().nullable(),
  visibleMarkings: z
    .string()
    .nullable()
    .describe("Any hallmarks, signatures, labels, stamps, numbers you can read."),
  condition: z.string().nullable().describe("Honest condition summary."),
  notableDefects: z.string().nullable().describe("Damage, wear, repairs, losses."),
  collectability: z.string().nullable(),
  possibleSearchTerms: z.array(z.string()),
  suggestedAskingPrice: z
    .number()
    .nullable()
    .describe("Rough, conservative UK resale asking price in GBP, or null."),
  summary: z
    .string()
    .describe(
      "One or two plain sentences a non-expert can read. Hedge where you are not sure. Never state a maker/age/material as fact without visible evidence."
    ),
  confidence: z.number().min(0).max(1),
  riskFlags: z.array(z.enum(RISK_FLAGS as [RiskFlag, ...RiskFlag[]])),
});

const IDENTIFY_SYSTEM = `You are identifying a single second-hand item for a UK vintage/antiques resale business, from photographs.

Rules:
- Report only what the photos support. If you cannot see a maker's mark, do not name a maker. If you are inferring era from style, say "likely" and lower confidence.
- Read any visible text, hallmarks, signatures, labels, stamps, or numbers and put them in visibleMarkings verbatim where you can.
- Be honest and specific about condition and defects — this is for resale, buyers rely on it.
- Flag (never certify) precious metal, designer, signed artwork, antique, collectable watch, hallmarks, or your own uncertainty.
- possibleSearchTerms: 3–6 phrases someone would type to find comparable sold items.`;

const ListingSchema = z.object({
  title: z
    .string()
    .describe(
      "Elegant storefront title: brand/maker + item + style + a key word. No ALL CAPS, no marketing fluff."
    ),
  description: z
    .string()
    .describe(
      "2–4 short paragraphs. Warm but honest. Plain-English overview, then the concrete details (maker/era/material/dimensions if known), then condition stated frankly, then a line on delivery/collection. Never state a fact not supported by the identification. Do not invent measurements."
    ),
});

const LISTING_SYSTEM = `You write product listings for Memory Lane Collectables, a Scottish shop selling vintage and collectable items found during house clearances.

Voice: calm, warm, a little editorial. Not salesy, no hype, no exclamation marks. British English.
- Only use facts from the identification provided. If the maker/era/material is a guess, phrase it as "likely" or "in the style of".
- Be honest about condition — buyers rely on it. If condition wasn't assessed, say condition is available on request.
- End with a short line: "Available for collection near Airdrie or by courier."
- Do not invent dimensions or provenance.`;

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

  async detectObjects(
    photos: PhotoInput[],
    mode: "single" | "multi" = "single"
  ): Promise<DetectionResult> {
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
      text:
        mode === "single"
          ? "Identify the single item these photos are of."
          : "Identify every distinct saleable object across these photos.",
    });

    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: mode === "single" ? 3000 : 8000,
      thinking: { type: "adaptive" },
      system: mode === "single" ? SYSTEM_SINGLE : SYSTEM_MULTI,
      messages: [{ role: "user", content }],
      output_config: { format: zodOutputFormat(DetectionSchema) },
    });

    const parsed = response.parsed_output;
    let objects = (parsed?.objects ?? []).map((o) =>
      toDetected(o, photos.length)
    );
    if (mode === "single") objects = objects.slice(0, 1);

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

  async identifyItem(
    photos: PhotoInput[],
    hint: string | null,
    markPhotos: PhotoInput[] = []
  ): Promise<IdentificationResult> {
    const content: Anthropic.ContentBlockParam[] = [];
    photos.forEach((p) => {
      content.push({ type: "image", source: { type: "url", url: p.url } });
    });
    markPhotos.forEach((p) => {
      content.push({
        type: "text",
        text: "Close-up of a mark / label / signature:",
      });
      content.push({ type: "image", source: { type: "url", url: p.url } });
    });
    content.push({
      type: "text",
      text: hint
        ? `Identify this item. Staff note: "${hint}".`
        : "Identify this item.",
    });

    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: 6000,
      thinking: { type: "adaptive" },
      system: IDENTIFY_SYSTEM,
      messages: [{ role: "user", content }],
      output_config: { format: zodOutputFormat(IdentificationSchema) },
    });

    const p = response.parsed_output;
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
      costPence,
      identification: {
        category: p?.category ?? null,
        itemType: p?.itemType ?? null,
        brand: p?.brand ?? null,
        maker: p?.maker ?? null,
        model: p?.model ?? null,
        era: p?.era ?? null,
        approximateAge: p?.approximateAge ?? null,
        material: p?.material ?? null,
        colour: p?.colour ?? null,
        style: p?.style ?? null,
        countryOfOrigin: p?.countryOfOrigin ?? null,
        visibleMarkings: p?.visibleMarkings ?? null,
        condition: p?.condition ?? null,
        notableDefects: p?.notableDefects ?? null,
        collectability: p?.collectability ?? null,
        possibleSearchTerms: p?.possibleSearchTerms ?? [],
        suggestedAskingPrice: p?.suggestedAskingPrice ?? null,
        summary: p?.summary ?? "No identification returned.",
        confidence: p?.confidence ?? 0,
        riskFlags: p?.riskFlags ?? [],
      },
    };
  }

  async writeListing(input: {
    label: string;
    identification: Identification | null;
    askingPrice: number | null;
  }): Promise<ListingDraftResult> {
    const facts = input.identification
      ? JSON.stringify(input.identification, null, 2)
      : "(no detailed identification was run — work from the label only, and keep claims minimal)";

    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      system: LISTING_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Item label: ${input.label}
Asking price: ${input.askingPrice != null ? `£${input.askingPrice}` : "not set"}

Identification:
${facts}

Write the storefront listing.`,
        },
      ],
      output_config: { format: zodOutputFormat(ListingSchema) },
    });

    const p = response.parsed_output;
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
      costPence,
      draft: {
        title: p?.title ?? input.label,
        description: p?.description ?? "",
      },
    };
  }
}
