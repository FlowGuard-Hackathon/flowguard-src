import { mensajes } from "../../mensajes/index.js";

// seguridad.md § 1.6. El prompt no es un control de seguridad: la autoridad real
// la ponen los permisos del backend, el esquema y validarInforme.
export const VERSION_PROMPT_AGENTE = "flowguard-investigator-v1";

export const PROMPT_SISTEMA_AGENTE = mensajes.agente.promptSistema;
