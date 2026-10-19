// Tipos provisionales del motor de reglas. Se alinean en forma con
// RegistroResultadoRegla de servidor/herramientas/tipos.ts (puesto 3), pero viven
// aquí de forma independiente para que reglas/ no importe nada de otro módulo
// (reglas.md § 1: "no debe importar React, el cliente de Nebius ni componentes
// del frontend"). Se reemplazan por src/contratos/motor.schema.ts cuando el
// puesto 5 lo proponga y el puesto 1 lo valide.

export type Decision = "PERMITIR" | "BLOQUEAR";
export type EstadoRegla = "CUMPLE" | "NO_CUMPLE" | "INDETERMINADO";
export type ReglaId = "PAG-001" | "PAG-002" | "PAG-003" | "PAG-004" | "PAG-005";

// Datos de la solicitud ya validados (contratos-api.md § 3): el backend los
// resuelve contra su propio contexto, nunca contra lo que el cliente envía.
export type SolicitudPago = {
  pago_id: string;
  monto_centavos: number;
  categoria: string;
  solicitante_id: string;
};

// Hechos resueltos por el backend contra registros confiables, nunca contra el
// payload del cliente (reglas.md § "PAG-001", "PAG-004"). `null` siempre
// significa "no hay registro / no se pudo verificar", nunca "aprobado"/"ok".
export type ContextoConfiable = {
  autorizacion: {
    estado_aprobacion: "APROBADO" | "NO_APROBADO";
    aprobador_id: string;
    aprobador_activo: boolean;
    aprobador_tiene_permiso: boolean;
  } | null;
  factura: {
    estado: "VERIFICADA" | "NO_VERIFICADA";
  } | null; // null = la fuente de verificación no respondió -> INDETERMINADO
  presupuesto_disponible_centavos: number | null; // null = no verificable -> INDETERMINADO
};

// Snapshot de la política vigente al momento de evaluar (reglas.md § 3:
// "version_politica"). Las claves de configuración siguen las mismas que
// servidor/herramientas/datosSimulados.ts usa para RegistroDetalleRegla.
export type InstantaneaPolitica = {
  version_politica: string;
  version_motor: string;
  "PAG-001": { umbral_aprobacion_centavos: number };
  "PAG-002": { categorias_permitidas: string[] };
};

export type ResultadoRegla = {
  regla_id: ReglaId;
  estado: EstadoRegla;
  observado: Record<string, unknown>;
  esperado: Record<string, unknown>;
  mensaje: string | null;
  severidad: "BLOQUEANTE" | "INFORMATIVA";
};

export type DecisionMotor = {
  decision: Decision;
  version_motor: string;
  version_politica: string;
  resultados: ResultadoRegla[];
};
