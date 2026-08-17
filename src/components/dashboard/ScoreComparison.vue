<script setup lang="ts">
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  type Plugin,
  type ScriptableContext,
} from 'chart.js'
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
const restingTooltipIndex = products.reduce((closest, product, index) => {
  const avgScore = testingData.aggregate_stats.avg_score
  const closestProduct = products[closest]
  if (closestProduct === undefined) {
    return index
  }

  return Math.abs(product.score - avgScore) < Math.abs(closestProduct.score - avgScore)
    ? index
    : closest
}, 0)
const restingProduct = products[restingTooltipIndex]

const scaleInset = ref({ left: 0, right: 0 })
const tooltipState = ref({
  visible: true,
  brand: restingProduct?.brand ?? '',
  model: restingProduct?.model ?? '',
  score: restingProduct?.score ?? 0,
  ttrDays: restingProduct?.ttr_days ?? 0,
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

function barGap(): number {
  return isTablet() ? 8 : 4
}

function barFill(context: ScriptableContext<'bar'>): CanvasGradient | string {
  const tokens = chartTokens
  if (tokens === undefined) {
    return ''
  }

  const from = tokens.barGradientFrom
  const mid = tokens.barGradientMid
  const to = tokens.barGradientTo
  if (from === '') {
    return from
  }

  try {
    const { ctx } = context.chart
    const element = context.chart.getDatasetMeta(context.datasetIndex).data[context.dataIndex]
    if (element === undefined) {
      return from
    }

    const props = element.getProps(['y', 'height'], true)
    const y = props.y
    const height = Number.isFinite(props.height) && props.height > 0 ? props.height : barThickness()
    if (!Number.isFinite(y) || height <= 0) {
      return from
    }

    const gradient = ctx.createLinearGradient(0, y - height / 2, 0, y + height / 2)
    gradient.addColorStop(0, from)
    gradient.addColorStop(0.48, mid === '' ? from : mid)
    gradient.addColorStop(1, to === '' ? from : to)
    return gradient
  } catch {
    return from
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

  if (tooltipIndex !== index || !tooltipState.value.visible) {
    tooltipIndex = index
    tooltipState.value = {
      visible: true,
      brand: product.brand,
      model: product.model,
      score: product.score,
      ttrDays: product.ttr_days,
    }
  }
  moveTooltipTo(x, immediate)
}

function placeTooltipOnBar(index: number, immediate = false) {
  if (chart === undefined || canvas.value === null || overlayRoot.value === null) {
    return
  }

  const element = chart.getDatasetMeta(0).data[index]
  if (element === undefined) {
    return
  }

  const canvasBox = canvas.value.getBoundingClientRect()
  const overlayBox = overlayRoot.value.getBoundingClientRect()
  showProductTooltip(index, element.x + (canvasBox.left - overlayBox.left), immediate)
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
  if (isTablet()) {
    placeTooltipOnBar(restingTooltipIndex)
    easeTooltipTo(tooltipTargetX, 'leave')
    return
  }

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

  const tablet = isTablet()
  const yScale = chart.options.scales?.y
  if (yScale !== undefined && typeof yScale === 'object') {
    yScale.ticks = { ...yScale.ticks, display: tablet }
  }
  chart.options.layout = {
    ...chart.options.layout,
    padding: { right: tablet ? 40 : 56 },
  }
  chart.update()
  if (isTablet()) {
    placeTooltipOnBar(restingTooltipIndex, true)
    return
  }

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

      ctx.save()
      ctx.globalAlpha = barOpacities[index] ?? 1
      element.draw(ctx)
      ctx.restore()
    }

    return false
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
    const tablet = isTablet()
    const size = tablet ? tokens.textTinySize : tokens.textAnnotationSize
    const fill = tokens.textWeak

    ctx.save()
    ctx.fillStyle = fill
    ctx.font = `400 ${String(size)}px ${labelFontFamily}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    for (const [index, element] of meta.data.entries()) {
      const product = products[index]
      if (product === undefined) {
        continue
      }

      const label = tablet ? String(product.score) : product.brand
      ctx.save()
      ctx.globalAlpha = barOpacities[index] ?? 1
      ctx.fillText(label, element.x + 8, element.y)
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
    plugins: [fadeUnhovered, endLabels, syncScale],
    data: {
      labels: products.map(productLabel),
      datasets: [
        {
          data: products.map((product) => product.score),
          backgroundColor: barFill,
          borderRadius: 8,
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
          right: isTablet() ? 40 : 56,
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
            display: isTablet(),
            color: chartTokens.textWeak,
            padding: 12,
            font: {
              size: chartTokens.textAnnotationSize,
              family: labelFontFamily,
            },
          },
          afterFit(axis) {
            const packed = products.length * (barThickness() + barGap())
            const leftover = Math.max(0, axis.height - packed)
            axis.paddingTop = 0
            axis.paddingBottom = leftover
          },
        },
      },
    },
  })

  if (isTablet()) {
    placeTooltipOnBar(restingTooltipIndex, true)
    return
  }

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
  <div class="relative h-chart overflow-visible">
    <div ref="overlayRoot" class="relative size-full overflow-visible">
      <div class="size-full border-l-6 border-background-card pl-4 tablet:pl-8">
        <canvas
          ref="canvas"
          class="size-full tablet:cursor-pointer"
          role="img"
          aria-label="Horizontal bar chart comparing product scores"
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
