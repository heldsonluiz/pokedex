import Image from "next/image"
import Link from "next/link"

import { EmptyState } from "@/components/layout/empty-state"
import { buttonVariants } from "@/components/ui/button"

type NotFoundStateProps = Readonly<{
  title: string
  description: string
  href: string
  actionLabel: string
  className?: string
}>

export function NotFoundState({
  title,
  description,
  href,
  actionLabel,
  className,
}: NotFoundStateProps) {
  return (
    <EmptyState
      className={className}
      mediaClassName="bg-transparent p-0"
      icon={
        <Image
          src="/images/mascot/states/not-found.png"
          alt=""
          width={512}
          height={512}
          className="h-auto w-48 sm:w-56"
          priority
        />
      }
      title={title}
      description={description}
      action={
        <Link href={href} className={buttonVariants()}>
          {actionLabel}
        </Link>
      }
    />
  )
}
