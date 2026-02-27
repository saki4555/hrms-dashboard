import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { STEPS } from "./steps";

export function ErrorSummary({ errors }) {
  const flattenErrors = (errs, prefix = "") =>
    Object.entries(errs).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value?.message) return [{ key: fullKey, message: value.message }];
      if (typeof value === "object" && value !== null && !value.message)
        return flattenErrors(value, fullKey);
      return [];
    });

  const allErrors = flattenErrors(errors);
  if (!allErrors.length) return null;

  const grouped = STEPS.map((step) => ({
    step,
    errs: allErrors.filter((e) => step.fields.some((f) => e.key.startsWith(f))),
  })).filter((g) => g.errs.length > 0);

  return (
    <Alert variant="destructive" className="border-destructive/50">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <p className="font-semibold mb-2">Please fix the following errors:</p>
        <div className="space-y-2">
          {grouped.map(({ step, errs }) => (
            <div key={step.id}>
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">{step.label}</p>
              <ul className="list-disc list-inside text-sm space-y-0.5 mt-0.5">
                {errs.map(({ key, message }) => (
                  <li key={key}>{message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}