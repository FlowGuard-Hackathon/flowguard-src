import { mensajes } from "../../mensajes/index.js";
import type {
  ContextoConfiable,
  DecisionMotor,
  InstantaneaPolitica,
  ResultadoRegla,
  SolicitudPago,
} from "./tipos.js";

const msj = mensajes.reglas;

// PAG-001: límite de autorización (reglas.md § "PAG-001").
// "Sin registro se devuelve null (nunca asumir aprobado)": contexto.autorizacion === null
// se trata igual que NO_APROBADO, no como caso indeterminado.
function evaluarPag001(
  solicitud: SolicitudPago,
  contexto: ContextoConfiable,
  politica: InstantaneaPolitica,
): ResultadoRegla {
  const { umbral_aprobacion_centavos } = politica["PAG-001"];
  const requiereAprobacion = solicitud.monto_centavos > umbral_aprobacion_centavos;
  const montoMxn = solicitud.monto_centavos / 100;

  if (!requiereAprobacion) {
    return {
      regla_id: "PAG-001",
      estado: "CUMPLE",
      observado: { monto_centavos: solicitud.monto_centavos },
      esperado: { aprobacion_requerida: false },
      mensaje: null,
      severidad: "BLOQUEANTE",
    };
  }

  const aprobacionValida =
    contexto.autorizacion !== null &&
    contexto.autorizacion.estado_aprobacion === "APROBADO" &&
    contexto.autorizacion.aprobador_activo &&
    contexto.autorizacion.aprobador_tiene_permiso;

  return {
    regla_id: "PAG-001",
    estado: aprobacionValida ? "CUMPLE" : "NO_CUMPLE",
    observado: {
      monto_centavos: solicitud.monto_centavos,
      estado_aprobacion: contexto.autorizacion?.estado_aprobacion ?? "NO_APROBADO",
    },
    esperado: { aprobacion_requerida: true, estado_aprobacion: "APROBADO" },
    mensaje: aprobacionValida ? msj.pag001.aprobada(montoMxn) : msj.pag001.sinAprobacion(montoMxn),
    severidad: "BLOQUEANTE",
  };
}

// PAG-002: categoría permitida.
function evaluarPag002(solicitud: SolicitudPago, politica: InstantaneaPolitica): ResultadoRegla {
  const { categorias_permitidas } = politica["PAG-002"];
  const permitida = categorias_permitidas.includes(solicitud.categoria);

  return {
    regla_id: "PAG-002",
    estado: permitida ? "CUMPLE" : "NO_CUMPLE",
    observado: { categoria: solicitud.categoria },
    esperado: { categorias_permitidas },
    mensaje: permitida ? null : msj.pag002.noPermitida(solicitud.categoria),
    severidad: "BLOQUEANTE",
  };
}

// PAG-003: separación de funciones. Solo exige separación cuando PAG-001 ya
// requiere aprobación por monto (reglas.md: "cuando una aprobación especial no
// sea necesaria, la regla debe evaluar los permisos que correspondan al
// proceso", no exigir supervisor a todos los pagos).
function evaluarPag003(
  solicitud: SolicitudPago,
  contexto: ContextoConfiable,
  politica: InstantaneaPolitica,
): ResultadoRegla {
  const requiereAprobacion = solicitud.monto_centavos > politica["PAG-001"].umbral_aprobacion_centavos;

  if (!requiereAprobacion) {
    return {
      regla_id: "PAG-003",
      estado: "CUMPLE",
      observado: { solicitante_id: solicitud.solicitante_id, aprobador_id: contexto.autorizacion?.aprobador_id ?? null },
      esperado: { aprobador_requerido_por_monto: false },
      mensaje: null,
      severidad: "BLOQUEANTE",
    };
  }

  const aprobador = contexto.autorizacion;
  const mismaPersona = aprobador !== null && aprobador.aprobador_id === solicitud.solicitante_id;
  const aprobadorValido =
    aprobador !== null && !mismaPersona && aprobador.aprobador_activo && aprobador.aprobador_tiene_permiso;

  return {
    regla_id: "PAG-003",
    estado: aprobadorValido ? "CUMPLE" : "NO_CUMPLE",
    observado: { solicitante_id: solicitud.solicitante_id, aprobador_id: aprobador?.aprobador_id ?? null },
    esperado: { aprobador_requerido_por_monto: true, aprobador_distinto_del_solicitante: true },
    mensaje: aprobadorValido ? null : mismaPersona ? msj.pag003.mismaPersona : msj.pag003.aprobadorInvalido,
    severidad: "BLOQUEANTE",
  };
}

