import type { LucideIcon } from "lucide-react"

type FeaturePlaceholderProps = Readonly<{
  icon: LucideIcon
  title: string
  description: string
}>

export function FeaturePlaceholder({
  icon: Icon,
  title,
  description,
}: FeaturePlaceholderProps) {
  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>

      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </section>
  )
}
