<script setup lang="ts">
import { BarController, BarElement, CategoryScale, Chart, LinearScale, type Plugin } from 'chart.js'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { testingData, type Product } from '../../data/testingData'
import { readChartTokens, type ChartTokens } from './chartTokens'
import ProductScoreTable from './ProductScoreTable.vue'
import ScoreComparisonScale from './ScoreComparisonScale.vue'
import ScoreComparisonTooltip from './ScoreComparisonTooltip.vue'

Chart.register(BarController, BarElement, CategoryScale, LinearScale)

const canvas = ref<HTMLCanvasElement | null>(null)
const overlayRoot = ref<HTMLElement | null>(null)
let chart: Chart<'bar'> | undefined
let tabletQuery: MediaQueryList | undefined
let chartTokens: Readonly<ChartTokens> | undefined
let labelFontFamily = ''
let reducedMotion = false

const products = testingData.products.slice().sort((left, right) => right.score - left.score)
const initialProduct = products[0]

const scaleInset = ref({ left: 0, right: 0 })
const tooltipState = ref({
  visible: false,
  brand: initialProduct?.brand ?? '',
  model: initialProduct?.model ?? '',
  score: initialProduct?.score ?? 0,
  ttrDays: initialProduct?.ttr_days ?? 0,
})
const tooltipX = ref(0)
let tooltipTargetX = 0
let tooltipIndex = -1
let tooltipPhase: 'rest' | 'enter' | 'track' | 'leave' = 'rest'
let tooltipEaseFrom = 0
let tooltipEaseTo = 0
let tooltipEaseStartedAt = 0
let motionRaf = 0
const tooltipEaseMs = 420
const barDimFollow = 0.18
const barUnhoveredOpacity = 0.9
const barOpacities = products.map(() => 1)
const barOpacityTargets = products.map(() => 1)

function productLabel(product: Product): string {
  return `${product.brand} ${product.model}`
}

function isTablet(): boolean {
  const tablet = chartTokens?.breakpointTablet ?? 768
  return window.matchMedia(`(min-width: ${String(tablet)}px)`).matches
}

function barThickness(): number {
  if (chartTokens === undefined) {
    return 36
  }

  return isTablet() ? chartTokens.barHeight : chartTokens.barHeightMobile
}

function barFill(ctx: CanvasRenderingContext2D, element: BarElement): CanvasGradient | undefined {
  const tokens = chartTokens
  if (tokens === undefined) {
    console.error('[ScoreComparison] Cannot construct bar gradient: chart tokens are unavailable.')
    return undefined
  }

  if (
    tokens.barGradientFrom === '' ||
    tokens.barGradientMid === '' ||
    tokens.barGradientTo === ''
  ) {
    console.error(
      '[ScoreComparison] Cannot construct bar gradient: one or more colour tokens are empty.',
    )
    return undefined
  }

  const { y, height } = element.getProps(['y', 'height'], true)
  if (
    typeof y !== 'number' ||
    !Number.isFinite(y) ||
    typeof height !== 'number' ||
    !Number.isFinite(height) ||
    height <= 0
  ) {
    console.error(
      `[ScoreComparison] Cannot construct bar gradient: invalid geometry y=${String(y)}, height=${String(height)}.`,
    )
    return undefined
  }

  try {
    const gradient = ctx.createLinearGradient(0, y - height / 2, 0, y + height / 2)
    gradient.addColorStop(0, tokens.barGradientFrom)
    gradient.addColorStop(0.5, tokens.barGradientMid)
    gradient.addColorStop(1, tokens.barGradientTo)
    return gradient
  } catch (error) {
    console.error(
      '[ScoreComparison] Cannot construct bar gradient: canvas gradient creation failed.',
      error,
    )
    return undefined
  }
}

function hideTooltip() {
  tooltipIndex = -1
  tooltipPhase = 'rest'
  tooltipState.value = { ...tooltipState.value, visible: false }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (0 - 2 * t + 2) ** 3 / 2
}

