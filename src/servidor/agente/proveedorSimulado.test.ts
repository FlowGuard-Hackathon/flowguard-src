import { describe, expect, it } from "vitest";
import { ProveedorAgenteSimulado } from "./proveedorSimulado.js";
import type { EntradaInvestigacion } from "./tipos.js";
import { validarInforme } from "./validarInforme.js";

describe("ProveedorAgenteSimulado", () => {
  const proveedor = new ProveedorAgenteSimulado();

  it("produce un informe válido contra el esquema cuando la decisión es PERMITIR", async () => {
    const entrada: EntradaInvestigacion = { ejecucionId: "EJE-PRUEBA-0001", decision: "PERMITIR", infracciones: [] };

    const resultado = await proveedor.investigar(entrada);
    expect(resultado.estado).toBe("COMPLETADA");
    expect(validarInforme(resultado.estado !== "FALLIDA" ? resultado.informe : null).valido).toBe(true);
  });

  it("produce un informe válido contra el esquema cuando la decisión es BLOQUEAR", async () => {
    const entrada: EntradaInvestigacion = {
      ejecucionId: "EJE-PRUEBA-0002",
      decision: "BLOQUEAR",
      infracciones: [{ regla_id: "PAG-001", resultado: "NO_CUMPLE" }],
    };

    const resultado = await proveedor.investigar(entrada);
    expect(resultado.estado).toBe("PARCIAL");
    expect(validarInforme(resultado.estado !== "FALLIDA" ? resultado.informe : null).valido).toBe(true);
  });
});
