import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLocale } from '@/hooks/useLocale'
import { useLocalized } from '@/hooks/useLocalized'
import type { Project } from '@/types'

export function ProjectCard({ project }: { project: Project }) {
  const locale = useLocale()
  const title = useLocalized(project.title)
  const shortDescription = useLocalized(project.shortDescription)

  return (
    <Link to={`/${locale}/projects/${project.slug}`}>
      <Card className="pixel-notch h-full border border-border ring-0 transition-colors hover:border-accent hover:bg-muted/50">
        {project.cover && (
          <img
            src={project.cover}
            alt={title}
            loading="lazy"
            className="aspect-video w-full border-b border-border object-cover [filter:grayscale(1)_sepia(0.45)_saturate(1.8)_hue-rotate(-18deg)_brightness(0.82)_contrast(1.1)]"
          />
        )}
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{shortDescription}</p>
          <div className="flex flex-wrap gap-1.5">
            {project.stack.map((tech) => (
              <Badge key={tech} variant="outline">
                {tech}
              </Badge>
            ))}
          </div>
          <p
            aria-hidden
            className="font-heading text-xs uppercase tracking-wide text-accent opacity-0 transition-opacity group-hover/card:opacity-100"
          >
            $ open
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
