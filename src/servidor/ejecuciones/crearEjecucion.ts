import type { RegistroContextoPago, RegistroEvidencia, RegistroResultadoRegla } from "../herramientas/tipos.js";
import type { FuenteDatosEjecuciones } from "../persistencia/fuenteDatosMemoria.js";
import { evaluarPago } from "../reglas/motor.js";
import type { ContextoConfiable, InstantaneaPolitica, ResultadoRegla, SolicitudPago } from "../reglas/tipos.js";

// Orquesta: motor de reglas -> construir evidencia -> persistir. El motor
// (servidor/reglas/) es una biblioteca pura sin I/O (reglas.md § 1); aquí, en la
// capa de orquestación, es donde se decide qué evidencia respalda cada regla y
// se le asigna un ref_evidencia — responde la pregunta abierta #1 de
// servidor/herramientas/README.md ("¿de dónde salen los refs_evidencia?").

export type DatosPago = {
  pago_id: string;
  monto_centavos: number;
  moneda: "MXN";
  categoria: string;
  solicitante_id: string;
  presupuesto_id: string;
};

export type ResultadoCrearEjecucion = {
  ejecucion_id: string;
  decision: "PERMITIR" | "BLOQUEAR";
  resultados: ResultadoRegla[];
};

// null = todavía no se sembró desde `destino` en este proceso.
let contadorEjecucion: number | null = null;
let contadorEvidencia = 0;

// Con FuenteDatosMemoria el contador siempre arrancaba en 0 junto con el
// almacén, así que nunca chocaba. Con FuenteDatosPostgres los datos
// sobreviven a un reinicio de `npm run dev` pero este contador en memoria
// no — sin esto, tras reiniciar, el primer EJE-0001 nuevo choca con el
// EJE-0001 ya persistido (UNIQUE constraint). Se siembra una sola vez por
// proceso a partir del máximo real guardado.
async function siguienteIdEjecucion(destino: FuenteDatosEjecuciones): Promise<string> {
  if (contadorEjecucion === null) {
    const existentes = await destino.listarEjecuciones();
    contadorEjecucion = existentes.reduce((maximo, e) => {
      const n = Number(e.ejecucion_id.replace(/^EJE-/, ""));
      return Number.isFinite(n) && n > maximo ? n : maximo;
    }, 0);
  }
  contadorEjecucion += 1;
  return `EJE-${String(contadorEjecucion).padStart(4, "0")}`;
}

function siguienteIdEvidencia(): string {
  contadorEvidencia += 1;
  return `EV-${String(contadorEvidencia).padStart(4, "0")}`;
}

// Decide, por regla, qué evidencia generar a partir de lo que el motor observó.
// PAG-003 no genera evidencia propia salvo que de verdad exista un aprobador
// distinto que revisar (igual que en servidor/herramientas/datosSimulados.ts).
function construirEvidenciaParaRegla(resultado: ResultadoRegla): RegistroEvidencia[] {
  switch (resultado.regla_id) {
    case "PAG-001":
      return [
        {
          ref_evidencia: siguienteIdEvidencia(),
          tipo_evidencia: "REGISTRO_APROBACION",
          origen: "contexto_confiable.autorizacion",
          contenido: resultado.observado,
        },
      ];
    case "PAG-002":
      return [
        {
          ref_evidencia: siguienteIdEvidencia(),
          tipo_evidencia: "REGISTRO_CATEGORIA",
          origen: "contexto_confiable.pago",
          contenido: resultado.observado,
        },
      ];
    case "PAG-003":
      return resultado.esperado.aprobador_requerido_por_monto
        ? [
            {
              ref_evidencia: siguienteIdEvidencia(),
              tipo_evidencia: "REGISTRO_APROBACION",
              origen: "contexto_confiable.autorizacion",
              contenido: resultado.observado,
            },
          ]
        : [];
    case "PAG-004":
      return [
        {
          ref_evidencia: siguienteIdEvidencia(),
          tipo_evidencia: "REGISTRO_FACTURA",
          origen: "contexto_confiable.factura",
          contenido: resultado.observado,
        },
      ];
    case "PAG-005":
      return [
        {
          ref_evidencia: siguienteIdEvidencia(),
          tipo_evidencia: "SALDO_PRESUPUESTO",
          origen: "contexto_confiable.presupuesto",
          contenido: resultado.observado,
        },
      ];
  }
}

export async function crearEjecucion(
  destino: FuenteDatosEjecuciones,
  pago: DatosPago,
  contexto: ContextoConfiable,
  politica: InstantaneaPolitica,
): Promise<ResultadoCrearEjecucion> {
  const solicitud: SolicitudPago = {
    pago_id: pago.pago_id,
    monto_centavos: pago.monto_centavos,
    categoria: pago.categoria,
    solicitante_id: pago.solicitante_id,
  };

  const decisionMotor = evaluarPago(solicitud, contexto, politica);
  const ejecucionId = await siguienteIdEjecucion(destino);

  const evidencias: RegistroEvidencia[] = [];
  const reglasConRefs: RegistroResultadoRegla[] = decisionMotor.resultados.map((r) => {
    const nuevasEvidencias = construirEvidenciaParaRegla(r);
    evidencias.push(...nuevasEvidencias);
    return { ...r, refs_evidencia: nuevasEvidencias.map((e) => e.ref_evidencia) };
  });

  const contextoPago: RegistroContextoPago = {
    pago_id: pago.pago_id,
    monto_centavos: pago.monto_centavos,
    moneda: pago.moneda,
    categoria: pago.categoria,
    solicitante_id: pago.solicitante_id,
    presupuesto_id: pago.presupuesto_id,
    presupuesto_disponible_centavos: contexto.presupuesto_disponible_centavos,
    autorizacion_verificada: contexto.autorizacion
      ? {
          estado_aprobacion: contexto.autorizacion.estado_aprobacion,
          aprobador_id: contexto.autorizacion.aprobador_id,
        }
      : null,
  };

  await destino.guardarEjecucion({
    ejecucion: {
      ejecucion_id: ejecucionId,
      decision: decisionMotor.decision,
      estado_ejecucion: "PERSISTIDA",
      estado_investigacion: decisionMotor.decision === "BLOQUEAR" ? "PENDIENTE" : "NO_INICIADA",
      version_motor: decisionMotor.version_motor,
      version_politica: decisionMotor.version_politica,
      creado_en: new Date().toISOString(),
    },
    reglas: reglasConRefs,
    evidencias,
    contextoPago,
  });

  return { ejecucion_id: ejecucionId, decision: decisionMotor.decision, resultados: reglasConRefs };
}
