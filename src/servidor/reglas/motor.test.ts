import { describe, expect, it } from "vitest";
import { evaluarPago } from "./motor.js";
import type { ContextoConfiable, InstantaneaPolitica, SolicitudPago } from "./tipos.js";

// reglas.md § 4 — los 10 casos de prueba obligatorios del motor.

const politica: InstantaneaPolitica = {
  version_politica: "politica-pagos-v1",
  version_motor: "1.0.0",
  "PAG-001": { umbral_aprobacion_centavos: 1_000_000 }, // $10,000 MXN
  "PAG-002": { categorias_permitidas: ["OPERACIONES", "SOFTWARE", "VIAJES"] },
};

function solicitud(parcial: Partial<SolicitudPago>): SolicitudPago {
  return {
    pago_id: "PAG-TEST",
    monto_centavos: 850_000,
    categoria: "OPERACIONES",
    solicitante_id: "USU-001",
    ...parcial,
  };
}

const contextoBase: ContextoConfiable = {
  autorizacion: null,
  factura: { estado: "VERIFICADA" },
  presupuesto_disponible_centavos: 10_000_000,
};

function contexto(parcial: Partial<ContextoConfiable>): ContextoConfiable {
  return { ...contextoBase, ...parcial };
}

function resultado(decision: ReturnType<typeof evaluarPago>, reglaId: string) {
  return decision.resultados.find((r) => r.regla_id === reglaId)!;
}

describe("evaluarPago — casos obligatorios de reglas.md § 4", () => {
  it("1. $8,500 MXN sin aprobación especial: pasa PAG-001", () => {
    const d = evaluarPago(solicitud({ monto_centavos: 850_000 }), contextoBase, politica);
    expect(resultado(d, "PAG-001").estado).toBe("CUMPLE");
  });

  it("2. $10,000 MXN: no activa la condición monto > 10000", () => {
    const d = evaluarPago(solicitud({ monto_centavos: 1_000_000 }), contextoBase, politica);
    expect(resultado(d, "PAG-001").estado).toBe("CUMPLE");
    expect(resultado(d, "PAG-001").esperado).toEqual({ aprobacion_requerida: false });
  });

  it("3. $10,000.01 MXN: requiere aprobación", () => {
    const d = evaluarPago(
      solicitud({ monto_centavos: 1_000_001 }),
      contexto({ autorizacion: null }),
      politica,
    );
    expect(resultado(d, "PAG-001").estado).toBe("NO_CUMPLE");
    expect(resultado(d, "PAG-001").esperado).toMatchObject({ aprobacion_requerida: true });
  });

  it("4. $15,000 MXN sin aprobación válida: falla PAG-001", () => {
    const d = evaluarPago(
      solicitud({ monto_centavos: 1_500_000 }),
      contexto({ autorizacion: null }),
      politica,
    );
    expect(resultado(d, "PAG-001").estado).toBe("NO_CUMPLE");
    expect(d.decision).toBe("BLOQUEAR");
  });

  it("5. Categoría desconocida: falla PAG-002", () => {
    const d = evaluarPago(solicitud({ categoria: "VIAJES_VIP" }), contextoBase, politica);
    expect(resultado(d, "PAG-002").estado).toBe("NO_CUMPLE");
    expect(d.decision).toBe("BLOQUEAR");
  });

  it("6. Solicitante intentando autorizar su propio pago: falla PAG-003", () => {
    const d = evaluarPago(
      solicitud({ monto_centavos: 1_500_000, solicitante_id: "USU-001" }),
      contexto({
        autorizacion: {
          estado_aprobacion: "APROBADO",
          aprobador_id: "USU-001",
          aprobador_activo: true,
          aprobador_tiene_permiso: true,
        },
      }),
      politica,
    );
    expect(resultado(d, "PAG-003").estado).toBe("NO_CUMPLE");
    expect(d.decision).toBe("BLOQUEAR");
  });

  it("7. Factura ausente: falla PAG-004", () => {
    const d = evaluarPago(solicitud({}), contexto({ factura: { estado: "NO_VERIFICADA" } }), politica);
    expect(resultado(d, "PAG-004").estado).toBe("NO_CUMPLE");
    expect(d.decision).toBe("BLOQUEAR");
  });

  it("8. Fuente de verificación de factura no disponible: PAG-004 indeterminada", () => {
    const d = evaluarPago(solicitud({}), contexto({ factura: null }), politica);
    expect(resultado(d, "PAG-004").estado).toBe("INDETERMINADO");
    expect(d.decision).toBe("BLOQUEAR"); // fail-closed: indeterminado bloquea igual que no_cumple
  });

  it("9. Presupuesto insuficiente: falla PAG-005", () => {
    const d = evaluarPago(
      solicitud({ monto_centavos: 850_000 }),
      contexto({ presupuesto_disponible_centavos: 500_000 }),
      politica,
    );
    expect(resultado(d, "PAG-005").estado).toBe("NO_CUMPLE");
    expect(d.decision).toBe("BLOQUEAR");
  });

  it("10. Presupuesto no verificable: PAG-005 indeterminada", () => {
    const d = evaluarPago(solicitud({}), contexto({ presupuesto_disponible_centavos: null }), politica);
    expect(resultado(d, "PAG-005").estado).toBe("INDETERMINADO");
    expect(d.decision).toBe("BLOQUEAR");
  });

  it("devuelve siempre las cinco reglas en orden PAG-001..005, incluso si la primera bloquea", () => {
    const d = evaluarPago(
      solicitud({ monto_centavos: 1_500_000 }),
      contexto({ autorizacion: null }),
      politica,
    );
    expect(d.resultados.map((r) => r.regla_id)).toEqual([
      "PAG-001",
      "PAG-002",
      "PAG-003",
      "PAG-004",
      "PAG-005",
    ]);
  });

  it("un pago que cumple las cinco reglas produce PERMITIR", () => {
    const d = evaluarPago(solicitud({ monto_centavos: 850_000 }), contextoBase, politica);
    expect(d.decision).toBe("PERMITIR");
    expect(d.resultados.every((r) => r.estado === "CUMPLE")).toBe(true);
  });
});
