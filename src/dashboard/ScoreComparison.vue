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
import { testingData, type Product } from '../data/testingData'

Chart.register(BarController, BarElement, CategoryScale, LinearScale)

const canvas = ref<HTMLCanvasElement | null>(null)
const overlayRoot = ref<HTMLElement | null>(null)
let chart: Chart<'bar'> | undefined
let tabletQuery: MediaQueryList | undefined

const products = testingData.products.slice().sort((left, right) => right.score - left.score)
const scaleTicks = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
const defaultTooltipIndex = Math.max(
  0,
  products.findIndex((product) => product.score === 85),
)
const defaultProduct = products[defaultTooltipIndex]

const scaleInset = ref({ left: 0, right: 0 })
const tooltipState = ref({
  visible: true,
  brand: defaultProduct?.brand ?? '',
  model: defaultProduct?.model ?? '',
  score: defaultProduct?.score ?? 0,
  ttrDays: defaultProduct?.ttr_days ?? 0,
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

function readToken(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim()
}

function readPx(token: string, fallback: number): number {
  const value = Number.parseFloat(readToken(token))
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function isTablet(): boolean {
  const tablet = readPx('--breakpoint-tablet', 768)
  return window.matchMedia(`(min-width: ${String(tablet)}px)`).matches
}

function barThickness(): number {
  return isTablet() ? readPx('--height-chart-bar', 40) : readPx('--height-chart-bar-mobile', 36)
}

function barGap(): number {
  return isTablet() ? 8 : 4
}

function barFill(context: ScriptableContext<'bar'>): CanvasGradient | string {
  const from = readToken('--color-chart-bar')
  const mid = readToken('--color-chart-bar-mid')
  const to = readToken('--color-chart-bar-to')
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

  if (tooltipPhase === 'enter' || tooltipPhase === 'leave') {
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
    placeTooltipOnBar(defaultTooltipIndex)
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
    placeTooltipOnBar(defaultTooltipIndex, true)
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
    const meta = chartInstance.getDatasetMeta(0)
    const { ctx } = chartInstance
    const tablet = isTablet()
    const size = tablet ? readPx('--text-tiny', 14) : readPx('--text-annotation', 12)
    const family = getComputedStyle(document.body).fontFamily
    const fill = readToken('--color-text-weak')

    ctx.save()
    ctx.fillStyle = fill
    ctx.font = `400 ${String(size)}px ${family}`
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

  tabletQuery = window.matchMedia(`(min-width: ${String(readPx('--breakpoint-tablet', 768))}px)`)
  tabletQuery.addEventListener('change', applyChartLayout)

  const labelColor = readToken('--color-text-weak')
  const labelSize = readPx('--text-annotation', 12)
  const fontFamily = getComputedStyle(document.body).fontFamily

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
            color: labelColor,
            padding: 12,
            font: {
              size: labelSize,
              family: fontFamily,
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
    placeTooltipOnBar(defaultTooltipIndex, true)
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
      <div class="size-full border-l-6 border-background-card pl-4 md:pl-8">
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
      <div
        v-show="tooltipState.visible"
        class="tooltip-axis-anchor pointer-events-none absolute left-0 z-20 flex flex-col items-center"
        :style="{
          transform: `translate3d(${String(tooltipX)}px, 0, 0) translateX(-50%)`,
          top: 'calc(var(--height-tooltip) * -1)',
        }"
      >
        <div class="w-44 shrink-0 rounded-tooltip bg-background-base p-px shadow-tooltip">
          <div
            class="flex flex-col gap-1 rounded-tooltip border-tooltip border-stroke-tooltip bg-tooltip px-0.5 py-1.5"
          >
            <div class="flex items-center justify-between px-2">
              <span class="font-medium text-tooltip text-text-strong">{{
                tooltipState.brand
              }}</span>
              <span class="flex items-center gap-1">
                <span class="font-medium text-tooltip-sm text-text-faint">{{
                  tooltipState.score
                }}</span>
                <span class="flex h-2 items-end gap-px" aria-hidden="true">
                  <span
                    class="h-1 w-px rounded-full bg-linear-to-b from-gradient-hover to-gradient-red-to"
                  />
                  <span
                    class="h-1.5 w-px rounded-full bg-linear-to-b from-gradient-hover to-gradient-red-to"
                  />
                  <span
                    class="h-2 w-px rounded-full bg-linear-to-b from-gradient-hover to-gradient-red-to"
                  />
                </span>
              </span>
            </div>
            <div class="mx-2 border-t border-stroke-weak" />
            <div class="flex items-center justify-between gap-2 px-2 py-1">
              <span class="flex items-center gap-1">
                <span
                  class="size-2 shrink-0 rounded-full border border-background-base bg-tooltip-marker"
                  aria-hidden="true"
                />
                <span class="font-medium text-tooltip-sm text-text-navy">{{
                  tooltipState.model
                }}</span>
              </span>
              <span class="font-normal text-tooltip-meta text-text-navy">
                TTR ({{ tooltipState.ttrDays }} days)
              </span>
            </div>
          </div>
        </div>
        <div class="min-h-0 w-px flex-1 border-l border-dashed border-brand" />
        <span class="size-2.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
      </div>
    </div>
    <div class="absolute inset-x-0 top-full pl-4 pt-4 md:pl-8 tablet:pt-16">
      <div
        class="flex justify-between text-annotation text-stroke-strong tablet:text-tiny"
        :style="{
          paddingLeft: `${String(scaleInset.left)}px`,
          paddingRight: `${String(scaleInset.right)}px`,
        }"
      >
        <span v-for="tick in scaleTicks" :key="tick">{{ tick }}</span>
      </div>
    </div>
    <table class="sr-only">
      <caption>
        Product scores,
        {{
          products.length
        }}
        of
        {{
          testingData.aggregate_stats.total_tested
        }}
        tested
      </caption>
      <thead>
        <tr>
          <th>Product</th>
          <th>Score</th>
          <th>Time to result</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>{{ productLabel(product) }}</td>
          <td>{{ product.score }}</td>
          <td>{{ product.ttr_days }} days</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
