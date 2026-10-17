import { SEMILLA_SIMULADA, type SemillaSimulada } from "./datosSimulados.js";
import type {
  FuenteDatosHerramientas,
  RegistroContextoPago,
  RegistroDetalleRegla,
  RegistroEjecucion,
  RegistroEvidencia,
  RegistroResultadoRegla,
  ReglaId,
} from "./tipos.js";

// Mock en memoria. Devuelve clones para que nadie mute la semilla.
export class FuenteDatosEnMemoria implements FuenteDatosHerramientas {
  constructor(private readonly semilla: SemillaSimulada = SEMILLA_SIMULADA) {}

  async obtenerEjecucion(ejecucionId: string): Promise<RegistroEjecucion | null> {
    const encontrada = this.semilla.ejecuciones[ejecucionId];
    return encontrada ? structuredClone(encontrada.ejecucion) : null;
  }

  async obtenerResultadosReglas(ejecucionId: string): Promise<RegistroResultadoRegla[] | null> {
    const encontrada = this.semilla.ejecuciones[ejecucionId];
    return encontrada ? structuredClone(encontrada.reglas) : null;
  }

  async obtenerEvidencia(ejecucionId: string, refEvidencia: string): Promise<RegistroEvidencia | null> {
    const encontrada = this.semilla.ejecuciones[ejecucionId]?.evidencias.find(
      (e) => e.ref_evidencia === refEvidencia,
    );
    return encontrada ? structuredClone(encontrada) : null;
  }

  async obtenerContextoPago(ejecucionId: string): Promise<RegistroContextoPago | null> {
    const encontrada = this.semilla.ejecuciones[ejecucionId];
    return encontrada ? structuredClone(encontrada.contextoPago) : null;
  }

  async obtenerDetalleRegla(reglaId: ReglaId): Promise<RegistroDetalleRegla | null> {
    const encontrada = this.semilla.reglas[reglaId];
    return encontrada ? structuredClone(encontrada) : null;
  }
}
