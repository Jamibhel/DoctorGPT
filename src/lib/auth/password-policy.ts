export const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 12 characters", test: (value: string) => value.length >= 12 },
  { id: "lowercase", label: "A lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { id: "uppercase", label: "An uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { id: "number", label: "A number", test: (value: string) => /\d/.test(value) },
  { id: "symbol", label: "A symbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export function evaluatePasswordStrength(value: string) {
  const requirements = PASSWORD_REQUIREMENTS.map((requirement) => ({
    id: requirement.id,
    label: requirement.label,
    met: requirement.test(value),
  }));
  const score = requirements.filter((requirement) => requirement.met).length;
  const label = value.length === 0
    ? "Not entered"
    : score <= 2
      ? "Weak"
      : score === 3
        ? "Fair"
        : score === 4
          ? "Good"
          : "Strong";

  return { requirements, score, label, isStrong: score === PASSWORD_REQUIREMENTS.length };
}
