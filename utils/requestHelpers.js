const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  return value
    .toString()
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

module.exports = {
  toArray,
  toNumber
};
