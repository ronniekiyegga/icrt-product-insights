export interface ChartTokens {
  barGradientFrom: string
  barGradientMid: string
  barGradientTo: string
  textWeak: string
  textAnnotationSize: number
  textTinySize: number
  barHeight: number
  barHeightMobile: number
  breakpointTablet: number
}

function readPx(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function readChartTokens(): Readonly<ChartTokens> {
  const style = getComputedStyle(document.documentElement)
  const read = (token: string): string => style.getPropertyValue(token).trim()

  return Object.freeze({
    barGradientFrom: read('--color-chart-bar'),
    barGradientMid: read('--color-chart-bar-mid'),
    barGradientTo: read('--color-chart-bar-to'),
    textWeak: read('--color-text-weak'),
    textAnnotationSize: readPx(read('--text-annotation'), 12),
    textTinySize: readPx(read('--text-tiny'), 14),
    barHeight: readPx(read('--height-chart-bar'), 40),
    barHeightMobile: readPx(read('--height-chart-bar-mobile'), 36),
    breakpointTablet: readPx(read('--breakpoint-tablet'), 768),
  })
}
