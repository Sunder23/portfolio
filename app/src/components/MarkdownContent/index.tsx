import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'

export function MarkdownContent({ markdown, className }: { markdown: string; className?: string }) {
  const html = DOMPurify.sanitize(marked.parse(markdown, { async: false }))

  return (
    <div
      className={cn(
        'text-sm [&_a]:underline [&_h1]:text-lg [&_h1]:font-medium [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-medium [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
