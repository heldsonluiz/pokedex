"use client"

import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

const themeOptions = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
] as const satisfies ReadonlyArray<{
  value: "system" | "light" | "dark"
  label: string
  icon: LucideIcon
}>

export function ThemeSelector() {
  const { theme = "system", setTheme } = useTheme()

  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="group"
      aria-label="Tema da aplicação"
    >
      {themeOptions.map(({ value, label, icon: Icon }) => {
        const isSelected = theme === value

        return (
          <Button
            key={value}
            type="button"
            variant={isSelected ? "default" : "outline"}
            className="h-auto min-h-16 flex-col gap-1.5 px-2 py-2"
            aria-pressed={isSelected}
            onClick={() => setTheme(value)}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span className="text-xs">{label}</span>
          </Button>
        )
      })}
    </div>
  )
}
