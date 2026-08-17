<script setup lang="ts">
import { testingData, type Product } from '../../data/testingData'

const products = testingData.products.slice().sort((left, right) => right.score - left.score)

function productLabel(product: Product): string {
  return `${product.brand} ${product.model}`
}
</script>

<template>
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
</template>
