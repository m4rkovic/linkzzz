export type ValidationSuccess<T> = {
  ok: true;
  value: T;
};

export type ValidationFailure = {
  ok: false;
  error: string;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function valid<T>(value: T): ValidationSuccess<T> {
  return { ok: true, value };
}

export function invalid(error: string): ValidationFailure {
  return { ok: false, error };
}
