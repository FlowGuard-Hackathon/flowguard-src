# flowguard-src

Backend modular de FlowGuard: contratos compartidos, motor de reglas determinista, persistencia, orquestación de ejecuciones y el servicio de IA (agente + herramientas de lectura + adaptador Nebius).

**Responsables principales, por rutas:**

- **Dev 3** (agente, herramientas, Nebius y NVIDIA): `src/server/agent/`, `src/server/tools/` y `src/contracts/evidence-report.schema.ts`.
- **Dev 1** (reglas, persistencia, API): el resto del backend (`src/server/rules/`, `src/server/executions/`, `src/server/persistence/`, etc.).
- **Dev 5** propone y mantiene `src/contracts/{payment,execution,engine}.schema.ts`; Dev 1 los valida. Dev 5 coordina la compatibilidad de los contratos compartidos sin apropiarse de las rutas de Dev 1 ni de Dev 3.
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
| Crear tu `.env` local (PowerShell) | `Copy-Item .env.example .env` | Crea `.env` con `AGENT_PROVIDER=mock`. **Nunca se sube a Git** |
| Crear tu `.env` local (Git Bash/Linux/macOS) | `cp .env.example .env` | Igual que el anterior |
| Ejecutar todas las pruebas | `npm test` | `Test Files 1 passed`, `Tests 2 passed` (estado actual) |
| Ejecutar una sola prueba | `npx vitest run src/server/agent/mockProvider.test.ts` | Esa prueba pasa |
| Pruebas en modo observación | `npm run test:watch` | Reejecuta al guardar; se detiene con `Ctrl+C` |
| Comprobar tipos | `npm run typecheck` | Sin salida de error y código de salida 0 |

No existen scripts de `build`, `lint` ni `start`. No los inventes ni los agregues sin acordarlo con el propietario de la ruta.

### 3. Antes de dar una tarea por terminada

Ejecuta, y ambos deben terminar sin errores:

```
npm test
npm run typecheck
```

Toda lógica nueva lleva su prueba en Vitest. Una tarea no está terminada solo porque el código "debería funcionar": debe existir evidencia verificable ([definition-of-done.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/definition-of-done.md)). Un mock no cuenta como validación del proveedor real (Nebius) ni de Supabase real.

### 4. Mapa de archivos

| Ruta | Propietario | Estado |
|---|---|---|
| `src/contracts/evidence-report.schema.ts` | Dev 3 | Existe (contrato Zod del informe del agente) |
| `src/contracts/{payment,execution,engine}.schema.ts` | Dev 5 propone, Dev 1 valida | **No existen todavía** |
| `src/server/agent/` | Dev 3 | `mockProvider.ts` funcional y probado; `nebiusProvider.ts` pendiente; `validateReport.ts`, `prompt.ts`, `types.ts`, `index.ts` (selecciona proveedor con `AGENT_PROVIDER`) |
| `src/server/tools/` | Dev 3 | Firmas de las 5 herramientas de lectura; lanzan `NotImplementedError` |
| `src/server/rules/` | Dev 1 | Carpeta vacía (`.gitkeep`) |
| `src/server/executions/` | Dev 1 | Carpeta vacía (`.gitkeep`) |
| `src/server/persistence/` | Dev 1 | Carpeta vacía (`.gitkeep`) |
| `src/shared/` | Dev 1 | Carpeta vacía (`.gitkeep`) |
| `.env.example` | Compartido | Variables documentadas, con valores de ejemplo |

### 5. Qué hacer ahora

**Dev 1 (Bloque 1, días 1–3)** — detalle en [developers/developer-1/work-plan.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/developers/developer-1/work-plan.md):