// PAG-004: factura verificada. `contexto.factura === null` = la fuente de
// verificación no respondió -> INDETERMINADO (política fail-closed, bloquea
// igual que NO_CUMPLE, pero el informe debe seguir distinguiendo ambos casos).
function evaluarPag004(contexto: ContextoConfiable): ResultadoRegla {
  if (contexto.factura === null) {
    return {
      regla_id: "PAG-004",
      estado: "INDETERMINADO",
      observado: { factura_verificada: null },
      esperado: { factura_verificada: true },
      mensaje: msj.pag004.fuenteNoDisponible,
      severidad: "BLOQUEANTE",
    };
  }

  const verificada = contexto.factura.estado === "VERIFICADA";
  return {
    regla_id: "PAG-004",
    estado: verificada ? "CUMPLE" : "NO_CUMPLE",
    observado: { factura_verificada: verificada },
    esperado: { factura_verificada: true },
    mensaje: verificada ? null : msj.pag004.noVerificada,
    severidad: "BLOQUEANTE",
  };
}

// PAG-005: presupuesto disponible. `null` = saldo no verificable -> INDETERMINADO.
function evaluarPag005(solicitud: SolicitudPago, contexto: ContextoConfiable): ResultadoRegla {
  const disponible = contexto.presupuesto_disponible_centavos;

  if (disponible === null) {
    return {
      regla_id: "PAG-005",
      estado: "INDETERMINADO",
      observado: { monto_centavos: solicitud.monto_centavos, presupuesto_disponible_centavos: null },
      esperado: { monto_no_supera_disponible: true },
      mensaje: msj.pag005.noVerificable,
      severidad: "BLOQUEANTE",
    };
  }

  const alcanza = solicitud.monto_centavos <= disponible;
  return {
    regla_id: "PAG-005",
    estado: alcanza ? "CUMPLE" : "NO_CUMPLE",
    observado: { monto_centavos: solicitud.monto_centavos, presupuesto_disponible_centavos: disponible },
    esperado: { monto_no_supera_disponible: true },
    mensaje: alcanza ? null : msj.pag005.insuficiente,
    severidad: "BLOQUEANTE",
  };
}

// reglas.md § 1: biblioteca independiente, sin I/O ni dependencias de framework.
// Evalúa las cinco reglas en orden estable y siempre devuelve las cinco, incluso
// si la primera ya bloquea, para que el informe pueda explicar todo el resultado.
export function evaluarPago(
  solicitud: SolicitudPago,
  contexto: ContextoConfiable,
  politica: InstantaneaPolitica,
): DecisionMotor {
  const resultados: ResultadoRegla[] = [
    evaluarPag001(solicitud, contexto, politica),
    evaluarPag002(solicitud, politica),
    evaluarPag003(solicitud, contexto, politica),
    evaluarPag004(contexto),
    evaluarPag005(solicitud, contexto),
  ];

  // reglas.md § 3: INDETERMINADO bloquea igual que NO_CUMPLE (fail-closed).
  const debeBloquear = resultados.some((r) => r.estado === "NO_CUMPLE" || r.estado === "INDETERMINADO");

  return {
    decision: debeBloquear ? "BLOQUEAR" : "PERMITIR",
    version_motor: politica.version_motor,
    version_politica: politica.version_politica,
    resultados,
  };
}
