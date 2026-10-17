import { mensajesEs, type Mensajes } from "./es.js";

export type { Mensajes };

// Hoy solo hay español. Para agregar otro idioma: crea en.ts que cumpla `Mensajes`
// y elige aquí cuál se exporta (p. ej. con una variable de entorno).
export const mensajes: Mensajes = mensajesEs;
