import { describe, expect, it } from "vitest";
import {
  crearHerramientasLectura,
  FuenteDatosEnMemoria,
  SEMILLA_SIMULADA,
  type FuenteDatosHerramientas,
} from "./index.js";

const herramientas = crearHerramientasLectura(new FuenteDatosEnMemoria());
const BLOQUEADA = "EJE-2026-0001";
const PERMITIDA = "EJE-2026-0002";

describe("herramientas de lectura con datos simulados", () => {
  it("obtener_ejecucion devuelve la decisión persistida", async () => {
    const res = await herramientas.obtener_ejecucion({ ejecucion_id: BLOQUEADA });
    expect(res).toMatchObject({ ok: true, datos: { decision: "BLOQUEAR", estado_ejecucion: "PERSISTIDA" } });
  });

  it("obtener_resultados_reglas devuelve las cinco reglas en orden", async () => {
    const res = await herramientas.obtener_resultados_reglas({ ejecucion_id: BLOQUEADA });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.datos.map((r) => r.regla_id)).toEqual(["PAG-001", "PAG-002", "PAG-003", "PAG-004", "PAG-005"]);
    expect(res.datos[0]?.estado).toBe("NO_CUMPLE");
  });

  it("obtener_evidencia devuelve el registro pedido", async () => {
    const res = await herramientas.obtener_evidencia({ ejecucion_id: BLOQUEADA, ref_evidencia: "EV-0001" });
    expect(res).toMatchObject({ ok: true, datos: { tipo_evidencia: "REGISTRO_APROBACION" } });
  });

  it("obtener_contexto_pago devuelve el monto en centavos y la autorización verificada", async () => {
    const res = await herramientas.obtener_contexto_pago({ ejecucion_id: BLOQUEADA });
    expect(res).toMatchObject({
      ok: true,
      datos: { monto_centavos: 1500000, autorizacion_verificada: { estado_aprobacion: "NO_APROBADO" } },
    });
  });

  it("obtener_detalle_regla devuelve la política activa", async () => {
    const res = await herramientas.obtener_detalle_regla({ regla_id: "PAG-001" });
    expect(res).toMatchObject({ ok: true, datos: { configuracion: { umbral_aprobacion_centavos: 1000000 } } });
  });
});

describe("errores", () => {
  it("ejecución inexistente -> EJECUCION_NO_ENCONTRADA en las herramientas que dependen de ella", async () => {
    const id = { ejecucion_id: "EJE-NO-EXISTE" };
    const resultados = await Promise.all([
      herramientas.obtener_ejecucion(id),
      herramientas.obtener_resultados_reglas(id),
      herramientas.obtener_contexto_pago(id),
      herramientas.obtener_evidencia({ ...id, ref_evidencia: "EV-0001" }),
    ]);
    for (const res of resultados) {
      expect(res).toMatchObject({ ok: false, error: { codigo: "EJECUCION_NO_ENCONTRADA" } });
    }
  });

  it("ref_evidencia inexistente -> REFERENCIA_EVIDENCIA_INVALIDA", async () => {
    const res = await herramientas.obtener_evidencia({ ejecucion_id: BLOQUEADA, ref_evidencia: "EV-9999" });
    expect(res).toMatchObject({ ok: false, error: { codigo: "REFERENCIA_EVIDENCIA_INVALIDA" } });
  });

  it("no entrega evidencia de otra ejecución", async () => {
    // EV-0004 existe en la ejecución bloqueada pero no en la permitida
    const res = await herramientas.obtener_evidencia({ ejecucion_id: PERMITIDA, ref_evidencia: "EV-0004" });
    expect(res).toMatchObject({ ok: false, error: { codigo: "REFERENCIA_EVIDENCIA_INVALIDA" } });
  });

  it.each([
    ["falta ejecucion_id", "obtener_ejecucion", {}],
    ["ejecucion_id vacío", "obtener_ejecucion", { ejecucion_id: "  " }],
    ["parámetro de más", "obtener_ejecucion", { ejecucion_id: BLOQUEADA, extra: 1 }],
    ["regla_id fuera del catálogo", "obtener_detalle_regla", { regla_id: "PAG-999" }],
    ["falta ref_evidencia", "obtener_evidencia", { ejecucion_id: BLOQUEADA }],
  ] as const)("parámetros inválidos (%s) -> ERROR_VALIDACION", async (_caso, herramienta, params) => {
    const res = await herramientas[herramienta](params);
    expect(res).toMatchObject({ ok: false, error: { codigo: "ERROR_VALIDACION" } });
  });

  it("si la fuente de datos truena -> DEPENDENCIA_NO_DISPONIBLE sin filtrar el error original", async () => {
    const rota: FuenteDatosHerramientas = {
      obtenerEjecucion: async () => { throw new Error("password authentication failed for user postgres"); },
      obtenerResultadosReglas: async () => { throw new Error("boom"); },
      obtenerEvidencia: async () => { throw new Error("boom"); },
      obtenerContextoPago: async () => { throw new Error("boom"); },
      obtenerDetalleRegla: async () => { throw new Error("boom"); },
    };
    const res = await crearHerramientasLectura(rota).obtener_ejecucion({ ejecucion_id: BLOQUEADA });
    expect(res).toMatchObject({ ok: false, error: { codigo: "DEPENDENCIA_NO_DISPONIBLE" } });
    expect(JSON.stringify(res)).not.toContain("postgres");
  });
});

describe("garantías del mock", () => {
  it("las herramientas no mutan los datos de origen", async () => {
    const res = await herramientas.obtener_ejecucion({ ejecucion_id: BLOQUEADA });
    if (res.ok) res.datos.decision = "PERMITIR";
    const otraVez = await herramientas.obtener_ejecucion({ ejecucion_id: BLOQUEADA });
    expect(otraVez).toMatchObject({ ok: true, datos: { decision: "BLOQUEAR" } });
  });

  it("la fuente de datos solo expone métodos de lectura", () => {
    const metodos = Object.getOwnPropertyNames(FuenteDatosEnMemoria.prototype).filter((m) => m !== "constructor");
    expect(metodos.every((m) => m.startsWith("obtener"))).toBe(true);
  });

  it("toda ref_evidencia que cita una regla existe en la ejecución", () => {
    for (const eje of Object.values(SEMILLA_SIMULADA.ejecuciones)) {
      const conocidas = new Set(eje.evidencias.map((e) => e.ref_evidencia));
      for (const regla of eje.reglas) {
        for (const ref of regla.refs_evidencia) expect(conocidas.has(ref)).toBe(true);
      }
    }
  });
});