1. Implementar el motor en `src/server/rules/` con la firma de [rules.md § 1](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/rules.md#1-principios-de-implementación): `evaluatePayment(request, trustedContext, policySnapshot): EngineDecision`.
2. Implementar las cinco reglas `PAY-001` a `PAY-005` en orden estable. Cada resultado incluye: identificador y versión de regla, estado (`PASS`, `FAIL` o `INDETERMINATE`), datos observados, datos esperados, mensaje explicativo, referencias a evidencia y severidad.
3. Hacer pasar los 10 casos de [rules.md § 4](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/rules.md#4-casos-de-prueba-obligatorios) con Vitest.
4. Aplicar la migración `001_initial_schema.sql` de `flowguard-supabase` en un proyecto Supabase de desarrollo.

**Dev 3 (días 3–5)** — detalle en [developers/developer-3/work-plan.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/developers/developer-3/work-plan.md): cerrar la fixture `investigation-failed.json` con Dev 5, implementar las cinco herramientas de lectura contra datos mock y luego contra datos reales, cuando Dev 1 publique la persistencia.

**Bloqueo conocido:** los contratos `payment`, `execution` y `engine` no existen. No los inventes ni los cambies por tu cuenta: los propone Dev 5 y los valida Dev 1. Mientras tanto, guíate por [api-contracts.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/api-contracts.md).

### 6. Reglas obligatorias

- **Respeta la propiedad por rutas.** No edites rutas de otro puesto sin acordarlo antes con su propietario.
- **El motor determinista decide.** Debe ser una biblioteca independiente: no importa React, el cliente de Nebius ni código del frontend ([rules.md § 1](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/rules.md#1-principios-de-implementación)). No cambies las reglas ni sus umbrales. `ALLOW` solo si todas las comprobaciones obligatorias pasan; `BLOCK` si alguna falla o queda `INDETERMINATE`.
- **El agente solo investiga.** No puede autorizar pagos, cambiar reglas, escribir en la base de datos mediante herramientas ni sustituir al motor ([security.md § 1](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/security.md)). Las herramientas son de solo lectura. La ausencia de evidencia nunca se interpreta como cumplimiento.
- **Persistencia:** usa las funciones de [database.md § 5](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/database.md) (`fn_schedule_investigation_attempt`, `fn_finalize_investigation_attempt`, `fn_reap_abandoned_attempts`, `fn_check_rate_limit`) en lugar de SQL ad hoc. No modifiques la migración desde este repo.
- **Dinero:** la conversión de pesos a centavos (`amount_minor`) pasa por una única función centralizada ([api-contracts.md § 2](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/api-contracts.md#2-conversión-e-idempotencia-reglas-transversales)).
- **Validación:** valida con Zod en los bordes. No cambies endpoints, campos, estados ni formatos de error documentados.
- **Secretos:** nunca subas `.env` ni claves reales. `.env.example` solo lleva valores de ejemplo. No hagas llamadas reales a Nebius sin credenciales válidas y sin completar la checklist de [security.md § 1.8](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/security.md#18-lista-de-verificación-de-compatibilidad-con-nebius); mientras tanto `AGENT_PROVIDER=mock`.
- **No agregues** dependencias, frameworks, lint o scripts nuevos sin acordarlo con el propietario de la ruta.

### 7. Flujo de Git

- Nadie trabaja sobre `main`: crea una rama corta, abre un Pull Request y pide revisión a los responsables de los módulos afectados.
- No fusiones tu propio PR sin revisión.
- Mensajes de commit descriptivos, en español.
- Convención de este repositorio: no se añaden líneas `Co-Authored-By` ni menciones a herramientas de IA en commits ni en PRs.

## Alcance

Según [flowguard-docs/architecture.md § 3](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/architecture.md#3-estructura-del-repositorio), este repo corresponde a la carpeta `src/`:

```
src/
├── contracts/
│   ├── payment.schema.ts
│   ├── execution.schema.ts
│   ├── engine.schema.ts
│   └── evidence-report.schema.ts
├── server/
│   ├── rules/
│   ├── executions/
│   ├── persistence/
│   ├── agent/
│   └── tools/
└── shared/
```

## Documentos de referencia obligatorios antes de escribir código

- [flowguard-docs/rules.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/rules.md) — las cinco reglas de negocio.
- [flowguard-docs/database.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/database.md) — modelo de datos, estados, y las funciones PL/pgSQL (`fn_schedule_investigation_attempt`, `fn_finalize_investigation_attempt`, `fn_reap_abandoned_attempts`) que `src/server/persistence/` y `src/server/executions/` deben invocar.
- [flowguard-docs/security.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/security.md) — ciclo de investigación del agente, prompt, límites, y rate limiting (`fn_check_rate_limit`).
- [flowguard-docs/api-contracts.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/api-contracts.md) — contratos exactos que `src/contracts/` debe reflejar en Zod.

## Dependencias de otros repos

- `flowguard-supabase`: esquema y funciones de base de datos contra las que este código escribe/lee.
- `flowguard-app`: consume estos módulos desde los Route Handlers.
- `flowguard-mocks`: fixtures para pruebas de contrato y del agente (las publica Dev 5).

## Estado actual

- **Dev 3 (agente, herramientas, Nebius):** esqueleto inicializado.
  - `src/contracts/evidence-report.schema.ts` — contrato Zod del informe del agente (api-contracts.md § 10).
  - `src/server/agent/` — `mockProvider.ts` (proveedor mock funcional y probado), `nebiusProvider.ts` (pendiente de implementar hasta completar security.md § 1.8), `validateReport.ts`, `prompt.ts`, selección por `AGENT_PROVIDER` en `index.ts`.
  - `src/server/tools/` — firmas de las cinco herramientas de lectura; lanzan `NotImplementedError` hasta que Dev 1 publique `src/server/persistence/`.
  - Prueba unitaria (`mockProvider.test.ts`) validando el mock contra el esquema — `npm test` pasa.
- **Dev 1 (reglas, persistencia, API):** las carpetas `src/server/rules/`, `src/server/executions/`, `src/server/persistence/` y `src/shared/` **ya existen vacías** (con `.gitkeep`), listas para empezar. Todavía **no tienen código**, y `src/contracts/{payment,execution,engine}.schema.ts` **todavía no existen** — pendientes de implementación por Dev 1 (los tres esquemas `payment`, `execution` y `engine` los propone Dev 5 y Dev 1 los valida) siguiendo el Bloque 1 de [implementation-checklist.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/implementation-checklist.md).
