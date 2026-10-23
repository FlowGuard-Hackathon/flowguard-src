import { crearProveedorAgente } from "../agente/index.js";
import type { ResultadoInvestigacion } from "../agente/tipos.js";
import { crearHerramientasLectura } from "../herramientas/index.js";
import type { FuenteDatosEjecuciones } from "../persistencia/fuenteDatosMemoria.js";
import type { ResultadoCrearEjecucion } from "./crearEjecucion.js";

// Aquí es donde el backend de Dev 1 "manda llamar" a la parte de Dev 3: una vez
// persistida la decisión (crearEjecucion.ts), se arma la entrada mínima del
// agente (seguridad.md § 1.1) y se invoca el proveedor configurado
// (AGENTE_PROVEEDOR=simulado por defecto), pasándole las herramientas de
// lectura ya conectadas a la ejecución real recién guardada.
export async function investigarEjecucion(
  fuente: FuenteDatosEjecuciones,
  resultado: ResultadoCrearEjecucion,
): Promise<ResultadoInvestigacion> {
  // Las herramientas de lectura se crean aquí para dejar constancia del punto
  // de integración; el proveedor simulado de Dev 3 (día 1-3) todavía no las
  // invoca él mismo (eso llega con tool calling real, día 7-9), pero ya quedan
  // conectadas a datos reales en vez de a FuenteDatosEnMemoria con datos simulados.
  crearHerramientasLectura(fuente);

  const agente = crearProveedorAgente();
  const investigacion = await agente.investigar({
    ejecucionId: resultado.ejecucion_id,
    decision: resultado.decision,
    infracciones: resultado.resultados.map((r) => ({ regla_id: r.regla_id, resultado: r.estado })),
  });

  // Persiste el resultado y actualiza estado_investigacion (database.md § 2):
  // lo hace el orquestador, nunca el modelo. Un FALLIDA no persiste informe
  // (seguridad.md § 1.7: un informe que no valida no se guarda como COMPLETADA/PARCIAL).
  await fuente.guardarInformeAgente(resultado.ejecucion_id, {
    intento_id: investigacion.estado === "FALLIDA" ? `INT-FALLIDO-${Date.now()}` : investigacion.informe.intento_id,
    estado: investigacion.estado,
    informe: investigacion.estado === "FALLIDA" ? null : investigacion.informe,
  });

  return investigacion;
}
