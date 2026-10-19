// Punto de entrada público del paquete, para que otros repos (flowguard-app)
// lo consuman como "flowguard-src" sin importar rutas internas sueltas.
// Mientras no exista un paso de build (tsc), flowguard-app debe transpilar
// este paquete directamente (ver next.config.ts -> transpilePackages).

export { crearEjecucion, type DatosPago, type ResultadoCrearEjecucion } from "./servidor/ejecuciones/crearEjecucion.js";
export { investigarEjecucion } from "./servidor/ejecuciones/investigarEjecucion.js";
export { FuenteDatosMemoria } from "./servidor/persistencia/fuenteDatosMemoria.js";
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
