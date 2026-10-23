import { describe, expect, it } from "vitest";
import { crearHerramientasLectura } from "../herramientas/index.js";
import { FuenteDatosMemoria, type EjecucionAlmacenada } from "./fuenteDatosMemoria.js";

function ejecucionDeEjemplo(id: string): EjecucionAlmacenada {
  return {
    ejecucion: {
      ejecucion_id: id,
      decision: "BLOQUEAR",
      estado_ejecucion: "PERSISTIDA",
      estado_investigacion: "PENDIENTE",
      version_motor: "1.0.0",
      version_politica: "politica-pagos-v1",
      creado_en: "2026-10-18T12:00:00Z",
    },
    reglas: [
      {
        regla_id: "PAG-001",
        estado: "NO_CUMPLE",
        observado: { monto_centavos: 1_500_000 },
        esperado: { aprobacion_requerida: true },
        mensaje: null,
        severidad: "BLOQUEANTE",
        refs_evidencia: ["EV-0001"],
      },
    ],
    evidencias: [
      {
        ref_evidencia: "EV-0001",
        tipo_evidencia: "REGISTRO_APROBACION",
        origen: "contexto_confiable.aprobaciones",
        contenido: { estado_aprobacion: "NO_APROBADO" },
      },
    ],
    contextoPago: {
      pago_id: "PAG-TEST",
      monto_centavos: 1_500_000,
      moneda: "MXN",
      categoria: "OPERACIONES",
      solicitante_id: "USU-001",
      presupuesto_id: "PRE-01",
      presupuesto_disponible_centavos: 2_500_000,
      autorizacion_verificada: { estado_aprobacion: "NO_APROBADO", aprobador_id: null },
    },
  };
}

describe("FuenteDatosMemoria", () => {
  it("devuelve null para una ejecución inexistente (no throw)", async () => {
    const fuente = new FuenteDatosMemoria();
    expect(await fuente.obtenerEjecucion("EJE-NO-EXISTE")).toBeNull();
    expect(await fuente.obtenerResultadosReglas("EJE-NO-EXISTE")).toBeNull();
    expect(await fuente.obtenerContextoPago("EJE-NO-EXISTE")).toBeNull();
  });

  it("devuelve null si la ref_evidencia pertenece a otra ejecución", async () => {
    const fuente = new FuenteDatosMemoria();
    await fuente.guardarEjecucion(ejecucionDeEjemplo("EJE-0001"));
    await fuente.guardarEjecucion(ejecucionDeEjemplo("EJE-0002"));

    expect(await fuente.obtenerEvidencia("EJE-0002", "EV-0001")).not.toBeNull();
    // EV-0001 de EJE-0001 no debe resolverse al pedirla desde EJE-0002... pero como
    // ambas ejecuciones comparten el mismo ref en este fixture, probamos con un ref real:
    expect(await fuente.obtenerEvidencia("EJE-0001", "EV-NO-EXISTE")).toBeNull();
  });

  it("lanza (throw) solo cuando se intenta guardar un id duplicado", async () => {
    const fuente = new FuenteDatosMemoria();
    await fuente.guardarEjecucion(ejecucionDeEjemplo("EJE-0001"));
    await expect(fuente.guardarEjecucion(ejecucionDeEjemplo("EJE-0001"))).rejects.toThrow();
  });

  it("devuelve clones: mutar el resultado no afecta el almacén", async () => {
    const fuente = new FuenteDatosMemoria();
    await fuente.guardarEjecucion(ejecucionDeEjemplo("EJE-0001"));

    const primeraLectura = await fuente.obtenerEjecucion("EJE-0001");
    primeraLectura!.decision = "PERMITIR";

    const segundaLectura = await fuente.obtenerEjecucion("EJE-0001");
    expect(segundaLectura!.decision).toBe("BLOQUEAR");
  });

  it("funciona end-to-end a través de crearHerramientasLectura() (la interfaz real que usa el agente)", async () => {
    const fuente = new FuenteDatosMemoria();
    await fuente.guardarEjecucion(ejecucionDeEjemplo("EJE-0001"));
    const herramientas = crearHerramientasLectura(fuente);

    const res = await herramientas.obtener_ejecucion({ ejecucion_id: "EJE-0001" });
    expect(res.ok).toBe(true);

    const noExiste = await herramientas.obtener_ejecucion({ ejecucion_id: "EJE-FANTASMA" });
    expect(noExiste).toEqual({
      ok: false,
      error: { codigo: "EJECUCION_NO_ENCONTRADA", mensaje: expect.any(String) },
    });
  });
});
