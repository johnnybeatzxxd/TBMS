export const getScrollableChartWidth = (
  pointCount: number,
  viewportWidth: number,
  minWidthOffset = 64
) => {
  const baseWidth = Math.max(0, viewportWidth - minWidthOffset);
  const widthPerPoint = pointCount > 8 ? 72 : 56;
  return Math.max(baseWidth, pointCount * widthPerPoint);
};
