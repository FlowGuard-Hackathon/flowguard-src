# Herramientas de lectura del agente

Las 5 herramientas que el agente puede pedir (`obtener_ejecucion`, `obtener_resultados_reglas`, `obtener_evidencia`, `obtener_contexto_pago`, `obtener_detalle_regla`). Son **solo lectura**: no escriben en la BD ni pueden tocar la `decision`. Especificación en [seguridad.md § 1.2](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/seguridad.md). Propietario: Dev 3.

Las herramientas no hablan con la BD directo: reciben una `FuenteDatosHerramientas` (interfaz en `tipos.ts`). Hoy se usa `FuenteDatosEnMemoria` (mock con datos simulados). Para pasar a datos reales solo cambia lo que les pasas:

```ts
import { crearHerramientasLectura } from "./index.js";

const herramientas = crearHerramientasLectura(new FuenteDatosSupabase(cliente)); // la escribe Dev 1
const res = await herramientas.obtener_ejecucion({ ejecucion_id: "EJE-2026-0001" });
// res = { ok: true, datos } | { ok: false, error: { codigo, mensaje } }
```

Los mensajes de error salen del catálogo `src/mensajes/es.ts`, no van escritos en el código.

## Para Dev 1: qué implementar

Una `FuenteDatosHerramientas` en `src/servidor/persistencia/` (sugerido: `fuenteDatosHerramientas.ts`) con un rol de BD de **solo SELECT**. Cada método sale de estas tablas ([base-datos.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/base-datos.md)):

| Método | Tablas | Notas |
|---|---|---|
| `obtenerEjecucion` | `ejecuciones` | `ejecucion_id` = `codigo_ejecucion`; `estado_ejecucion` siempre `"PERSISTIDA"` |
| `obtenerResultadosReglas` | `evaluaciones_reglas` | Siempre las 5 reglas, orden PAG-001..005. `null` si no existe la ejecución |
| `obtenerEvidencia` | `registros_evidencia` | `null` si la `ref_evidencia` no es de **esa** ejecución |
| `obtenerContextoPago` | `solicitudes_pago` + `saldos_presupuesto` | Importes en centavos (`*_centavos`) |
| `obtenerDetalleRegla` | `reglas_politica` | Política activa |

Reglas del contrato (detalle en los comentarios de `FuenteDatosHerramientas`): no existe → `null`; falla real → `throw` (la herramienta lo convierte en `DEPENDENCIA_NO_DISPONIBLE` sin filtrar el error).

## Preguntas abiertas para Dev 1

1. **`refs_evidencia` por regla.** `contratos-api.md § 3` las devuelve en cada regla, pero `evaluaciones_reglas` no tiene columna para eso y `base-datos.md` no dice cómo se relacionan regla y evidencia. ¿De dónde salen?
2. **`autorizacion_verificada`.** No hay tabla de aprobaciones. ¿Sale de un `registros_evidencia` tipo `REGISTRO_APROBACION` o del contexto confiable? Sin registro se devuelve `null` (nunca asumir aprobado).
3. **`reglas_politica.configuracion_json`.** Las claves de `configuracion` en `datosSimulados.ts` son supuestos; falta el formato real.
4. **Política activa.** ¿Cómo se resuelve cuál es (`definiciones_flujo.activa` o la `version_politica` de la ejecución)?

## Probar

```
npm test
npm run typecheck
```

`herramientas.test.ts` corre contra el mock. Para validar tu implementación, pásala a `crearHerramientasLectura` y repite los casos con datos reales (ejecución inexistente, `ref_evidencia` de otra ejecución, BD caída). El mock **no** valida nada contra Supabase real.

Los datos de `datosSimulados.ts` salen de los ejemplos de `contratos-api.md`; EV-0002 a EV-0005 y las claves de `configuracion` son supuestos. Se alinean con las fixtures de `flowguard-mocks` cuando Dev 5 las publique.
