import type { ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

const LEVEL_TAG = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const

interface HeadingProps extends ComponentPropsWithoutRef<"h1"> {
  level: HeadingLevel
}

function Heading({ level, className, ...props }: HeadingProps) {
  const Tag = LEVEL_TAG[level]
  return <Tag data-slot="heading" className={cn(className)} {...props} />
}

export { Heading }
