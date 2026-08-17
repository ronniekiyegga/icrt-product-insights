import { testingData } from '../data/testingData'

export type ReportResult =
  | { status: 'ok'; filename: string }
  | { status: 'failed'; reason: string }

export async function generateReport(): Promise<ReportResult> {
  try {
    const { jsPDF } = await import('jspdf')
    const { category, aggregate_stats, products } = testingData
    const sortedProducts = products.slice().sort((left, right) => right.score - left.score)
    const doc = new jsPDF()
    let y = 20

    doc.setFontSize(18)
    doc.text(`${category} · Product testing overview`, 14, y)
    y += 10
    doc.setFontSize(11)
    doc.text('Independent product performance evaluation', 14, y)
    y += 14

    doc.setFontSize(10)
    doc.text(`Average Score: ${String(aggregate_stats.avg_score)} / 100`, 14, y)
    y += 7
    doc.text(`Products Tested: ${String(aggregate_stats.total_tested)}`, 14, y)
    y += 7
    doc.text(`Avg. Time To Result: ${String(aggregate_stats.avg_ttr_days)} days`, 14, y)
    y += 14

    doc.text('Brand', 14, y)
    doc.text('Model', 54, y)
    doc.text('Score', 104, y)
    doc.text('Time to result', 134, y)
    y += 7

    for (const product of sortedProducts) {
      doc.text(product.brand, 14, y)
      doc.text(product.model, 54, y)
      doc.text(String(product.score), 104, y)
      doc.text(`${String(product.ttr_days)} days`, 134, y)
      y += 7
    }

    y += 7
    doc.text(`${String(products.length)} of ${String(aggregate_stats.total_tested)} products shown`, 14, y)

    const filename = `${category.toLowerCase()}-product-report.pdf`
    doc.save(filename)

    return { status: 'ok', filename }
  } catch {
    return { status: 'failed', reason: 'Unable to generate the PDF report. Please try again.' }
  }
}
