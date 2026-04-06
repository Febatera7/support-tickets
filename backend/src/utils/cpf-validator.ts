function calcDigit(cpf: string, length: number): number {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += parseInt(cpf[i]!, 10) * (length + 1 - i);
  }
  const rem = (sum * 10) % 11;
  return rem === 10 || rem === 11 ? 0 : rem;
}

export function isValidCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  if (calcDigit(d, 9) !== parseInt(d[9]!, 10)) return false;
  if (calcDigit(d, 10) !== parseInt(d[10]!, 10)) return false;
  return true;
}
