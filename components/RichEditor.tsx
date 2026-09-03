'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { markInputRule } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { useEffect, useImperativeHandle } from 'react'

function tightMarkRegex(open: string, closeCharClass: string) {
  return new RegExp(`((?:${open})((?:${closeCharClass}+))(?:${open}))$`)
}

const CustomSuperscript = Superscript.extend({
  addInputRules() {
    return [markInputRule({ find: tightMarkRegex('\\^\\^', '[^\\^]'), type: this.type })]
  },
})

const CustomSubscript = Subscript.extend({
  addInputRules() {
    return [markInputRule({ find: tightMarkRegex('__', '[^_]'), type: this.type })]
  },
})

export type RichEditorHandle={
    insertText: (text: string) => void
}

export default function RichEditor({
    content,
    onChange,
    ref,
}: {
    content: string
    onChange: (html: string) => void
    ref?: React.Ref<RichEditorHandle>
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, CustomSubscript, CustomSuperscript],
    content,
    editorProps: {
      attributes: { class: 'rich-editor' },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useImperativeHandle(
    ref,
    () => ({
        insertText: (text:string) => {
            editor?.chain().focus('end').createParagraphNear().insertContent(text).run()
        },
    }),
    [editor]
  )

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  if (!editor) {
    return <div style={{ minHeight: 420, border: '1px solid var(--border)', borderRadius: 8 }} />
  }

  const btn = (active: boolean): React.CSSProperties => ({
    fontSize: 13,
    padding: '3px 9px',
    minWidth: 30,
    background: active ? 'var(--accent)' : '#fff',
    color: active ? '#fff' : 'inherit',
    borderColor: active ? 'var(--accent)' : 'var(--border-strong)',
  })

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: 8,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btn(editor.isActive('bold'))} title="Ctrl+B">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btn(editor.isActive('italic'))} title="Ctrl+I">
          <em>I</em>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} style={btn(editor.isActive('underline'))} title="Ctrl+U">
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleSuperscript().run()} style={btn(editor.isActive('superscript'))} title="^^윗첨자^^">
          x²
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleSubscript().run()} style={btn(editor.isActive('subscript'))} title="__아랫첨자__">
          x₂
        </button>

        <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)', margin: '0 4px' }} />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={btn(editor.isActive('bulletList'))}>
          • 목록
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btn(editor.isActive('orderedList'))}>
          1. 목록
        </button>

        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Lys^^336^^ → Lys³³⁶ · H__2__O → H₂O
        </span>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}