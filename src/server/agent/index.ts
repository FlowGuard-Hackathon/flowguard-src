import { MockAgentProvider } from "./mockProvider.js";
import { NebiusAgentProvider } from "./nebiusProvider.js";
import type { AgentProvider } from "./types.js";

export * from "./types.js";
export * from "./validateReport.js";
export { AGENT_PROMPT_VERSION, AGENT_SYSTEM_PROMPT } from "./prompt.js";

// Selección de proveedor por variable de entorno (ver .env.example).
// AGENT_PROVIDER=mock (por defecto) hasta que la checklist de Nebius
// (flowguard-docs/security.md § 1.8) esté confirmada.
export function createAgentProvider(): AgentProvider {
  const provider = process.env.AGENT_PROVIDER ?? "mock";
  switch (provider) {
    case "mock":
      return new MockAgentProvider();
    case "nebius":
      return new NebiusAgentProvider();
    default:
      throw new Error(`AGENT_PROVIDER desconocido: ${provider}`);
  }
}