function easeTooltipTo(x: number, phase: 'enter' | 'leave') {
  if (reducedMotion) {
    tooltipX.value = x
    tooltipTargetX = x
    tooltipPhase = phase === 'enter' ? 'track' : 'rest'
    return
  }

  tooltipEaseFrom = tooltipX.value
  tooltipEaseTo = x
  tooltipTargetX = x
  tooltipEaseStartedAt = performance.now()
  tooltipPhase = phase
  requestMotion()
}

function overlayX(clientX: number): number {
  if (overlayRoot.value === null) {
    return 0
  }

  return clientX - overlayRoot.value.getBoundingClientRect().left
}

function hitAtClient(clientX: number, clientY: number) {
  if (chart === undefined || canvas.value === null) {
    return undefined
  }

  const event = new MouseEvent('mousemove', { clientX, clientY, view: window })
  return chart.getElementsAtEventForMode(event, 'nearest', { intersect: true, axis: 'y' }, true)[0]
}

function tickMotion() {
  let moving = false

  if (!reducedMotion && (tooltipPhase === 'enter' || tooltipPhase === 'leave')) {
    const t = Math.min(1, (performance.now() - tooltipEaseStartedAt) / tooltipEaseMs)
    const to = tooltipPhase === 'enter' ? tooltipTargetX : tooltipEaseTo
    tooltipX.value = tooltipEaseFrom + (to - tooltipEaseFrom) * easeInOutCubic(t)
    if (t < 1) {
      moving = true
    } else {
      tooltipX.value = to
      tooltipPhase = tooltipPhase === 'enter' ? 'track' : 'rest'
    }
  }

  if (!reducedMotion) {
    let barsMoving = false
    for (const [index, opacity] of barOpacities.entries()) {
      const target = barOpacityTargets[index] ?? 1
      const delta = target - opacity
      if (Math.abs(delta) < 0.004) {
        barOpacities[index] = target
        continue
      }

      barOpacities[index] = opacity + delta * barDimFollow
      barsMoving = true
      moving = true
    }

    if (barsMoving) {
      chart?.draw()
    }
  }

  if (moving) {
    motionRaf = requestAnimationFrame(tickMotion)
    return
  }

  motionRaf = 0
}

function requestMotion() {
  if (motionRaf === 0) {
    motionRaf = requestAnimationFrame(tickMotion)
  }
}

function moveTooltipTo(x: number, immediate = false) {
  tooltipTargetX = x
  if (immediate) {
    tooltipX.value = x
    tooltipPhase = 'rest'
  }
}

function showProductTooltip(index: number, x: number, immediate = false) {
  const product = products[index]
  if (product === undefined) {
    return
  }

  const wasVisible = tooltipState.value.visible
  if (tooltipIndex !== index || !wasVisible) {
    tooltipIndex = index
    tooltipState.value = {
      visible: true,
      brand: product.brand,
      model: product.model,
      score: product.score,
      ttrDays: product.ttr_days,
    }
  }
  moveTooltipTo(x, immediate || !wasVisible)
  if (!wasVisible) {
    tooltipPhase = 'track'
  }
}

function setHoveredBar(index: number | null) {
  if (reducedMotion) {
    return
  }

  for (const [barIndex] of barOpacityTargets.entries()) {
    barOpacityTargets[barIndex] = index !== null && barIndex !== index ? barUnhoveredOpacity : 1
  }
  requestMotion()
}

function onCanvasMove(event: MouseEvent) {
  if (!isTablet() || chart === undefined || overlayRoot.value === null) {
    return
  }

  const hit = chart.getElementsAtEventForMode(
    event,
    'nearest',
    { intersect: true, axis: 'y' },
    true,
  )[0]
  if (hit === undefined) {
    return
  }

  const x = overlayX(event.clientX)
  setHoveredBar(hit.index)
  showProductTooltip(hit.index, x)

  if (tooltipPhase === 'track') {
    tooltipX.value = x
    return
  }

  if (tooltipPhase === 'enter') {
    tooltipTargetX = x
    return
  }

  easeTooltipTo(x, 'enter')
}

