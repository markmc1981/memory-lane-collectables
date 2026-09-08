import { optionalEnv } from "@/lib/config";
import { MockVisionProvider } from "./mock";
import type { VisionProvider } from "./types";

export * from "./types";

/**
 * Resolves the configured vision provider. Falls back to the mock provider
 * whenever the chosen real provider has no API key — so the workflow always
 * runs, it just tells you (in the UI) that identification is simulated.
 */
export function getVisionProvider(): {
  provider: VisionProvider;
  isMock: boolean;
} {
  const choice = (optionalEnv("AI_VISION_PROVIDER") ?? "mock").toLowerCase();

  switch (choice) {
    case "claude": {
      if (!optionalEnv("ANTHROPIC_API_KEY")) break;
      // Real Claude vision adapter lands in Phase 3. Until then, mock.
      break;
    }
    case "openai":
    case "gemini":
      // Not implemented yet.
      break;
  }

  return { provider: new MockVisionProvider(), isMock: true };
}
