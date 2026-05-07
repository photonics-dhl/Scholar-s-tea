'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils/cn'
import { EditorToolbar } from './EditorToolbar'

interface RichEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

/**
 * Tiptap 富文本编辑器封装组件
 * 支持基本的 Markdown 格式
 */
export function RichEditor({
  content = '',
  onChange,
  placeholder = '开始写作...',
  className,
  minHeight = '200px',
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none',
          'min-h-[200px]'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  return (
    <div
      className={cn(
        'rounded-lg border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-tea-primary/30 focus-within:border-tea-primary/50 transition-all',
        className
      )}
    >
      <EditorToolbar editor={editor} />
      <div style={{ minHeight }}>
        <EditorContent
          editor={editor}
          placeholder={placeholder}
          className="[&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:p-4 [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p.is-empty]:before:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-empty]:before:text-muted-foreground [&_.ProseMirror_p.is-empty]:before:float-left [&_.ProseMirror_p.is-empty]:before:pointer-events-none"
        />
      </div>
    </div>
  )
}
