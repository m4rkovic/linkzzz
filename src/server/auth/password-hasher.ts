import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const DEFAULT_N = 16_384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const MAX_MEMORY = 64 * 1024 * 1024;

function deriveKey(
  password: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: n,
        r,
        p,
        maxmem: MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

export class ScryptPasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = await deriveKey(
      password,
      salt,
      DEFAULT_N,
      DEFAULT_R,
      DEFAULT_P,
    );

    return [
      "scrypt",
      DEFAULT_N,
      DEFAULT_R,
      DEFAULT_P,
      salt.toString("base64url"),
      derivedKey.toString("base64url"),
    ].join("$");
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const parts = encodedHash.split("$");

    if (parts.length !== 6 || parts[0] !== "scrypt") {
      return false;
    }

    const n = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);

    if (
      !Number.isInteger(n) ||
      !Number.isInteger(r) ||
      !Number.isInteger(p) ||
      n <= 1 ||
      r <= 0 ||
      p <= 0
    ) {
      return false;
    }

    let salt: Buffer;
    let expected: Buffer;

    try {
      salt = Buffer.from(parts[4], "base64url");
      expected = Buffer.from(parts[5], "base64url");
    } catch {
      return false;
    }

    if (salt.length === 0 || expected.length !== KEY_LENGTH) {
      return false;
    }

    const actual = await deriveKey(password, salt, n, r, p);

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}

export const passwordHasher = new ScryptPasswordHasher();
