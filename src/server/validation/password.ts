import { invalid, valid, type ValidationResult } from "@/server/validation/result";

export type PasswordRuleId =
  | "length"
  | "uppercase"
  | "lowercase"
  | "number"
  | "symbol";

export type PasswordRuleResult = {
  id: PasswordRuleId;
  passed: boolean;
};

export function getPasswordRuleResults(password: string): PasswordRuleResult[] {
  return [
    { id: "length", passed: password.length >= 10 },
    { id: "uppercase", passed: /[A-Z]/.test(password) },
    { id: "lowercase", passed: /[a-z]/.test(password) },
    { id: "number", passed: /\d/.test(password) },
    { id: "symbol", passed: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function validatePassword(password: string): ValidationResult<string> {
  const failedRule = getPasswordRuleResults(password).find((rule) => !rule.passed);

  if (failedRule) {
    return invalid(`Password does not satisfy rule: ${failedRule.id}.`);
  }

  return valid(password);
}
