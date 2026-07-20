import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Heading } from "@/components/ui/heading"

describe("Heading", () => {
  it.each([1, 2, 3, 4, 5, 6] as const)("renders an h%i tag for level %i", (level) => {
    render(<Heading level={level}>Title</Heading>)

    const heading = screen.getByRole("heading", { level })
    expect(heading.tagName).toBe(`H${level}`)
  })

  it("forwards className and children", () => {
    render(
      <Heading level={1} className="text-3xl">
        Hello <span>world</span>
      </Heading>,
    )

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveClass("text-3xl")
    expect(heading).toHaveTextContent("Hello world")
  })
})
