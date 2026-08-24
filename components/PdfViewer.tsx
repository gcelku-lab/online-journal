'use client'

import { useState, useRef, useEffect } from 'react'

export default function PdfViewer({
  onPageRender,
  pageNum,
  onPageChange,
  onNumPagesChange,
}: {
  onPageRender?: (canvas: HTMLCanvasElement, pageNum: number) => void
  pageNum: number
  onPageChange: (n: number) => void
  onNumPagesChange: (n: number) => void
}) {
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderTaskRef = useRef<any>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setFileName(file.name)

    try {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString()

      const buffer = await file.arrayBuffer()
      const doc = await pdfjs.getDocument({ data: buffer }).promise

      setPdfDoc(doc)
      setNumPages(doc.numPages)
      onNumPagesChange(doc.numPages)
      onPageChange(1)
    } catch (err) {
      console.error('PDF 로드 실패:', err)
      alert('PDF를 여는 데 실패했습니다. 콘솔을 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    let cancelled = false

    async function render() {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }

      try {
        const page = await pdfDoc.getPage(pageNum)
        if (cancelled) return

        const scale = 2
        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = viewport.width
        canvas.height = viewport.height

        const task = page.render({ canvasContext: ctx, viewport })
        renderTaskRef.current = task

        await task.promise
        renderTaskRef.current = null
        if (cancelled) return

        onPageRender?.(canvas, pageNum)
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return
        console.error('페이지 렌더 실패:', err)
      }
    }

    render()
    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, pageNum])

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        background: 'var(--surface)',
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, marginTop: 0, marginBottom: 10 }}>논문 PDF</p>

      {!pdfDoc && (
        <div>
          <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ border: 'none', padding: 0 }} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
            PDF는 서버에 저장되지 않습니다. 브라우저에서만 열리며, 잘라낸 이미지만 저장됩니다.
          </p>
        </div>
      )}

      {loading && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>PDF 여는 중...</p>}

      {pdfDoc && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{fileName}</span>
            <button onClick={() => onPageChange(Math.max(1, pageNum - 1))} disabled={pageNum <= 1}>
              ← 이전
            </button>
            <span style={{ fontSize: 13 }}>
              {pageNum} / {numPages}
            </span>
            <button onClick={() => onPageChange(Math.min(numPages, pageNum + 1))} disabled={pageNum >= numPages}>
              다음 →
            </button>
            <button
              onClick={() => {
                setPdfDoc(null)
                setNumPages(0)
                onNumPagesChange(0)
                setFileName('')
              }}
              style={{ fontSize: 12, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}
            >
              다른 PDF 열기
            </button>
          </div>

          <div style={{ overflow: 'auto', maxHeight: 600, border: '1px solid var(--border)', background: '#fff' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} />
          </div>
        </div>
      )}
    </div>
  )
}