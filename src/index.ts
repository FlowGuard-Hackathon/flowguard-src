// Punto de entrada público del paquete, para que otros repos (flowguard-app)
// lo consuman como "flowguard-src" (dependencia local file:../flowguard-src,
// resuelta contra dist/, ver package.json -> scripts.build y .main/.exports).

export { crearEjecucion, type DatosPago, type ResultadoCrearEjecucion } from "./servidor/ejecuciones/crearEjecucion.js";
export { investigarEjecucion } from "./servidor/ejecuciones/investigarEjecucion.js";
export { FuenteDatosMemoria, type InformeAgenteAlmacenado } from "./servidor/persistencia/fuenteDatosMemoria.js";
export { evaluarPago } from "./servidor/reglas/motor.js";
export type {
  ContextoConfiable,
  Decision,
  DecisionMotor,
  EstadoRegla,
  InstantaneaPolitica,
  ReglaId,
  ResultadoRegla,
  SolicitudPago,
} from "./servidor/reglas/tipos.js";
export type { ResultadoInvestigacion } from "./servidor/agente/tipos.js";

// Herramientas de lectura: tipos de los registros que consumen los endpoints
// de listado/detalle/evidencias del frontend (no solo el agente).
export { crearHerramientasLectura } from "./servidor/herramientas/index.js";
export type {
  EstadoInvestigacion,
  RegistroContextoPago,
  RegistroDetalleRegla,
  RegistroEjecucion,
  RegistroEvidencia,
  RegistroResultadoRegla,
} from "./servidor/herramientas/tipos.js";
export type { InformeEvidencias } from "./contratos/informe-evidencias.schema.js";
