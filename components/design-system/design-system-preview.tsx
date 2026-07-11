"use client"

import { Moon, Sparkles, Sun } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { AppHeader } from "@/components/layout/app-header"
import { AppShell } from "@/components/layout/app-shell"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const colors = [
  { name: "Primary", className: "bg-primary" },
  { name: "Secondary", className: "bg-secondary" },
  { name: "Gamification", className: "bg-gamification" },
  { name: "Success", className: "bg-success" },
  { name: "Destructive", className: "bg-destructive" },
]

export function DesignSystemPreview() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const isDark = theme === "dark"

  return (
    <AppShell
      theme={theme}
      header={
        <AppHeader
          greeting="Pokedex 2026"
          title="Design System"
          actions={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Ativar tema ${isDark ? "claro" : "escuro"}`}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <Sun /> : <Moon />}
            </Button>
          }
        />
      }
      navigation={<BottomNavigation />}
      contentClassName="px-4 py-6"
    >
      <div className="space-y-8">
        <section aria-labelledby="preview-typography">
          <h2
            id="preview-typography"
            className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            Tipografia
          </h2>
          <div className="space-y-2">
            <p className="text-display">Display</p>
            <h1 className="text-2xl font-bold">Título principal</h1>
            <h2 className="text-xl font-semibold">Título de seção</h2>
            <p className="text-sm">
              Geist Sans mantém textos e componentes legíveis em telas pequenas.
            </p>
            <p className="font-mono text-xs">QR: EVT-2026-X8P2M4Q9A7</p>
            <p className="font-pixel-square text-lg text-gamification">
              1.850 XP
            </p>
          </div>
        </section>

        <section aria-labelledby="preview-colors">
          <h2
            id="preview-colors"
            className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            Cores
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {colors.map(({ name, className }) => (
              <div key={name} className="min-w-0 text-center">
                <div
                  className={`mx-auto mb-1 size-10 rounded-xl ${className}`}
                />
                <span className="block truncate text-tiny text-muted-foreground">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="preview-buttons">
          <h2
            id="preview-buttons"
            className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            Ações
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Button>Primária</Button>
            <Button variant="outline">Secundária</Button>
            <Button className="col-span-2 bg-(image:--gradient-primary) text-primary-foreground hover:opacity-90">
              <Sparkles data-icon="inline-start" />
              Continuar jornada
            </Button>
            <Button className="bg-gamification text-gamification-foreground hover:bg-gamification/85">
              Ver XP
            </Button>
            <Button variant="destructive">Remover</Button>
          </div>
        </section>

        <section aria-labelledby="preview-components">
          <h2
            id="preview-components"
            className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            Componentes
          </h2>
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback>HL</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle>Heldson Luiz</CardTitle>
                  <CardDescription>Explorador nível 4</CardDescription>
                </div>
                <Badge className="ml-auto">Ativo</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={73}>
                <ProgressLabel>Passaporte</ProgressLabel>
                <ProgressValue />
              </Progress>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Cloud</Badge>
                <Badge variant="outline">IA</Badge>
                <Badge className="bg-gamification text-gamification-foreground">
                  3 tickets
                </Badge>
              </div>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-muted-foreground">
                Próximo nível: 650 XP
              </span>
            </CardFooter>
          </Card>
        </section>

        <section aria-labelledby="preview-form">
          <h2
            id="preview-form"
            className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            Formulário
          </h2>
          <div className="space-y-3">
            <Input aria-label="Nome" placeholder="Nome completo" />
            <Select defaultValue="frontend">
              <SelectTrigger className="w-full" aria-label="Área de interesse">
                <SelectValue placeholder="Área de interesse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend">Front-end</SelectItem>
                <SelectItem value="backend">Back-end</SelectItem>
                <SelectItem value="cloud">Cloud</SelectItem>
                <SelectItem value="ai">Inteligência Artificial</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              aria-label="Biografia"
              placeholder="Conte um pouco sobre você"
            />
            <Input
              aria-label="Campo inválido"
              placeholder="Estado de erro"
              aria-invalid
            />
            <Input
              aria-label="Campo desabilitado"
              placeholder="Desabilitado"
              disabled
            />
          </div>
        </section>

        <section aria-labelledby="preview-interactions">
          <h2
            id="preview-interactions"
            className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            Interações
          </h2>

          <Tabs defaultValue="missions">
            <TabsList className="w-full">
              <TabsTrigger value="missions">Missões</TabsTrigger>
              <TabsTrigger value="companies">Empresas</TabsTrigger>
              <TabsTrigger value="talks">Palestras</TabsTrigger>
            </TabsList>
            <TabsContent value="missions" className="pt-3">
              Complete missões para ganhar XP.
            </TabsContent>
            <TabsContent value="companies" className="pt-3">
              Visite todas as empresas do evento.
            </TabsContent>
            <TabsContent value="talks" className="pt-3">
              Registre presença e avalie palestras.
            </TabsContent>
          </Tabs>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Dialog>
              <DialogTrigger render={<Button variant="outline" />}>
                Abrir dialog
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar ação</DialogTitle>
                  <DialogDescription>
                    Este exemplo valida foco, overlay e contraste.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button>Confirmar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Drawer showSwipeHandle>
              <DrawerTrigger render={<Button variant="outline" />}>
                Abrir drawer
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Ação mobile</DrawerTitle>
                  <DrawerDescription>
                    O drawer concentra decisões contextuais em telas pequenas.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <Button>Continuar</Button>
                  <DrawerClose render={<Button variant="outline" />}>
                    Cancelar
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            <Button
              className="col-span-2"
              variant="secondary"
              onClick={() => toast.success("Componente validado com sucesso")}
            >
              Exibir toast
            </Button>
          </div>
        </section>

        <section aria-labelledby="preview-loading">
          <h2
            id="preview-loading"
            className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            Loading
          </h2>
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </section>
      </div>
      <Toaster theme={theme} position="top-center" />
    </AppShell>
  )
}
