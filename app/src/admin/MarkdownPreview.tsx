import { marked } from 'marked'

// Admin-only preview for a single trusted user — no sanitization here.
// If this markdown is ever rendered on the public site to visitors,
// that later work must sanitize the output (e.g. with DOMPurify) since
// it becomes visitor-facing HTML.
export function MarkdownPreview({ markdown }: { markdown: string }) {
  const html = marked.parse(markdown, { async: false })

  return (
    <div
      className="min-h-16 rounded-lg border border-input p-2.5 text-sm [&_a]:underline [&_h1]:text-lg [&_h1]:font-medium [&_h2]:text-base [&_h2]:font-medium [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
