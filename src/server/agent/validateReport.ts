import { EvidenceReportSchema, type EvidenceReport } from "../../contracts/evidence-report.schema.js";

export type ValidationResult =
  | { valid: true; report: EvidenceReport }
  | { valid: false; errors: string[] };

// flowguard-docs/security.md § 1.7 — validación de informes antes de persistir.
// Un informe que no pase esta validación no debe guardarse como COMPLETED/PARTIAL;
// el intento debe tratarse como FAILED.
export function validateReport(raw: unknown): ValidationResult {
  const parsed = EvidenceReportSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }
  return { valid: true, report: parsed.data };
}
