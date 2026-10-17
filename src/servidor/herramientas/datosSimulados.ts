// Datos simulados (mock), no evidencia real. Salen de los ejemplos de contratos-api.md
// § 3 y § 6; lo que la doc no fija está marcado abajo. Alinear con las fixtures de
// flowguard-mocks cuando Dev 5 las publique.

import type {
  RegistroContextoPago,
  RegistroDetalleRegla,
  RegistroEjecucion,
  RegistroEvidencia,
  RegistroResultadoRegla,
  ReglaId,
} from "./tipos.js";

export type EjecucionSimulada = {
  ejecucion: RegistroEjecucion;
  reglas: RegistroResultadoRegla[];
  evidencias: RegistroEvidencia[];
  contextoPago: RegistroContextoPago;
};

export type SemillaSimulada = {
  ejecuciones: Record<string, EjecucionSimulada>;
  reglas: Partial<Record<ReglaId, RegistroDetalleRegla>>;
};

const VERSION_POLITICA = "politica-pagos-v1";
const VERSION_MOTOR = "1.0.0";
const CATEGORIAS_PERMITIDAS = ["OPERACIONES", "SOFTWARE", "VIAJES"];

// $15,000 sin aprobación -> BLOQUEAR por PAG-001
const ejecucionBloqueada: EjecucionSimulada = {
  ejecucion: {
    ejecucion_id: "EJE-2026-0001",
    decision: "BLOQUEAR",
    estado_ejecucion: "PERSISTIDA",
    estado_investigacion: "PENDIENTE",
    version_motor: VERSION_MOTOR,
    version_politica: VERSION_POLITICA,
  },
  reglas: [
    {
      regla_id: "PAG-001",
      estado: "NO_CUMPLE",
      observado: { monto_mxn: 15000, estado_aprobacion: "NO_APROBADO" },
      esperado: { aprobacion_requerida: true, estado_aprobacion: "APROBADO" },
      mensaje: null,
      severidad: "BLOQUEANTE",
      refs_evidencia: ["EV-0001", "EV-0002"],
    },
    {
      regla_id: "PAG-002",
      estado: "CUMPLE",
      observado: { categoria: "OPERACIONES" },
      esperado: { categorias_permitidas: CATEGORIAS_PERMITIDAS },
      mensaje: null,
      severidad: "BLOQUEANTE",
      refs_evidencia: ["EV-0003"],
    },
    {
      regla_id: "PAG-003",
      estado: "CUMPLE",
      observado: { solicitante_id: "USU-001", aprobador_id: null },
      esperado: { aprobador_requerido_por_monto: false },
      mensaje: null,
      severidad: "BLOQUEANTE",
      refs_evidencia: [],
    },
    {
      regla_id: "PAG-004",
      estado: "CUMPLE",
      observado: { factura_verificada: true },
      esperado: { factura_verificada: true },
      mensaje: null,
      severidad: "BLOQUEANTE",
      refs_evidencia: ["EV-0004"],
    },
    {
      regla_id: "PAG-005",
      estado: "CUMPLE",
      observado: { monto_centavos: 1500000, presupuesto_disponible_centavos: 2500000 },
      esperado: { monto_no_supera_disponible: true },
      mensaje: null,
      severidad: "BLOQUEANTE",
      refs_evidencia: ["EV-0005"],
    },
  ],
  evidencias: [
    {
      ref_evidencia: "EV-0001",
      tipo_evidencia: "REGISTRO_APROBACION",
      origen: "contexto_confiable.aprobaciones",
      contenido: { estado_aprobacion: "NO_APROBADO" },
    },
    // EV-0002 a EV-0005 son supuestos: la doc solo fija EV-0001
    {
      ref_evidencia: "EV-0002",
      tipo_evidencia: "POLITICA_APROBACION",
      origen: "reglas_politica",
      contenido: { umbral_aprobacion_centavos: 1000000, moneda: "MXN" },
    },
    {
      ref_evidencia: "EV-0003",
      tipo_evidencia: "REGISTRO_CATEGORIA",
      origen: "contexto_confiable.pago",
      contenido: { categoria: "OPERACIONES" },
    },
    {
      ref_evidencia: "EV-0004",
      tipo_evidencia: "REGISTRO_FACTURA",
      origen: "contexto_confiable.adjuntos",
      contenido: { adjunto_id: "ADJ-001", factura_verificada: true },
    },
    {
      ref_evidencia: "EV-0005",
      tipo_evidencia: "SALDO_PRESUPUESTO",
      origen: "saldos_presupuesto",
      contenido: { presupuesto_id: "PRE-OPERACIONES-01", disponible_centavos: 2500000 },
    },
  ],
  contextoPago: {
    pago_id: "PAG-2026-001",
    monto_centavos: 1500000,
    moneda: "MXN",
    categoria: "OPERACIONES",
    solicitante_id: "USU-001",
    presupuesto_id: "PRE-OPERACIONES-01",
    presupuesto_disponible_centavos: 2500000,
    autorizacion_verificada: { estado_aprobacion: "NO_APROBADO", aprobador_id: null },
  },
};

