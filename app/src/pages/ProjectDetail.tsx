import { useParams } from 'react-router-dom'

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1 className="text-2xl font-medium">Project: {slug}</h1>
    </div>
  )
}
