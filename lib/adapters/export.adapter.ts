export interface ExportOptions {
  format: 'csv' | 'json' | 'excel' | 'pdf'
  filename?: string
  metadata?: Record<string, any>
}

export interface ExportResult {
  success: boolean
  url?: string
  buffer?: Buffer
  error?: string
}

export interface IExportAdapter {
  export(data: any[], options: ExportOptions): Promise<ExportResult>
  isConfigured(): boolean
}

// CSV export adapter
export class CSVExportAdapter implements IExportAdapter {
  async export(data: any[], options: ExportOptions): Promise<ExportResult> {
    try {
      // Simple CSV generation
      if (data.length === 0) {
        return { success: true, buffer: Buffer.from('') }
      }

      const headers = Object.keys(data[0])
      const csvLines = [headers.join(',')]

      for (const row of data) {
        const values = headers.map((h) => {
          const value = row[h]
          if (value === null || value === undefined) return ''
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return String(value)
        })
        csvLines.push(values.join(','))
      }

      const buffer = Buffer.from(csvLines.join('\n'), 'utf-8')
      return { success: true, buffer }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CSV export failed',
      }
    }
  }

  isConfigured(): boolean {
    return true
  }
}

// JSON export adapter
export class JSONExportAdapter implements IExportAdapter {
  async export(data: any[], options: ExportOptions): Promise<ExportResult> {
    try {
      const json = JSON.stringify(data, null, 2)
      const buffer = Buffer.from(json, 'utf-8')
      return { success: true, buffer }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON export failed',
      }
    }
  }

  isConfigured(): boolean {
    return true
  }
}

// Excel export adapter (stub - would use exceljs or similar)
export class ExcelExportAdapter implements IExportAdapter {
  async export(data: any[], options: ExportOptions): Promise<ExportResult> {
    // TODO: Implement with exceljs
    return {
      success: false,
      error: 'Excel export not yet implemented - install exceljs',
    }
  }

  isConfigured(): boolean {
    return false
  }
}

// PDF export adapter (stub - would use puppeteer or similar)
export class PDFExportAdapter implements IExportAdapter {
  async export(data: any[], options: ExportOptions): Promise<ExportResult> {
    // TODO: Implement with puppeteer or pdfkit
    return {
      success: false,
      error: 'PDF export not yet implemented - install puppeteer or pdfkit',
    }
  }

  isConfigured(): boolean {
    return false
  }
}

// Factory function
export function getExportAdapter(format: string): IExportAdapter {
  switch (format) {
    case 'csv':
      return new CSVExportAdapter()
    case 'json':
      return new JSONExportAdapter()
    case 'excel':
      return new ExcelExportAdapter()
    case 'pdf':
      return new PDFExportAdapter()
    default:
      throw new Error(`Unknown export format: ${format}`)
  }
}
