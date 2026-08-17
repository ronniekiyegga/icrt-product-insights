export interface Product {
  id: number
  brand: string
  model: string
  score: number
  ttr_days: number
  download_id: string
}

export interface AggregateStats {
  avg_score: number
  total_tested: number
  avg_ttr_days: number
}

export interface CategoryTestingData {
  category: string
  aggregate_stats: AggregateStats
  products: Product[]
}

export const testingData: CategoryTestingData = {
  category: 'Dishwashers',
  aggregate_stats: { avg_score: 82.4, total_tested: 15, avg_ttr_days: 4.2 },
  products: [
    {
      id: 1,
      brand: 'BrandA',
      model: 'DW-100',
      score: 85,
      ttr_days: 3.8,
      download_id: 'eval_889',
    },
    {
      id: 2,
      brand: 'BrandB',
      model: 'DW-200',
      score: 79,
      ttr_days: 4.5,
      download_id: 'eval_890',
    },
    {
      id: 3,
      brand: 'BrandC',
      model: 'DW-300',
      score: 92,
      ttr_days: 2.9,
      download_id: 'eval_891',
    },
  ],
}
