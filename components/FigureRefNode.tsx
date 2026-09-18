'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { useRef, useState } from 'react'

function FigureRefView({ node, updateAttributes, selected }: NodeViewProps) {
  const label = node.attrs.label as string
  const url = node.attrs.url as string
  const width = node.attrs.width as number
  const wrapperRef = useRef<HTMLElement | null>(null)
  const [dragging, setDragging] = useState(false)

  function startResize(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const wrapper = wrapperRef.current
    const parent = wrapper?.parentElement
    if (!wrapper || !parent) return

    const parentWidth = parent.getBoundingClientRect().width
    const startX = e.clientX
    const startWidth = wrapper.getBoundingClientRect().width

    setDragging(true)

    function onMove(ev: MouseEvent) {
      const nextPx = startWidth + (ev.clientX - startX)
      const pct = Math.round((nextPx / parentWidth) * 100)
      updateAttributes({ width: Math.min(100, Math.max(10, pct)) })
    }

    function onUp() {
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <NodeViewWrapper
      as="span"
      ref={wrapperRef as never}
      className="figure-node"
      style={{ width: `${width}%` }}
      data-selected={selected ? 'true' : undefined}
    >
      {url ? (
        <img src={url} alt={label} draggable={false} />
      ) : (
        <span className="figure-missing">[{label} — 이미지 없음]</span>
      )}
      <span className="figure-node-caption">
        {label}
        <span className="figure-node-pct">{width}%</span>
      </span>
      <span
        className="figure-node-handle"
        onMouseDown={startResize}
        data-dragging={dragging ? 'true' : undefined}
        title="드래그해서 크기 조절"
      />
    </NodeViewWrapper>
  )
}

export const FigureRef = Node.create({
  name: 'figureRef',
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      label: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-label') ?? '',
        renderHTML: (attrs) => ({ 'data-label': attrs.label }),
      },
      url: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-url') ?? '',
        renderHTML: (attrs) => ({ 'data-url': attrs.url }),
      },
      width: {
        default: 100,
        parseHTML: (el) => parseInt(el.getAttribute('data-width') ?? '100', 10) || 100,
        renderHTML: (attrs) => ({ 'data-width': String(attrs.width) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-figure-ref]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-figure-ref': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureRefView)
  },
})