export function calculateDTFCost(
  coverage
) {
  if (coverage <= 10) {
    return 300;
  }

  if (coverage <= 25) {
    return 500;
  }

  if (coverage <= 50) {
    return 800;
  }

  return 1200;
}