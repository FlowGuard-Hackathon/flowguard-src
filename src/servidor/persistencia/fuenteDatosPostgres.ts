import { Pool } from "pg";
import type {
  RegistroContextoPago,
  RegistroDetalleRegla,
  RegistroEjecucion,
  RegistroEvidencia,
  RegistroResultadoRegla,
  ReglaId,
} from "../herramientas/tipos.js";
import type { EjecucionAlmacenada, FuenteDatosEjecuciones, InformeAgenteAlmacenado } from "./fuenteDatosMemoria.js";

// Implementación de FuenteDatosEjecuciones contra un Postgres real (docker/init.sql
// en la raíz de flowguard-repos), para pruebas con datos que persisten entre
// reinicios — a diferencia de FuenteDatosMemoria, que los pierde con cada
// `npm run dev`. Mismo contrato, misma forma de los registros; solo cambia
// dónde viven. Ver docker/init.sql para por qué el esquema NO es el de
// flowguard-supabase/migrations (ese modela un flujo que esta app aún no tiene).
export class FuenteDatosPostgres implements FuenteDatosEjecuciones {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async guardarEjecucion(datos: EjecucionAlmacenada): Promise<void> {
    const cliente = await this.pool.connect();
    try {
      await cliente.query("BEGIN");

      await cliente.query(
        `INSERT INTO ejecuciones (
           ejecucion_id, decision, estado_ejecucion, estado_investigacion,
           version_motor, version_politica, creado_en,
           pago_id, monto_centavos, moneda, categoria, solicitante_id, presupuesto_id,
           presupuesto_disponible_centavos, autorizacion_estado, autorizacion_aprobador_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          datos.ejecucion.ejecucion_id,
          datos.ejecucion.decision,
          datos.ejecucion.estado_ejecucion,
          datos.ejecucion.estado_investigacion,
          datos.ejecucion.version_motor,
          datos.ejecucion.version_politica,
          datos.ejecucion.creado_en,
          datos.contextoPago.pago_id,
          datos.contextoPago.monto_centavos,
          datos.contextoPago.moneda,
          datos.contextoPago.categoria,
          datos.contextoPago.solicitante_id,
          datos.contextoPago.presupuesto_id,
          datos.contextoPago.presupuesto_disponible_centavos,
          datos.contextoPago.autorizacion_verificada?.estado_aprobacion ?? null,
          datos.contextoPago.autorizacion_verificada?.aprobador_id ?? null,
        ],
      );

      for (const regla of datos.reglas) {
        await cliente.query(
          `INSERT INTO resultados_regla (
             ejecucion_id, regla_id, estado, observado_json, esperado_json, mensaje, severidad, refs_evidencia
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            datos.ejecucion.ejecucion_id,
            regla.regla_id,
            regla.estado,
            JSON.stringify(regla.observado),
            JSON.stringify(regla.esperado),
            regla.mensaje,
            regla.severidad,
            regla.refs_evidencia,
          ],
        );
      }

