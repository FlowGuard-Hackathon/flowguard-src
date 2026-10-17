import {
  EsquemaInformeEvidencias,
  type InformeEvidencias,
} from "../../contratos/informe-evidencias.schema.js";

export type ResultadoValidacion =
  | { valido: true; informe: InformeEvidencias }
  | { valido: false; errores: string[] };

// seguridad.md § 1.7: si no pasa, el intento se trata como FALLIDA y no se persiste
export function validarInforme(crudo: unknown): ResultadoValidacion {
  const parseado = EsquemaInformeEvidencias.safeParse(crudo);
  if (!parseado.success) {
    return {
      valido: false,
      errores: parseado.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }
  return { valido: true, informe: parseado.data };
}
