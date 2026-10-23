import { mensajes } from "../../mensajes/index.js";
import type { InformeEvidencias } from "../../contratos/informe-evidencias.schema.js";
import type {
  EstadoInvestigacion,
  FuenteDatosHerramientas,
  RegistroContextoPago,
  RegistroDetalleRegla,
  RegistroEjecucion,
  RegistroEvidencia,
  RegistroResultadoRegla,
  ReglaId,
} from "../herramientas/tipos.js";

// Informe persistido de una investigación, forma de informe_agente en
// contratos-api.md § 6 (GET /ejecuciones/:id/evidencias).
export type InformeAgenteAlmacenado = {
  intento_id: string;
  estado: EstadoInvestigacion;
  informe: InformeEvidencias | null;
};

// Implementación de FuenteDatosHerramientas (servidor/herramientas/tipos.ts,
// puesto 3) a cargo del puesto 1. Esta es una implementación EN MEMORIA, no
// contra Supabase real: sustituye temporalmente a una futura
// FuenteDatosSupabase mientras no haya proyecto Supabase ni respuestas a las
// "Preguntas abiertas para Dev 1" de servidor/herramientas/README.md.
// El rol de solo lectura que pide ese README se modela aquí como una interfaz
// separada (FuenteDatosHerramientas) de los métodos de escritura de esta
// clase: nada fuera de servidor/ejecuciones/ debería llamar a los métodos de
// escritura.

export type EjecucionAlmacenada = {
  ejecucion: RegistroEjecucion;
  reglas: RegistroResultadoRegla[];
  evidencias: RegistroEvidencia[];
  contextoPago: RegistroContextoPago;
  informeAgente?: InformeAgenteAlmacenado;
};

export class FuenteDatosMemoria implements FuenteDatosHerramientas {
  private readonly ejecuciones = new Map<string, EjecucionAlmacenada>();
  private readonly reglasPolitica = new Map<ReglaId, RegistroDetalleRegla>();

  // --- Escritura: solo la usa servidor/ejecuciones/ al persistir una decisión ---

  guardarEjecucion(datos: EjecucionAlmacenada): void {
    const id = datos.ejecucion.ejecucion_id;
    if (this.ejecuciones.has(id)) {
      throw new Error(mensajes.ejecuciones.errores.ejecucionDuplicada(id));
    }
    this.ejecuciones.set(id, structuredClone(datos));
  }

  definirReglaPolitica(detalle: RegistroDetalleRegla): void {
    this.reglasPolitica.set(detalle.regla_id, structuredClone(detalle));
  }

  // Guarda el resultado de investigarEjecucion() y actualiza estado_investigacion
  // en la ejecución (database.md § 2: lo cambia exclusivamente el worker/orquestador,
  // nunca el modelo directamente). Silenciosamente no hace nada si la ejecución
  // ya no existe (no debería pasar en memoria, pero sí podría con Supabase real).
  guardarInformeAgente(ejecucionId: string, informe: InformeAgenteAlmacenado): void {
    const encontrada = this.ejecuciones.get(ejecucionId);
    if (!encontrada) return;
    encontrada.informeAgente = structuredClone(informe);
    encontrada.ejecucion = { ...encontrada.ejecucion, estado_investigacion: informe.estado };
  }

  // --- Lectura: esta parte es la que se le pasa a crearHerramientasLectura() ---

  async obtenerEjecucion(ejecucionId: string): Promise<RegistroEjecucion | null> {
    const encontrada = this.ejecuciones.get(ejecucionId);
    return encontrada ? structuredClone(encontrada.ejecucion) : null;
  }

  async obtenerResultadosReglas(ejecucionId: string): Promise<RegistroResultadoRegla[] | null> {
    const encontrada = this.ejecuciones.get(ejecucionId);
    return encontrada ? structuredClone(encontrada.reglas) : null;
  }

  async obtenerEvidencia(ejecucionId: string, refEvidencia: string): Promise<RegistroEvidencia | null> {
    const encontrada = this.ejecuciones.get(ejecucionId)?.evidencias.find(
      (e) => e.ref_evidencia === refEvidencia,
    );
    return encontrada ? structuredClone(encontrada) : null;
  }

  async obtenerContextoPago(ejecucionId: string): Promise<RegistroContextoPago | null> {
    const encontrada = this.ejecuciones.get(ejecucionId);
    return encontrada ? structuredClone(encontrada.contextoPago) : null;
  }

  async obtenerDetalleRegla(reglaId: ReglaId): Promise<RegistroDetalleRegla | null> {
    const encontrada = this.reglasPolitica.get(reglaId);
    return encontrada ? structuredClone(encontrada) : null;
  }

  // --- Lectura en bloque: la usan los endpoints de listado/detalle, no las herramientas ---

  // Más reciente primero (contratos-api.md § 4, orden por defecto no especificado
  // pero es lo esperado en un listado). Map conserva el orden de inserción.
  async listarEjecuciones(): Promise<RegistroEjecucion[]> {
    return Array.from(this.ejecuciones.values())
      .map((e) => structuredClone(e.ejecucion))
      .reverse();
  }

  // Para listados que necesitan mostrar monto/categoría/solicitante junto con
  // la decisión (vistas "Solicitudes de pago" y "Panel"), sin que cada vista
  // tenga que pedir ejecucion + contexto por separado.
  async listarResumenEjecuciones(): Promise<
    Array<{ ejecucion: RegistroEjecucion; contextoPago: RegistroContextoPago }>
  > {
    return Array.from(this.ejecuciones.values())
      .map((e) => ({ ejecucion: structuredClone(e.ejecucion), contextoPago: structuredClone(e.contextoPago) }))
      .reverse();
  }

  async obtenerEvidencias(ejecucionId: string): Promise<RegistroEvidencia[] | null> {
    const encontrada = this.ejecuciones.get(ejecucionId);
    return encontrada ? structuredClone(encontrada.evidencias) : null;
  }

  async obtenerInformeAgente(ejecucionId: string): Promise<InformeAgenteAlmacenado | null> {
    const encontrada = this.ejecuciones.get(ejecucionId);
    return encontrada?.informeAgente ? structuredClone(encontrada.informeAgente) : null;
  }
}