function onCanvasLeave() {
  setHoveredBar(null)
  hideTooltip()
}

function onCanvasTouch(event: TouchEvent) {
  if (isTablet()) {
    return
  }

  const touch = event.touches[0]
  if (touch === undefined) {
    setHoveredBar(null)
    hideTooltip()
    return
  }

  const hit = hitAtClient(touch.clientX, touch.clientY)
  if (hit === undefined) {
    setHoveredBar(null)
    hideTooltip()
    return
  }

  setHoveredBar(hit.index)
  showProductTooltip(hit.index, overlayX(touch.clientX))
}

function onCanvasTouchEnd() {
  if (!isTablet()) {
    setHoveredBar(null)
    hideTooltip()
  }
}

function applyChartLayout() {
  if (chart === undefined) {
    return
  }

  const dataset = chart.data.datasets[0]
  if (dataset !== undefined) {
    dataset.barThickness = barThickness()
  }

  const yScale = chart.options.scales?.y
  if (yScale !== undefined && typeof yScale === 'object') {
    yScale.ticks = { ...yScale.ticks, display: false }
  }
  chart.options.layout = {
    ...chart.options.layout,
    padding: {
      left: chartTokens?.barInsetLeft ?? 3,
      right: chartTokens?.barInsetRight ?? 20,
    },
  }
  chart.update()
  hideTooltip()
}

const fadeUnhovered: Plugin<'bar'> = {
  id: 'fadeUnhovered',
  beforeDatasetDraw(chartInstance, args) {
    const { ctx } = chartInstance
    for (const [index, element] of args.meta.data.entries()) {
      if (!(element instanceof BarElement)) {
        continue
      }

      const gradient = barFill(ctx, element)
      if (gradient === undefined) {
        continue
      }

      const originalOptions = element.options
      element.options = { ...originalOptions, backgroundColor: gradient }

      for (const shadow of chartTokens?.barShadows ?? []) {
        ctx.save()
        ctx.globalAlpha = barOpacities[index] ?? 1
        ctx.shadowColor = shadow.color
        ctx.shadowBlur = shadow.blur
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = shadow.offsetY
        element.draw(ctx)
        ctx.restore()
      }

      ctx.save()
      ctx.globalAlpha = barOpacities[index] ?? 1
      element.draw(ctx)
      ctx.restore()
      element.options = originalOptions
    }

    return false
  },
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, height / 2, width / 2)
  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.lineTo(x + width - safeRadius, y)
  ctx.arcTo(x + width, y, x + width, y + safeRadius, safeRadius)
  ctx.lineTo(x + width, y + height - safeRadius)
  ctx.arcTo(x + width, y + height, x + width - safeRadius, y + height, safeRadius)
  ctx.lineTo(x + safeRadius, y + height)
  ctx.arcTo(x, y + height, x, y + height - safeRadius, safeRadius)
  ctx.lineTo(x, y + safeRadius)
  ctx.arcTo(x, y, x + safeRadius, y, safeRadius)
  ctx.closePath()
}

const barTracks: Plugin<'bar'> = {
  id: 'barTracks',
  beforeDatasetsDraw(chartInstance) {
    const tokens = chartTokens
    if (tokens === undefined) {
      return
    }

    const { ctx, width } = chartInstance
    const meta = chartInstance.getDatasetMeta(0)
    ctx.save()
    ctx.fillStyle = tokens.trackFill
    ctx.strokeStyle = tokens.trackStroke
    ctx.lineWidth = 1

    for (const element of meta.data) {
      const height = tokens.trackHeight
      roundedRect(ctx, 0.5, element.y - height / 2, width - 1, height, 32)
      ctx.fill()
      ctx.stroke()
    }

    ctx.restore()
  },
}

