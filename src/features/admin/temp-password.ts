const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*";
const ALL = `${UPPERCASE}${LOWERCASE}${DIGITS}${SYMBOLS}`;

function randomIndex(max: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}

function randomChar(source: string) {
  return source[randomIndex(source.length)];
}

export function generateTemporaryPassword() {
  const required = [
    randomChar(UPPERCASE),
    randomChar(LOWERCASE),
    randomChar(DIGITS),
    randomChar(SYMBOLS),
  ];

  while (required.length < 16) {
    required.push(randomChar(ALL));
  }

  for (let index = required.length - 1; index > 0; index -= 1) {
    const swapWith = randomIndex(index + 1);
    [required[index], required[swapWith]] = [required[swapWith], required[index]];
  }

  return required.join("");
}
