export interface ChartTokens {
  barGradientFrom: string
  barGradientMid: string
  barGradientTo: string
  trackFill: string
  trackStroke: string
  textInverse: string
  textWeak: string
  textAnnotationSize: number
  textBarLabelSize: number
  barHeight: number
  barHeightMobile: number
  trackHeight: number
  barInsetLeft: number
  barInsetRight: number
  barLabelPadding: number
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
    trackFill: read('--color-background-base'),
    trackStroke: read('--color-stroke-weak'),
    textInverse: read('--color-text-inverse'),
    textWeak: read('--color-text-weak'),
    textAnnotationSize: readPx(read('--text-annotation'), 12),
    textBarLabelSize: readPx(read('--text-chart-bar'), 12),
    barHeight: readPx(read('--height-chart-bar'), 40),
    barHeightMobile: readPx(read('--height-chart-bar-mobile'), 36),
    trackHeight: readPx(read('--height-chart-track'), 60),
    barInsetLeft: readPx(read('--spacing-chart-bar-inset-left'), 3),
    barInsetRight: readPx(read('--spacing-chart-bar-inset-right'), 20),
    barLabelPadding: readPx(read('--spacing-chart-bar-label-x'), 13),
    breakpointTablet: readPx(read('--breakpoint-tablet'), 768),
  })
}
