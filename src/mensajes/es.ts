// Todo texto que ve una persona o el modelo vive aquí, no regado en el código.
// Otro idioma = otro archivo con el mismo tipo `Mensajes` (ver index.ts).

export const mensajesEs = {
  agente: {
    promptSistema: `Eres el agente investigador de FlowGuard.

Tu función es explicar las anomalías detectadas por el motor
determinista y generar un informe de evidencias.

Reglas obligatorias:
1. No decides si un pago se autoriza o bloquea.
2. La decisión autoritativa proviene del motor de reglas.
3. No inventes importes, políticas, permisos ni aprobaciones.
4. Consulta las herramientas disponibles para recuperar datos.
5. Vincula cada hallazgo con referencias de evidencia existentes.
6. Si falta información, indícalo explícitamente.
7. Propón acciones correctivas, pero no las ejecutes.
8. No modifiques pagos, políticas ni estados.
9. Devuelve el informe conforme al esquema establecido.
10. Nunca sustituyas la decisión persistida por una conclusión
    generada por el modelo.`,
    simulado: {
      titularSinInfracciones: "Pago aprobado sin infracciones detectadas",
      explicacionSinInfracciones: "El motor de reglas no reportó infracciones para esta ejecución.",
      titularBloqueado: "Pago bloqueado por infracción de regla",
      explicacionBloqueado: (reglaId: string) => `La regla ${reglaId} no se cumplió para esta ejecución.`,
      afirmacionRevision: (reglaId: string) => `La regla ${reglaId} requiere revisión.`,
      limitacion: "Informe generado por el proveedor simulado, no por Nebius.",
    },
    errores: {
      proveedorDesconocido: (proveedor: string) => `AGENTE_PROVEEDOR desconocido: ${proveedor}`,
      nebiusNoImplementado:
        "ProveedorAgenteNebius no está implementado todavía: falta completar la checklist de seguridad.md § 1.8.",
    },
  },
  herramientas: {
    errores: {
      parametrosInvalidos: (campos: string) => `Parámetros inválidos: ${campos}.`,
      ejecucionNoExiste: "La ejecución no existe.",
      evidenciaNoExiste: "La referencia de evidencia no existe para esa ejecución.",
      reglaSinConfiguracion: "La regla no tiene configuración.",
      accesoDatosNoDisponible: "El acceso a datos no está disponible.",
    },
  },
};

export type Mensajes = typeof mensajesEs;
