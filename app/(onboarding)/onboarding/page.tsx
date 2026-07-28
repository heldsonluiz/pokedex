import type { Metadata } from "next"

import { OnboardingCarousel } from "@/modules/onboarding/onboarding-carousel"

export const metadata: Metadata = {
  title: "Primeiros passos",
}

type OnboardingPageProps = Readonly<{
  searchParams: Promise<{
    step?: string | string[]
  }>
}>

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = await searchParams
  const requestedStep =
    typeof params.step === "string" ? Number(params.step) : Number.NaN
  const initialStep =
    Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 5
      ? requestedStep - 1
      : 0

  return <OnboardingCarousel initialStep={initialStep} />
}
