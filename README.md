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

Este repo todavía no tiene código; está preparado para que Dev 1 y Dev 3 empiecen a trabajar siguiendo el Bloque 1 de [flowguard-docs/implementation-checklist.md](https://github.com/FlowGuard-Hackathon/flowguard-docs/blob/main/implementation-checklist.md).
