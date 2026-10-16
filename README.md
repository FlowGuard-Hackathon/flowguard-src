# flowguard-src

Backend modular de FlowGuard: contratos compartidos, motor de reglas determinista, persistencia, orquestación de ejecuciones y el servicio de IA (agente + herramientas de lectura + adaptador Nebius).

**Responsables principales:** Dev 1 (reglas, persistencia, API) y Dev 3 (agente, herramientas, Nebius).

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

## Estado actual

- **Dev 3 (agente, herramientas, Nebius):** esqueleto inicializado.
  - `src/contracts/evidence-report.schema.ts` — contrato Zod del informe del agente (api-contracts.md § 10).
  - `src/server/agent/` — `mockProvider.ts` (proveedor mock funcional y probado), `nebiusProvider.ts` (pendiente de implementar hasta completar security.md § 1.8), `validateReport.ts`, `prompt.ts`, selección por `AGENT_PROVIDER` en `index.ts`.
  - `src/server/tools/` — firmas de las cinco herramientas de lectura; lanzan `NotImplementedError` hasta que Dev 1 publique `src/server/persistence/`.
  - Prueba unitaria (`mockProvider.test.ts`) validando el mock contra el esquema — `npm test` pasa.
- **Dev 1 (reglas, persistencia, API):** `src/server/rules/`, `src/server/executions/`, `src/server/persistence/` y `src/contracts/{payment,execution,engine}.schema.ts` **todavía no existen** en este repo — pendientes de implementación por Dev 1 siguiendo el Bloque 1 de [implementation-checklist.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/implementation-checklist.md).

## Cómo correr lo que ya existe

```bash
npm install
npm test        # vitest run
npm run typecheck
cp .env.example .env   # AGENT_PROVIDER=mock por defecto
```
