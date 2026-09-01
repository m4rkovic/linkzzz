export type PasswordRule = {
  id: string;
  label: string;
  passed: boolean;
};

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    {
      id: "length",
      label: "At least 10 characters",
      passed: password.length >= 10,
    },
    {
      id: "uppercase",
      label: "At least one uppercase letter",
      passed: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "At least one lowercase letter",
      passed: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "At least one number",
      passed: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "At least one symbol",
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function isStrongEnough(password: string) {
  return getPasswordRules(password).every((rule) => rule.passed);
}
