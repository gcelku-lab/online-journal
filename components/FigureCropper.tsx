'use client'

import { LargeNumberLike } from 'crypto';
import { useState, useRef, useEffect } from 'react'

type Rect = { x: number; y: number; w: number; h: number }

export default function FigureCropper({
  canvas,
  pageNum,
  label,
  doi,
  onSaved,
  onCancel,
  onPrevPage,
  onNextPage,
  pageInfo,
}: {
  canvas: HTMLCanvasElement
  pageNum: number
  label: string
  doi: string
  onSaved: (url: string) => void
  onCancel: () => void
  onPrevPage?: () => void
  onNextPage?: () => void
  pageInfo?: string
}) {
  const [rect, setRect] = useState<Rect | null>(null)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [imgSrc, setImgSrc] = useState('')

  useEffect(() => {
    if (!canvas || pageNum === 0) return
    setImgSrc(canvas.toDataURL())
    setRect(null)
  }, [canvas, pageNum])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrevPage?.() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onNextPage?.() }
      else if (e.key === 'Escape') { onCancel() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onPrevPage, onNextPage, onCancel])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

  function getRelativePos(e: React.MouseEvent) {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const bounds = el.getBoundingClientRect()
    return {
      x: (e.clientX - bounds.left) / bounds.width,
      y: (e.clientY - bounds.top) / bounds.height,
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    const pos = getRelativePos(e)
    startRef.current = pos
    setRect({ x: pos.x, y: pos.y, w: 0, h: 0 })
    setDragging(true)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !startRef.current) return
    const pos = getRelativePos(e)
    const s = startRef.current
    setRect({
      x: Math.min(s.x, pos.x),
      y: Math.min(s.y, pos.y),
      w: Math.abs(pos.x - s.x),
      h: Math.abs(pos.y - s.y),
    })
  }

  function handleMouseUp() {
    setDragging(false)
  }

  async function handleSave() {
    if (!rect || rect.w < 0.01 || rect.h < 0.01) {
      alert('영역을 드래그해서 선택해주세요.')
      return
    }

    setSaving(true)
    try {
      const sx = rect.x * canvas.width
      const sy = rect.y * canvas.height
      const sw = rect.w * canvas.width
      const sh = rect.h * canvas.height

      const cropCanvas = document.createElement('canvas')
      cropCanvas.width = sw
      cropCanvas.height = sh
      const ctx = cropCanvas.getContext('2d')
      if (!ctx) throw new Error('canvas context 없음')

      ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)

      const blob = await new Promise<Blob | null>((resolve) =>
        cropCanvas.toBlob(resolve, 'image/png')
      )
      if (!blob) throw new Error('이미지 변환 실패')

      const safeDoi = doi.replace(/[^a-zA-Z0-9]/g, '_')
      const safeLabel = label.replace(/[^a-zA-Z0-9]/g, '_')
      const key = `figures/${safeDoi}/${safeLabel}_${Date.now()}.png`

      const formData = new FormData()
      formData.append('file', blob, 'figure.png')
      formData.append('key', key)

      const res = await fetch('/api/upload-figure', { method: 'POST', body: formData })
      if (!res.ok) {
        console.error('업로드 실패:', res.status, await res.text())
        alert('이미지 업로드에 실패했습니다. 콘솔을 확인해주세요.')
        return
      }

      const data = await res.json()
      onSaved(data.url)
    } catch (err) {
      console.error('크롭 저장 실패:', err)
      alert('저장에 실패했습니다. 콘솔을 확인해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: '#fff', fontSize: 15 }}>
          <strong>{label}</strong> 영역을 드래그로 선택하세요
          {pageInfo && <span style={{ color: '#aaa', marginLeft: 12, fontSize: 13 }}>{pageInfo}</span>}
          <span style={{ color: '#666', marginLeft: 12, fontSize: 12 }}>← → 페이지 이동, ESC 취소</span>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onPrevPage}>← 이전</button>
          <button onClick={onNextPage}>다음 →</button>
          <button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <button onClick={onCancel}>취소</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ position: 'relative', cursor: 'crosshair', display: 'inline-block', userSelect: 'none' }}
        >
          {imgSrc && (
            <img
              src={imgSrc}
              alt="PDF page"
              draggable={false}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            />
          )}
          {rect && rect.w > 0 && (
            <div
              style={{
                position: 'absolute',
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.w * 100}%`,
                height: `${rect.h * 100}%`,
                border: '2px solid #2563eb',
                background: 'rgba(37,99,235,0.15)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}