const endLabels: Plugin<'bar'> = {
  id: 'endLabels',
  afterDatasetsDraw(chartInstance) {
    const tokens = chartTokens
    if (tokens === undefined) {
      return
    }

    const meta = chartInstance.getDatasetMeta(0)
    const { ctx } = chartInstance
    const size = tokens.textBarLabelSize

    ctx.save()
    ctx.fillStyle = tokens.textInverse
    ctx.font = `600 ${String(size)}px ${labelFontFamily}`
    ctx.textBaseline = 'middle'

    for (const [index, element] of meta.data.entries()) {
      const product = products[index]
      if (product === undefined || !(element instanceof BarElement)) {
        continue
      }

      const position = element.getProps(['base', 'x', 'y'], true)
      if (
        typeof position.base !== 'number' ||
        typeof position.x !== 'number' ||
        typeof position.y !== 'number'
      ) {
        continue
      }
      ctx.save()
      ctx.globalAlpha = barOpacities[index] ?? 1
      ctx.textAlign = 'left'
      ctx.fillText(productLabel(product), position.base + tokens.barLabelPadding, position.y)
      ctx.textAlign = 'right'
      ctx.fillText(String(product.score), position.x - tokens.barLabelPadding, position.y)
      ctx.restore()
    }

    ctx.restore()
  },
}

const syncScale: Plugin<'bar'> = {
  id: 'syncScale',
  afterLayout(chartInstance) {
    const nextLeft = chartInstance.chartArea.left
    const nextRight = chartInstance.width - chartInstance.chartArea.right
    if (scaleInset.value.left === nextLeft && scaleInset.value.right === nextRight) {
      return
    }

    scaleInset.value = { left: nextLeft, right: nextRight }
  },
}

onMounted(() => {
  const el = canvas.value
  if (el === null) {
    return
  }

  chartTokens = readChartTokens()
  labelFontFamily = getComputedStyle(document.body).fontFamily
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  tabletQuery = window.matchMedia(`(min-width: ${String(chartTokens.breakpointTablet)}px)`)
  tabletQuery.addEventListener('change', applyChartLayout)

  chart = new Chart(el, {
    type: 'bar',
    plugins: [barTracks, fadeUnhovered, endLabels, syncScale],
    data: {
      labels: products.map(productLabel),
      datasets: [
        {
          data: products.map((product) => product.score),
          backgroundColor: 'transparent',
          borderRadius: 32,
          borderSkipped: false,
          barThickness: barThickness(),
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      events: [],
      clip: false,
      layout: {
        padding: {
          left: chartTokens.barInsetLeft,
          right: chartTokens.barInsetRight,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            display: false,
          },
        },
        y: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            display: false,
            color: chartTokens.textWeak,
            padding: 12,
            font: {
              size: chartTokens.textAnnotationSize,
              family: labelFontFamily,
            },
          },
        },
      },
    },
  })

  hideTooltip()
})

onBeforeUnmount(() => {
  if (motionRaf !== 0) {
    cancelAnimationFrame(motionRaf)
  }
  tabletQuery?.removeEventListener('change', applyChartLayout)
  chart?.destroy()
})
</script>

<template>
  <div class="score-comparison-chart relative h-chart overflow-visible">
    <div ref="overlayRoot" class="relative size-full overflow-visible">
      <div class="size-full">
        <canvas
          ref="canvas"
          class="size-full tablet:cursor-pointer"
          role="img"
          aria-label="Horizontal bar chart comparing product scores"
          aria-describedby="product-score-table"
          @mousemove="onCanvasMove"
          @mouseleave="onCanvasLeave"
          @touchstart.prevent="onCanvasTouch"
          @touchmove.prevent="onCanvasTouch"
          @touchend="onCanvasTouchEnd"
          @touchcancel="onCanvasTouchEnd"
        />
      </div>
      <ScoreComparisonTooltip
        :visible="tooltipState.visible"
        :x="tooltipX"
        :brand="tooltipState.brand"
        :model="tooltipState.model"
        :score="tooltipState.score"
        :ttr-days="tooltipState.ttrDays"
      />
    </div>
    <ScoreComparisonScale :inset-left="scaleInset.left" :inset-right="scaleInset.right" />
    <ProductScoreTable />
  </div>
</template>
