import { useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Markdown, type MarkdownStorage } from 'tiptap-markdown'
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Link as LinkIcon, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

declare module '@tiptap/core' {
  interface Storage {
    markdown: MarkdownStorage
  }
}

interface ToolbarAction {
  icon: LucideIcon
  isActive: (editor: Editor) => boolean
  run: (editor: Editor) => void
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: Bold, isActive: (editor) => editor.isActive('bold'), run: (editor) => editor.chain().focus().toggleBold().run() },
  {
    icon: Italic,
    isActive: (editor) => editor.isActive('italic'),
    run: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    icon: Heading1,
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    icon: Heading2,
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    icon: List,
    isActive: (editor) => editor.isActive('bulletList'),
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    icon: ListOrdered,
    isActive: (editor) => editor.isActive('orderedList'),
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    icon: LinkIcon,
    isActive: (editor) => editor.isActive('link'),
    run: (editor) => {
      const url = window.prompt('URL')
      if (!url) return
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    },
  },
]

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

  // [FIX] TipTap's `content` option only seeds the editor once, at creation — it doesn't react
  // to `value` changing afterwards. LocalizedField swaps `value` when the admin switches the
  // uk/ru/en tab, but without this the editor kept showing whatever locale it mounted with.
  // Comparing against the editor's own current markdown (not just tracking the previous prop)
  // is what avoids fighting the user's typing: onUpdate -> onChange -> this effect re-runs with
  // a `value` that already matches the editor's content, so setContent is skipped and the
  // cursor/selection isn't reset on every keystroke.
  useEffect(() => {
    if (!editor) return
    if (editor.storage.markdown.getMarkdown() !== value) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-input bg-muted/50 p-1">
        {TOOLBAR_ACTIONS.map(({ icon: Icon, isActive, run }, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(isActive(editor) && 'bg-accent')}
            onClick={() => run(editor)}
          >
            <Icon />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
