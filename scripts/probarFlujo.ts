// Script manual para ver el flujo completo corriendo, no solo pasando pruebas.
// Uso: npx tsx scripts/probarFlujo.ts
import { crearEjecucion, type DatosPago } from "../src/servidor/ejecuciones/crearEjecucion.js";
import { investigarEjecucion } from "../src/servidor/ejecuciones/investigarEjecucion.js";
import { FuenteDatosMemoria } from "../src/servidor/persistencia/fuenteDatosMemoria.js";
import type { ContextoConfiable, InstantaneaPolitica } from "../src/servidor/reglas/tipos.js";

const politica: InstantaneaPolitica = {
  version_politica: "politica-pagos-v1",
  version_motor: "1.0.0",
  "PAG-001": { umbral_aprobacion_centavos: 1_000_000 },
  "PAG-002": { categorias_permitidas: ["OPERACIONES", "SOFTWARE", "VIAJES"] },
};

async function probar(nombre: string, pago: DatosPago, contexto: ContextoConfiable) {
  console.log(`\n=== ${nombre} ===`);
  const fuente = new FuenteDatosMemoria();

  const resultado = crearEjecucion(fuente, pago, contexto, politica);
  console.log("Decisión del motor:", resultado.decision);
  console.log("Resultados por regla:", resultado.resultados.map((r) => `${r.regla_id}=${r.estado}`).join(", "));

  const investigacion = await investigarEjecucion(fuente, resultado);
  console.log("Estado de la investigación (agente Dev 3):", investigacion.estado);
  if (investigacion.estado !== "FALLIDA") {
    console.log("Informe del agente:\n", JSON.stringify(investigacion.informe, null, 2));
  }
}

await probar(
  "Pago de $15,000 sin aprobación (debería BLOQUEAR)",
  {
    pago_id: "PAG-DEMO-001",
    monto_centavos: 1_500_000,
    moneda: "MXN",
    categoria: "OPERACIONES",
    solicitante_id: "USU-001",
    presupuesto_id: "PRE-OPERACIONES-01",
  },
  { autorizacion: null, factura: { estado: "VERIFICADA" }, presupuesto_disponible_centavos: 2_500_000 },
);

await probar(
  "Pago de $8,500 sin infracciones (debería PERMITIR)",
  {
    pago_id: "PAG-DEMO-002",
    monto_centavos: 850_000,
    moneda: "MXN",
    categoria: "SOFTWARE",
    solicitante_id: "USU-002",
    presupuesto_id: "PRE-SOFTWARE-01",
  },
  { autorizacion: null, factura: { estado: "VERIFICADA" }, presupuesto_disponible_centavos: 2_500_000 },
);