      for (const evidencia of datos.evidencias) {
        await cliente.query(
          `INSERT INTO evidencias (ejecucion_id, ref_evidencia, tipo_evidencia, origen, contenido_json)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            datos.ejecucion.ejecucion_id,
            evidencia.ref_evidencia,
            evidencia.tipo_evidencia,
            evidencia.origen,
            JSON.stringify(evidencia.contenido),
          ],
        );
      }

      await cliente.query("COMMIT");
    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;
    } finally {
      cliente.release();
    }
  }

  // No hay tabla de reglas_politica en docker/init.sql (ver nota de ese archivo):
  // la app nunca llama definirReglaPolitica() hoy, igual que FuenteDatosMemoria
  // en la práctica (nada invoca ese método). No-op a propósito, no un recorte.
  async definirReglaPolitica(_detalle: RegistroDetalleRegla): Promise<void> {}

  async guardarInformeAgente(ejecucionId: string, informe: InformeAgenteAlmacenado): Promise<void> {
    const cliente = await this.pool.connect();
    try {
      await cliente.query("BEGIN");
      await cliente.query(
        `INSERT INTO informes_agente (ejecucion_id, intento_id, estado, informe_json)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (ejecucion_id) DO UPDATE SET intento_id = $2, estado = $3, informe_json = $4`,
        [ejecucionId, informe.intento_id, informe.estado, informe.informe ? JSON.stringify(informe.informe) : null],
      );
      await cliente.query(`UPDATE ejecuciones SET estado_investigacion = $2 WHERE ejecucion_id = $1`, [
        ejecucionId,
        informe.estado,
      ]);
      await cliente.query("COMMIT");
    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;
    } finally {
      cliente.release();
    }
  }

  async obtenerEjecucion(ejecucionId: string): Promise<RegistroEjecucion | null> {
    const { rows } = await this.pool.query(
      `SELECT ejecucion_id, decision, estado_ejecucion, estado_investigacion, version_motor, version_politica, creado_en
       FROM ejecuciones WHERE ejecucion_id = $1`,
      [ejecucionId],
    );
    return rows[0] ? filaAEjecucion(rows[0]) : null;
  }

  async obtenerResultadosReglas(ejecucionId: string): Promise<RegistroResultadoRegla[] | null> {
    const existe = await this.obtenerEjecucion(ejecucionId);
    if (!existe) return null;
    const { rows } = await this.pool.query(
      `SELECT regla_id, estado, observado_json, esperado_json, mensaje, severidad, refs_evidencia
       FROM resultados_regla WHERE ejecucion_id = $1 ORDER BY regla_id`,
      [ejecucionId],
    );
    return rows.map(filaAResultadoRegla);
  }

  async obtenerEvidencia(ejecucionId: string, refEvidencia: string): Promise<RegistroEvidencia | null> {
    const { rows } = await this.pool.query(
      `SELECT ref_evidencia, tipo_evidencia, origen, contenido_json
       FROM evidencias WHERE ejecucion_id = $1 AND ref_evidencia = $2`,
      [ejecucionId, refEvidencia],
    );
    return rows[0] ? filaAEvidencia(rows[0]) : null;
  }

  async obtenerContextoPago(ejecucionId: string): Promise<RegistroContextoPago | null> {
    const { rows } = await this.pool.query(
      `SELECT pago_id, monto_centavos, moneda, categoria, solicitante_id, presupuesto_id,
              presupuesto_disponible_centavos, autorizacion_estado, autorizacion_aprobador_id
       FROM ejecuciones WHERE ejecucion_id = $1`,
      [ejecucionId],
    );
    return rows[0] ? filaAContextoPago(rows[0]) : null;
  }

  // Ver nota de definirReglaPolitica(): sin tabla de política, siempre null
  // (igual que FuenteDatosMemoria sin nadie llamando definirReglaPolitica()).
  async obtenerDetalleRegla(_reglaId: ReglaId): Promise<RegistroDetalleRegla | null> {
    return null;
  }

  async listarEjecuciones(): Promise<RegistroEjecucion[]> {
    const { rows } = await this.pool.query(
      `SELECT ejecucion_id, decision, estado_ejecucion, estado_investigacion, version_motor, version_politica, creado_en
       FROM ejecuciones ORDER BY creado_en DESC`,
    );
    return rows.map(filaAEjecucion);
  }

  async listarResumenEjecuciones(): Promise<
    Array<{ ejecucion: RegistroEjecucion; contextoPago: RegistroContextoPago }>
  > {
    const { rows } = await this.pool.query(`SELECT * FROM ejecuciones ORDER BY creado_en DESC`);
    return rows.map((fila) => ({ ejecucion: filaAEjecucion(fila), contextoPago: filaAContextoPago(fila) }));
  }

  async obtenerEvidencias(ejecucionId: string): Promise<RegistroEvidencia[] | null> {
    const existe = await this.obtenerEjecucion(ejecucionId);
    if (!existe) return null;
    const { rows } = await this.pool.query(
      `SELECT ref_evidencia, tipo_evidencia, origen, contenido_json FROM evidencias WHERE ejecucion_id = $1`,
      [ejecucionId],
    );
    return rows.map(filaAEvidencia);
  }

  async obtenerInformeAgente(ejecucionId: string): Promise<InformeAgenteAlmacenado | null> {
    const { rows } = await this.pool.query(
      `SELECT intento_id, estado, informe_json FROM informes_agente WHERE ejecucion_id = $1`,
      [ejecucionId],
    );
    if (!rows[0]) return null;
    return { intento_id: rows[0].intento_id, estado: rows[0].estado, informe: rows[0].informe_json };
  }
}

// --- Fila de Postgres -> tipos del dominio (RegistroX) ---------------------

function filaAEjecucion(fila: Record<string, unknown>): RegistroEjecucion {
  return {
    ejecucion_id: fila.ejecucion_id as string,
    decision: fila.decision as RegistroEjecucion["decision"],
    estado_ejecucion: fila.estado_ejecucion as RegistroEjecucion["estado_ejecucion"],
    estado_investigacion: fila.estado_investigacion as RegistroEjecucion["estado_investigacion"],
    version_motor: fila.version_motor as string,
    version_politica: fila.version_politica as string,
    creado_en: (fila.creado_en as Date).toISOString(),
  };
}

function filaAContextoPago(fila: Record<string, unknown>): RegistroContextoPago {
  return {
    pago_id: fila.pago_id as string,
    monto_centavos: Number(fila.monto_centavos),
    moneda: fila.moneda as "MXN",
    categoria: fila.categoria as string,
    solicitante_id: fila.solicitante_id as string,
    presupuesto_id: fila.presupuesto_id as string,
    presupuesto_disponible_centavos:
      fila.presupuesto_disponible_centavos === null ? null : Number(fila.presupuesto_disponible_centavos),
    autorizacion_verificada: fila.autorizacion_estado
      ? { estado_aprobacion: fila.autorizacion_estado as string, aprobador_id: fila.autorizacion_aprobador_id as string | null }
      : null,
  };
}

function filaAResultadoRegla(fila: Record<string, unknown>): RegistroResultadoRegla {
  return {
    regla_id: fila.regla_id as ReglaId,
    estado: fila.estado as RegistroResultadoRegla["estado"],
    observado: fila.observado_json as Record<string, unknown>,
    esperado: fila.esperado_json as Record<string, unknown>,
    mensaje: fila.mensaje as string | null,
    severidad: fila.severidad as RegistroResultadoRegla["severidad"],
    refs_evidencia: fila.refs_evidencia as string[],
  };
}

function filaAEvidencia(fila: Record<string, unknown>): RegistroEvidencia {
  return {
    ref_evidencia: fila.ref_evidencia as string,
    tipo_evidencia: fila.tipo_evidencia as string,
    origen: fila.origen as string,
    contenido: fila.contenido_json as Record<string, unknown>,
  };
}
