import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown, type MarkdownStorage } from 'tiptap-markdown'
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

declare module '@tiptap/core' {
  interface Storage {
    markdown: MarkdownStorage
  }
}

interface RichTextEditorProps {
  value: string
  onChange: (markdown: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false }), Markdown],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown())
    },
    editorProps: {
      attributes: {
        class:
          'min-h-32 rounded-b-lg border border-t-0 border-input p-2.5 text-sm outline-none [&_a]:underline [&_h1]:text-lg [&_h1]:font-medium [&_h2]:text-base [&_h2]:font-medium [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4',
      },
    },
  })

  if (!editor) {
    return null
  }

  function toggleLink() {
    const url = window.prompt('URL')
    if (!url) return
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-input bg-muted/50 p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('bold') && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('italic') && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('heading', { level: 1 }) && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('heading', { level: 2 }) && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('bulletList') && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('orderedList') && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('link') && 'bg-accent')}
          onClick={toggleLink}
        >
          <LinkIcon />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
