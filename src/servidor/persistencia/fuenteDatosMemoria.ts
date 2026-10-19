import { mensajes } from "../../mensajes/index.js";
import type {
  FuenteDatosHerramientas,
  RegistroContextoPago,
  RegistroDetalleRegla,
  RegistroEjecucion,
  RegistroEvidencia,
  RegistroResultadoRegla,
  ReglaId,
} from "../herramientas/tipos.js";

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
}