// $8,500 que cumple las cinco reglas -> PERMITIR
const ejecucionPermitida: EjecucionSimulada = {
  ejecucion: {
    ejecucion_id: "EJE-2026-0002",
    decision: "PERMITIR",
    estado_ejecucion: "PERSISTIDA",
    estado_investigacion: "NO_INICIADA",
    version_motor: VERSION_MOTOR,
    version_politica: VERSION_POLITICA,
  },
  reglas: [
    {
      regla_id: "PAG-001",
      estado: "CUMPLE",
      observado: { monto_mxn: 8500 },
      esperado: { aprobacion_requerida: false },
      mensaje: null,
      severidad: "BLOQUEANTE",
      refs_evidencia: [],
    },
    {
      regla_id: "PAG-002",
      estado: "CUMPLE",
      observado: { categoria: "SOFTWARE" },
      esperado: { categorias_permitidas: CATEGORIAS_PERMITIDAS },
      mensaje: null,
      severidad: "BLOQUEANTE",
      refs_evidencia: ["EV-0001"],
    },
    {
      regla_id: "PAG-003",
      estado: "CUMPLE",
      observado: { solicitante_id: "USU-002", aprobador_id: null },
      esperado: { aprobador_requerido_por_monto: false },
      mensaje: null,
      severidad: "BLOQUEANTE",
      refs_evidencia: [],
    },
    {
      regla_id: "PAG-004",
      estado: "CUMPLE",
      observado: { factura_verificada: true },
      esperado: { factura_verificada: true },
      mensaje: null,
      severidad: "BLOQUEANTE",
      refs_evidencia: ["EV-0002"],
    },
    {
      regla_id: "PAG-005",
      estado: "CUMPLE",
      observado: { monto_centavos: 850000, presupuesto_disponible_centavos: 2500000 },
      esperado: { monto_no_supera_disponible: true },
      mensaje: null,
      severidad: "BLOQUEANTE",
      refs_evidencia: ["EV-0003"],
    },
  ],
  evidencias: [
    {
      ref_evidencia: "EV-0001",
      tipo_evidencia: "REGISTRO_CATEGORIA",
      origen: "contexto_confiable.pago",
      contenido: { categoria: "SOFTWARE" },
    },
    {
      ref_evidencia: "EV-0002",
      tipo_evidencia: "REGISTRO_FACTURA",
      origen: "contexto_confiable.adjuntos",
      contenido: { adjunto_id: "ADJ-002", factura_verificada: true },
    },
    {
      ref_evidencia: "EV-0003",
      tipo_evidencia: "SALDO_PRESUPUESTO",
      origen: "saldos_presupuesto",
      contenido: { presupuesto_id: "PRE-SOFTWARE-01", disponible_centavos: 2500000 },
    },
  ],
  contextoPago: {
    pago_id: "PAG-2026-002",
    monto_centavos: 850000,
    moneda: "MXN",
    categoria: "SOFTWARE",
    solicitante_id: "USU-002",
    presupuesto_id: "PRE-SOFTWARE-01",
    presupuesto_disponible_centavos: 2500000,
    autorizacion_verificada: null,
  },
};

// El umbral de $10,000 sale de reglas.md § 2; las claves de configuracion son supuestos
// hasta que Dev 1 fije el formato de reglas_politica.configuracion_json
const reglas: SemillaSimulada["reglas"] = {
  "PAG-001": {
    regla_id: "PAG-001",
    version_politica: VERSION_POLITICA,
    habilitada: true,
    configuracion: { umbral_aprobacion_centavos: 1000000, moneda: "MXN" },
  },
  "PAG-002": {
    regla_id: "PAG-002",
    version_politica: VERSION_POLITICA,
    habilitada: true,
    configuracion: { categorias_permitidas: CATEGORIAS_PERMITIDAS },
  },
  "PAG-003": {
    regla_id: "PAG-003",
    version_politica: VERSION_POLITICA,
    habilitada: true,
    configuracion: { requiere_aprobador_distinto: true },
  },
  "PAG-004": {
    regla_id: "PAG-004",
    version_politica: VERSION_POLITICA,
    habilitada: true,
    configuracion: { requiere_factura_verificada: true },
  },
  "PAG-005": {
    regla_id: "PAG-005",
    version_politica: VERSION_POLITICA,
    habilitada: true,
    configuracion: { comparacion: "monto_centavos <= presupuesto_disponible_centavos" },
  },
};

export const SEMILLA_SIMULADA: SemillaSimulada = {
  ejecuciones: {
    "EJE-2026-0001": ejecucionBloqueada,
    "EJE-2026-0002": ejecucionPermitida,
  },
  reglas,
};
