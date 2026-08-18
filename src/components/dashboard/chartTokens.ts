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
  barShadows: readonly ChartShadow[]
}

export interface ChartShadow {
  color: string
  blur: number
  offsetY: number
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
    barShadows: [
      {
        color: read('--color-chart-bar-shadow-1'),
        blur: readPx(read('--blur-chart-bar-shadow-1'), 11),
        offsetY: readPx(read('--offset-y-chart-bar-shadow-1'), 5),
      },
      {
        color: read('--color-chart-bar-shadow-2'),
        blur: readPx(read('--blur-chart-bar-shadow-2'), 19),
        offsetY: readPx(read('--offset-y-chart-bar-shadow-2'), 19),
      },
      {
        color: read('--color-chart-bar-shadow-3'),
        blur: readPx(read('--blur-chart-bar-shadow-3'), 26),
        offsetY: readPx(read('--offset-y-chart-bar-shadow-3'), 43),
      },
      {
        color: read('--color-chart-bar-shadow-4'),
        blur: readPx(read('--blur-chart-bar-shadow-4'), 31),
        offsetY: readPx(read('--offset-y-chart-bar-shadow-4'), 77),
      },
      {
        color: read('--color-chart-bar-shadow-5'),
        blur: readPx(read('--blur-chart-bar-shadow-5'), 34),
        offsetY: readPx(read('--offset-y-chart-bar-shadow-5'), 120),
      },
    ],
  })
}
