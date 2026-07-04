export function calculateCoverage(
  designWidth,
  designHeight,
  printableWidth,
  printableHeight
) {
  const designArea =
    designWidth * designHeight;

  const printableArea =
    printableWidth *
    printableHeight;

  const percentage =
    (designArea /
      printableArea) *
    100;

  return {
    designArea,
    printableArea,
    percentage,
  };
}