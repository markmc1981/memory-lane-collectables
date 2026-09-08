import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 auto-generates AGENTS.md / CLAUDE.md on dev start. This project
  // keeps its AI/dev guidance in MEMORYLANE_MASTER_PLAN.md and
  // MEMORYLANE_PROGRESS.md instead, so turn the generated files off.
  agentRules: false,
};

export default nextConfig;
