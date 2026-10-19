import { describe, expect, it } from "vitest";
import { validarInforme } from "../agente/validarInforme.js";
import { FuenteDatosMemoria } from "../persistencia/fuenteDatosMemoria.js";
import type { ContextoConfiable, InstantaneaPolitica } from "../reglas/tipos.js";
import { crearEjecucion, type DatosPago } from "./crearEjecucion.js";
import { investigarEjecucion } from "./investigarEjecucion.js";

// Prueba end-to-end del hito del día 6 (checklist-implementacion.md, Bloque 2):
// crear una ejecución, evaluar las cinco reglas, persistirla, y que el
// agente de Dev 3 la investigue — con la IA todavía en modo simulado
// (AGENTE_PROVEEDOR=simulado, el valor por defecto en este repo).

const politica: InstantaneaPolitica = {
  version_politica: "politica-pagos-v1",
  version_motor: "1.0.0",
  "PAG-001": { umbral_aprobacion_centavos: 1_000_000 },
  "PAG-002": { categorias_permitidas: ["OPERACIONES", "SOFTWARE", "VIAJES"] },
};

describe("Flujo completo: motor -> persistencia -> agente (Dev 1 llama a Dev 3)", () => {
  it("un pago de $15,000 sin aprobación produce BLOQUEAR y el agente genera un informe PARCIAL válido", async () => {
    const fuente = new FuenteDatosMemoria();

    const pago: DatosPago = {
      pago_id: "PAG-2026-001",
      monto_centavos: 1_500_000,
      moneda: "MXN",
      categoria: "OPERACIONES",
      solicitante_id: "USU-001",
      presupuesto_id: "PRE-OPERACIONES-01",
    };
    const contexto: ContextoConfiable = {
      autorizacion: null,
      factura: { estado: "VERIFICADA" },
      presupuesto_disponible_centavos: 2_500_000,
    };

    const resultado = crearEjecucion(fuente, pago, contexto, politica);
    expect(resultado.decision).toBe("BLOQUEAR");

    // La ejecución ya quedó persistida antes de llamar al agente (contratos-api.md § 3).
    const persistida = await fuente.obtenerEjecucion(resultado.ejecucion_id);
    expect(persistida?.estado_ejecucion).toBe("PERSISTIDA");

    const investigacion = await investigarEjecucion(fuente, resultado);
    expect(investigacion.estado).toBe("PARCIAL");
    if (investigacion.estado === "FALLIDA") throw new Error("no debería fallar en modo simulado");

    // El informe que devuelve Dev 3 debe seguir siendo válido contra su propio esquema.
    const validacion = validarInforme(investigacion.informe);
    expect(validacion.valido).toBe(true);

    // El agente nunca puede cambiar la decisión que ya persistió el motor de reglas.
    expect(investigacion.informe.resumen_decision.decision).toBe("BLOQUEAR");
    expect(investigacion.informe.resumen_decision.agente_puede_anular).toBe(false);
  });

  it("un pago de $8,500 sin infracciones produce PERMITIR y el agente genera un informe COMPLETADA", async () => {
    const fuente = new FuenteDatosMemoria();

    const pago: DatosPago = {
      pago_id: "PAG-2026-002",
      monto_centavos: 850_000,
      moneda: "MXN",
      categoria: "SOFTWARE",
      solicitante_id: "USU-002",
      presupuesto_id: "PRE-SOFTWARE-01",
    };
    const contexto: ContextoConfiable = {
      autorizacion: null,
      factura: { estado: "VERIFICADA" },
      presupuesto_disponible_centavos: 2_500_000,
    };

    const resultado = crearEjecucion(fuente, pago, contexto, politica);
    expect(resultado.decision).toBe("PERMITIR");

    const investigacion = await investigarEjecucion(fuente, resultado);
    expect(investigacion.estado).toBe("COMPLETADA");
    if (investigacion.estado === "FALLIDA") throw new Error("no debería fallar en modo simulado");

    expect(validarInforme(investigacion.informe).valido).toBe(true);
    expect(investigacion.informe.resumen_decision.decision).toBe("PERMITIR");
  });
});
