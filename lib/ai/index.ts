import "server-only";
import { optionalEnv } from "@/lib/config";
import { MockVisionProvider } from "./mock";
import { ClaudeVisionProvider } from "./providers/claude";
import type { VisionProvider } from "./types";

export * from "./types";

/**
 * Resolves the configured vision provider. Falls back to the mock provider
 * whenever the chosen real provider has no API key — so the workflow always
 * runs; the UI just shows that identification is simulated.
 *
 * Server-only: the Anthropic SDK and the API key must never reach the browser.
 */
export function getVisionProvider(): {
  provider: VisionProvider;
  isMock: boolean;
} {
  const choice = (optionalEnv("AI_VISION_PROVIDER") ?? "claude").toLowerCase();
  const anthropicKey = optionalEnv("ANTHROPIC_API_KEY");

  if ((choice === "claude" || choice === "mock") && anthropicKey) {
    return { provider: new ClaudeVisionProvider(anthropicKey), isMock: false };
  }

  // openai / gemini adapters not implemented yet — fall through to mock.
  return { provider: new MockVisionProvider(), isMock: true };
}
