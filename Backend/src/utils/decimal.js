function toNumber(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}

function money(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function quantity(value) {
  return Math.round(toNumber(value) * 1000) / 1000;
}

module.exports = { toNumber, money, quantity };
