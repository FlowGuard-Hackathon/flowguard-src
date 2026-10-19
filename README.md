# flowguard-src

Backend modular de FlowGuard: contratos compartidos, motor de reglas determinista, persistencia, orquestación de ejecuciones y el servicio de IA (agente + herramientas de lectura + adaptador Nebius).

**Responsables principales, por rutas:**

- **Dev 3** (agente, herramientas, Nebius y NVIDIA): `src/servidor/agente/`, `src/servidor/herramientas/` y `src/contratos/informe-evidencias.schema.ts`.
- **Dev 1** (reglas, persistencia, API): el resto del backend (`src/servidor/reglas/`, `src/servidor/ejecuciones/`, `src/servidor/persistencia/`, etc.).
- **Dev 5** propone y mantiene `src/contratos/{pago,ejecucion,motor}.schema.ts`; Dev 1 los valida. Dev 5 coordina la compatibilidad de los contratos compartidos sin apropiarse de las rutas de Dev 1 ni de Dev 3.
- **Dev 4** mantiene los workflows de CI/CD que correspondan, sin ser propietario de los módulos funcionales.

Las rutas definen propiedad de mantenimiento; los cambios que cruzan una frontera se acuerdan antes con el otro propietario. Detalle en [flowguard-docs/README.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/README.md#propiedad-por-rutas-en-flowguard-src).

## Guía rápida para agentes de IA y desarrolladores

Esta sección dice qué comandos ejecutar, qué resultado esperar y qué se puede o no se puede hacer. Si algo aquí contradice a [flowguard-docs](https://github.com/FlowGuard-Hackathon/flowguard-docs), manda `flowguard-docs`.

### 1. Requisitos

| Comprobación | Comando | Resultado esperado |
|---|---|---|
| Node.js | `node -v` | Verificado con `v20.20.0`. Vitest 5 declara requerir Node 22.12 o superior (muestra una advertencia `EBADENGINE` con Node 20), pero las pruebas actuales pasan con Node 20 |
| npm | `npm -v` | Cualquier versión reciente (verificado con `10.8.2`) |

Stack: TypeScript `^5.7.2`, Zod `^3.24.1`, Vitest `^5.0.5`. No hay framework de servidor en este repo: el código se consume desde los Route Handlers de `flowguard-app`.

### 2. Comandos

Ejecútalos desde la raíz del repositorio.

| Para... | Comando | Resultado esperado |
|---|---|---|
| Instalar dependencias | `npm install` | Termina sin errores y crea `node_modules/` |
| Crear tu `.env` local (PowerShell) | `Copy-Item .env.example .env` | Crea `.env` con `AGENTE_PROVEEDOR=simulado`. **Nunca se sube a Git** |
| Crear tu `.env` local (Git Bash/Linux/macOS) | `cp .env.example .env` | Igual que el anterior |
| Ejecutar todas las pruebas | `npm test` | `Test Files 5 passed`, `Tests 38 passed` (estado actual; es la salida de Vitest, en inglés) |
| Ejecutar una sola prueba | `npx vitest run src/servidor/herramientas/herramientas.test.ts` | Esa suite pasa (17 pruebas) |
| Ejecutar el flujo completo (motor → persistencia → agente) | `npx vitest run src/servidor/ejecuciones/flujoCompleto.test.ts` | 2 pruebas: pago bloqueado e informe `PARCIAL`; pago permitido e informe `COMPLETADA` |
| Pruebas en modo observación | `npm run test:watch` | Reejecuta al guardar; se detiene con `Ctrl+C` |
| Comprobar tipos | `npm run typecheck` | Sin salida de error y código de salida 0 |

No existen scripts de `build`, `lint` ni `start`. No los inventes ni los agregues sin acordarlo con el propietario de la ruta.

### 3. Antes de dar una tarea por terminada

Ejecuta, y ambos deben terminar sin errores:

```
npm test
npm run typecheck
```

Toda lógica nueva lleva su prueba en Vitest. Una tarea no está terminada solo porque el código "debería funcionar": debe existir evidencia verificable ([definicion-de-terminado.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/definicion-de-terminado.md)). Un mock no cuenta como validación del proveedor real (Nebius) ni de Supabase real.

### 4. Mapa de archivos

| Ruta | Propietario | Estado |
|---|---|---|
| `src/contratos/informe-evidencias.schema.ts` | Dev 3 | Existe (contrato Zod del informe del agente) |
| `src/contratos/{pago,ejecucion,motor}.schema.ts` | Dev 5 propone, Dev 1 valida | **No existen todavía** |
| `src/servidor/agente/` | Dev 3 | `proveedorSimulado.ts` funcional y probado; `proveedorNebius.ts` pendiente; `validarInforme.ts`, `prompt.ts`, `tipos.ts`, `index.ts` (selecciona proveedor con `AGENTE_PROVEEDOR`) |
| `src/servidor/herramientas/` | Dev 3 | 5 herramientas de lectura implementadas sobre la interfaz `FuenteDatosHerramientas`, con mock en memoria y 17 pruebas. Falta la implementación real de Dev 1: ver `src/servidor/herramientas/README.md` |
| `src/mensajes/` | Compartido | Catálogo de textos visibles (`es.ts`). Para otro idioma se agrega otro archivo con el mismo tipo |
| `src/servidor/reglas/` | Dev 1 | `motor.ts` — `evaluarPago()` con las cinco reglas `PAG-001..005` en orden estable, sin I/O. 12 pruebas, incluidos los 10 casos obligatorios de reglas.md § 4 |
| `src/servidor/persistencia/` | Dev 1 | `fuenteDatosMemoria.ts` — implementación **en memoria** (no Supabase todavía) de `FuenteDatosHerramientas` (la interfaz de Dev 3). 5 pruebas |
| `src/servidor/ejecuciones/` | Dev 1 | `crearEjecucion.ts` (motor → evidencia → persistencia) e `investigarEjecucion.ts` (llama al agente de Dev 3 con la ejecución ya persistida). 2 pruebas de integración end-to-end |
| `src/compartido/` | Dev 1 | Carpeta vacía (`.gitkeep`) |
| `.env.example` | Compartido | Variables documentadas, con valores de ejemplo |

### 5. Qué hacer ahora

**Dev 1 — ya avanzado:**

1. ✅ Motor de reglas (`src/servidor/reglas/motor.ts`): `evaluarPago(solicitud, contextoConfiable, instantaneaPolitica)`, sin I/O, 12 pruebas (incluye los 10 casos obligatorios de [reglas.md § 4](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/reglas.md#4-casos-de-prueba-obligatorios)).
2. ✅ `FuenteDatosHerramientas` implementada **en memoria** en `src/servidor/persistencia/fuenteDatosMemoria.ts` (no contra Supabase real todavía — eso sigue pendiente, ver punto 4).
3. ✅ Orquestación mínima en `src/servidor/ejecuciones/`: `crearEjecucion()` (motor → evidencia → persistencia) e `investigarEjecucion()` (llama al agente de Dev 3 con la ejecución real). Prueba end-to-end en `flujoCompleto.test.ts`.
4. **Pendiente:** aplicar la migración `001_esquema_inicial.sql` de `flowguard-supabase` en un proyecto Supabase real y reemplazar `FuenteDatosMemoria` por una `FuenteDatosSupabase` — eso sí requiere credenciales y decide las [preguntas abiertas de `src/servidor/herramientas/README.md`](src/servidor/herramientas/README.md) (`refs_evidencia`, `autorizacion_verificada`, formato de `configuracion_json`).
5. **Pendiente:** endpoints HTTP (`POST /api/v1/ejecuciones`, etc.) — hoy `crearEjecucion`/`investigarEjecucion` se llaman directo desde las pruebas, no desde una ruta.

**Dev 3 (días 3–5)** — detalle en [desarrolladores/desarrollador-3/plan-trabajo.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/desarrolladores/desarrollador-3/plan-trabajo.md): las cinco herramientas ya funcionan contra datos simulados (día 4) **y** contra la implementación en memoria de Dev 1 (verificado en `fuenteDatosMemoria.test.ts`). Pendiente: cerrar la fixture `investigacion-fallida.json` con Dev 5 y la implementación real contra Supabase (punto 4 de arriba).

**Bloqueo conocido:** los contratos `pago`, `ejecucion` y `motor` siguen sin existir como esquemas Zod compartidos (`src/contratos/`). Mientras tanto, `src/servidor/reglas/tipos.ts` y `src/servidor/ejecuciones/` usan tipos **provisionales**, documentados como tales en el código — no los asumas como el contrato final. No los cambies por tu cuenta: los propone Dev 5 y los valida Dev 1. Guíate por [contratos-api.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/contratos-api.md).

### 6. Reglas obligatorias

- **Respeta la propiedad por rutas.** No edites rutas de otro puesto sin acordarlo antes con su propietario.
- **El motor determinista decide.** Debe ser una biblioteca independiente: no importa React, el cliente de Nebius ni código del frontend ([reglas.md § 1](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/reglas.md#1-principios-de-implementación)). No cambies las reglas ni sus umbrales. `PERMITIR` solo si todas las comprobaciones obligatorias pasan; `BLOQUEAR` si alguna falla o queda `INDETERMINADO`.
- **El agente solo investiga.** No puede autorizar pagos, cambiar reglas, escribir en la base de datos mediante herramientas ni sustituir al motor ([seguridad.md § 1](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/seguridad.md)). Las herramientas son de solo lectura. La ausencia de evidencia nunca se interpreta como cumplimiento.
- **Persistencia:** usa las funciones de [base-datos.md § 5](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/base-datos.md) (`fn_programar_intento_investigacion`, `fn_finalizar_intento_investigacion`, `fn_recuperar_intentos_abandonados`, `fn_verificar_limite_solicitudes`) en lugar de SQL ad hoc. No modifiques la migración desde este repo.
- **Dinero:** la conversión de pesos a centavos (`monto_centavos`) pasa por una única función centralizada ([contratos-api.md § 2](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/contratos-api.md#2-conversión-e-idempotencia-reglas-transversales)).
- **Validación:** valida con Zod en los bordes. No cambies endpoints, campos, estados ni formatos de error documentados.
- **Secretos:** nunca subas `.env` ni claves reales. `.env.example` solo lleva valores de ejemplo. No hagas llamadas reales a Nebius sin credenciales válidas y sin completar la checklist de [seguridad.md § 1.8](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/seguridad.md#18-lista-de-verificación-de-compatibilidad-con-nebius); mientras tanto `AGENTE_PROVEEDOR=simulado`.
- **No agregues** dependencias, frameworks, lint o scripts nuevos sin acordarlo con el propietario de la ruta.

### 7. Flujo de Git

- Nadie trabaja sobre `main`: crea una rama corta, abre un Pull Request y pide revisión a los responsables de los módulos afectados.
- No fusiones tu propio PR sin revisión.
- Mensajes de commit descriptivos, en español.
- Convención de este repositorio: no se añaden líneas `Co-Authored-By` ni menciones a herramientas de IA en commits ni en PRs.

## Alcance

Según [flowguard-docs/arquitectura.md § 3](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/arquitectura.md#3-estructura-del-repositorio), este repo corresponde a la carpeta `src/`:

```
src/
├── contratos/
│   ├── pago.schema.ts
│   ├── ejecucion.schema.ts
│   ├── motor.schema.ts
│   └── informe-evidencias.schema.ts
├── servidor/
│   ├── reglas/
│   ├── ejecuciones/
│   ├── persistencia/
│   ├── agente/
│   └── herramientas/
└── compartido/
```

## Documentos de referencia obligatorios antes de escribir código

- [flowguard-docs/reglas.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/reglas.md) — las cinco reglas de negocio.
- [flowguard-docs/base-datos.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/base-datos.md) — modelo de datos, estados, y las funciones PL/pgSQL (`fn_programar_intento_investigacion`, `fn_finalizar_intento_investigacion`, `fn_recuperar_intentos_abandonados`) que `src/servidor/persistencia/` y `src/servidor/ejecuciones/` deben invocar.
- [flowguard-docs/seguridad.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/seguridad.md) — ciclo de investigación del agente, prompt, límites, y rate limiting (`fn_verificar_limite_solicitudes`).
- [flowguard-docs/contratos-api.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/contratos-api.md) — contratos exactos que `src/contratos/` debe reflejar en Zod.

## Dependencias de otros repos

- `flowguard-supabase`: esquema y funciones de base de datos contra las que este código escribe/lee.
- `flowguard-app`: consume estos módulos desde los Route Handlers.
- `flowguard-mocks`: fixtures para pruebas de contrato y del agente (las publica Dev 5).

## Estado actual

- **Dev 3 (agente, herramientas, Nebius):** esqueleto inicializado.
  - `src/contratos/informe-evidencias.schema.ts` — contrato Zod del informe del agente (contratos-api.md § 10).
  - `src/servidor/agente/` — `proveedorSimulado.ts` (proveedor mock funcional y probado), `proveedorNebius.ts` (pendiente de implementar hasta completar seguridad.md § 1.8), `validarInforme.ts`, `prompt.ts`, selección por `AGENTE_PROVEEDOR` en `index.ts`.
  - `src/servidor/herramientas/` — las cinco herramientas de lectura, con parámetros validados con Zod y errores del catálogo, sobre la interfaz `FuenteDatosHerramientas`. Hoy corren con un mock en memoria (`FuenteDatosEnMemoria`); Dev 1 publica la implementación real.
  - Pruebas: `proveedorSimulado.test.ts` (informe simulado contra el esquema) y `herramientas.test.ts` (las cinco herramientas) — 19 de las 38 pruebas totales del repo (`npm test`).
- **Dev 1 (reglas, persistencia, ejecuciones):**
  - `src/servidor/reglas/motor.ts` — `evaluarPago()` con las cinco reglas, sin I/O, 12 pruebas.
  - `src/servidor/persistencia/fuenteDatosMemoria.ts` — `FuenteDatosHerramientas` en memoria (no Supabase real), 5 pruebas.
  - `src/servidor/ejecuciones/` — `crearEjecucion()` + `investigarEjecucion()`, orquestando el flujo completo y llamando al agente de Dev 3 con datos reales de la ejecución. 2 pruebas end-to-end.
  - `src/compartido/` sigue vacía (`.gitkeep`).
  - `src/contratos/{pago,ejecucion,motor}.schema.ts` **todavía no existen** como contrato Zod compartido — los propone Dev 5 y Dev 1 los valida; mientras tanto se usan tipos provisionales en `src/servidor/reglas/tipos.ts`.
  - **No implementado todavía:** conexión real a Supabase (sigue siendo en memoria) ni endpoints HTTP (`POST /api/v1/ejecuciones`, etc.).
