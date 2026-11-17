import type { MetadataRoute } from "next"
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/q/"] },
    sitemap: "https://pokedex.devfesttriangulo.com.br/sitemap.xml",
  }
}
