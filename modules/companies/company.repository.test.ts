import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/firebase/admin", () => ({
  firestore: {},
}))

import * as companyRepository from "./company.repository"

describe("company repository", () => {
  it("loads the server repository without evaluating an invalid Zod schema", () => {
    expect(companyRepository.completeCompanyVisit).toBeTypeOf("function")
    expect(companyRepository.findActiveCompanies).toBeTypeOf("function")
    expect(companyRepository.findCompanyById).toBeTypeOf("function")
    expect(companyRepository.findCompanyVisit).toBeTypeOf("function")
    expect(companyRepository.findCompanyVisitsByParticipant).toBeTypeOf(
      "function"
    )
  })
})
