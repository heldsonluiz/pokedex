import { notFound } from "next/navigation"

import { requireAuth } from "@/lib/require-auth"
import { getCompanyDetailsForSession } from "@/modules/companies/company.service"
import { CompanyDetailsModal } from "@/modules/companies/company-details-modal"

type CompanyDetailsModalPageProps = Readonly<{
  params: Promise<{
    companyId: string
  }>
}>

export default async function CompanyDetailsModalPage({
  params,
}: CompanyDetailsModalPageProps) {
  const [{ companyId }, session] = await Promise.all([params, requireAuth()])
  const company = await getCompanyDetailsForSession(session, companyId)

  if (!company) {
    notFound()
  }

  return <CompanyDetailsModal company={company} />
}
