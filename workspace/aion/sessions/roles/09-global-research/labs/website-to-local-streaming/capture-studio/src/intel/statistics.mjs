// Mergeable bounded cardinality sketch (HyperLogLog, 256 registers by default).
import { createHash } from 'node:crypto';
import { typedValueKey } from './similarity.mjs';

export class CardinalitySketch {
  constructor({ precision = 8, registers } = {}) {
    if (!Number.isInteger(precision) || precision < 4 || precision > 16) throw new RangeError('precision must be 4..16');
    this.precision = precision;
    this.registers = new Uint8Array(1 << precision);
    if (registers) {
      if (registers.length !== this.registers.length) throw new RangeError('Register count mismatch');
      this.registers.set(registers);
    }
  }
  add(value) {
    const hash = createHash('sha256').update(typedValueKey(value)).digest().readUInt32BE(0);
    const index = hash >>> (32 - this.precision), rest = hash << this.precision;
    const rank = Math.min(32 - this.precision + 1, Math.clz32(rest) + 1);
    this.registers[index] = Math.max(this.registers[index], rank); return this;
  }
  merge(other) {
    if (other.precision !== this.precision) throw new RangeError('Sketch precision mismatch');
    for (let i = 0; i < this.registers.length; i++) this.registers[i] = Math.max(this.registers[i], other.registers[i]);
    return this;
  }
  estimate() {
    const m = this.registers.length;
    const alpha = m === 16 ? 0.673 : m === 32 ? 0.697 : m === 64 ? 0.709 : 0.7213 / (1 + 1.079 / m);
    let sum = 0, zero = 0;
    for (const rank of this.registers) { sum += 2 ** -rank; if (!rank) zero++; }
    let estimate = alpha * m * m / sum;
    if (estimate <= 2.5 * m && zero) estimate = m * Math.log(m / zero);
    return Math.round(estimate);
  }
  toJSON() { return { precision: this.precision, registers: [...this.registers] }; }
}

export function wilsonInterval(positive, total, z = 1.96) {
  if (!(total > 0) || !Number.isFinite(positive) || positive < 0 || positive > total) return { lower: 0, upper: 1 };
  const p = positive / total, z2 = z * z, denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const radius = z * Math.sqrt(p * (1 - p) / total + z2 / (4 * total * total)) / denominator;
  return { lower: +Math.max(0, center - radius).toFixed(4), upper: +Math.min(1, center + radius).toFixed(4) };
}
