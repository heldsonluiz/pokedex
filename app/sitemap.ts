import type { MetadataRoute } from "next"
export default function sitemap(): MetadataRoute.Sitemap {
  return ["privacidade", "termos"].map((path) => ({
    url: `https://pokedex.devfesttriangulo.com.br/${path}`,
  }))
}
