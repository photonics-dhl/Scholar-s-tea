'use client'

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  SeparatorHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor | null
  className?: string
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  icon: Icon,
  title,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  icon: React.ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8 rounded-md',
        active && 'bg-tea-primary/10 text-tea-primary'
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

/**
 * Tiptap 编辑器工具栏
 * 提供常用的富文本格式化按钮
 */
export function EditorToolbar({ editor, className }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30 rounded-t-lg',
        className
      )}
    >
      <ToolbarButton
        icon={Bold}
        title="粗体 (Ctrl+B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
      />
      <ToolbarButton
        icon={Italic}
        title="斜体 (Ctrl+I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
      />
      <ToolbarButton
        icon={Strikethrough}
        title="删除线"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
      />
      <ToolbarButton
        icon={Code}
        title="行内代码"
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
      />

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        icon={Heading1}
        title="标题 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
      />
      <ToolbarButton
        icon={Heading2}
        title="标题 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
      />

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        icon={List}
        title="无序列表"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
      />
      <ToolbarButton
        icon={ListOrdered}
        title="有序列表"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
      />
      <ToolbarButton
        icon={Quote}
        title="引用"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
      />

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        icon={SeparatorHorizontal}
        title="分割线"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        icon={Undo}
        title="撤销 (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      />
      <ToolbarButton
        icon={Redo}
        title="重做 (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      />
    </div>
  )
}
