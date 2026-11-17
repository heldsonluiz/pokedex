import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"

import { requireAuth } from "@/lib/require-auth"
import { getCompanyDetailsForSession } from "@/modules/companies/company.service"
import { CompanyDetails } from "@/modules/companies/company-details"

type CompanyDetailsPageProps = Readonly<{
  params: Promise<{
    companyId: string
  }>
}>

const loadDetails = cache(async (companyId: string) =>
  getCompanyDetailsForSession(await requireAuth(), companyId)
)
export async function generateMetadata({
  params,
}: CompanyDetailsPageProps): Promise<Metadata> {
  const { companyId } = await params
  const company = await loadDetails(companyId)
  if (!company) notFound()
  return {
    title: company.name,
    description: `Informações de ${company.name}, visita ao estande e preferência de contato no DevFest.`,
  }
}

export default async function CompanyDetailsPage({
  params,
}: CompanyDetailsPageProps) {
  const { companyId } = await params
  const company = await loadDetails(companyId)

  if (!company) {
    notFound()
  }

  return <CompanyDetails company={company} />
}
