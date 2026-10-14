"use client"

import React from "react"
import { Search, Ship } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { useAuth } from "@/components/auth-provider"
import { Badge, Card, CardContent, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import { useAssignments } from "@/hooks/use-assignments"
import { useClients } from "@/hooks/use-clients"
import { useTasks } from "@/hooks/use-tasks"
import { computeBoatWashRows, isRecentlyWashed, isUnwashed } from "@/lib/boat-wash"
import { matchesAnySearch } from "@/lib/utils"

type Mode = "all" | "unwashed" | "washed"

const DEFAULT_DAYS: Record<Exclude<Mode, "all">, number> = { unwashed: 15, washed: 7 }

export default function BoatsPage() {
  const { role, subrole } = useAuth()
  const canView = role === "admin" || subrole === "admin" || subrole === "encargado"
  const { clients, isLoading: clientsLoading } = useClients()
  const { assignments, isLoading: assignmentsLoading } = useAssignments()
  const { tasks, isLoading: tasksLoading } = useTasks()

  const [mode, setMode] = React.useState<Mode>("all")
  const [days, setDays] = React.useState<Record<Exclude<Mode, "all">, number>>(DEFAULT_DAYS)
  const [search, setSearch] = React.useState("")

  const rows = React.useMemo(() => computeBoatWashRows(clients, assignments, tasks), [clients, assignments, tasks])

  const activeDays = mode === "all" ? null : days[mode]
  const visible = rows
    .filter(r => mode === "all" || (mode === "unwashed" ? isUnwashed(r, days.unwashed) : isRecentlyWashed(r, days.washed)))
    .filter(r => !search || matchesAnySearch([r.boatName, r.clientName, r.registrationNumber], search))
    // Primero las que más tiempo llevan sin lavar (nunca lavadas arriba de todo)
    .sort((a, b) => (b.daysSinceWash ?? Infinity) - (a.daysSinceWash ?? Infinity))

  const unwashedCount = rows.filter(r => isUnwashed(r, days.unwashed)).length
  const washedCount = rows.filter(r => isRecentlyWashed(r, days.washed)).length

  if (clientsLoading || assignmentsLoading || tasksLoading) {
    return (
      <AppLayout>
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    )
  }

  if (!canView) {
    return (
      <AppLayout>
        <p className="py-8 text-center text-muted-foreground">No tenés acceso a esta sección.</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Embarcaciones</h1>
          <p className="text-muted-foreground">
            Estado de lavado de cada lancha según las tareas con clasificador LAVADO completadas.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total de embarcaciones</p><p className="text-3xl font-bold">{rows.length}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Sin lavar hace más de {days.unwashed} días</p><p className="text-3xl font-bold text-red-600">{unwashedCount}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Lavadas en los últimos {days.washed} días</p><p className="text-3xl font-bold text-green-600">{washedCount}</p></CardContent></Card>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" placeholder="Buscar por embarcación, cliente o matrícula..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={mode} onValueChange={v => setMode(v as Mode)}>
            <SelectTrigger className="w-full sm:w-[260px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las embarcaciones</SelectItem>
              <SelectItem value="unwashed">Sin lavar hace más de X días</SelectItem>
              <SelectItem value="washed">Lavadas en los últimos X días</SelectItem>
            </SelectContent>
          </Select>
          {activeDays !== null && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">X =</span>
              <Input
                type="number"
                min={1}
                className="w-24"
                value={activeDays}
                onChange={e => {
                  const n = Math.max(1, Number(e.target.value) || 1)
                  setDays(prev => ({ ...prev, [mode as "unwashed" | "washed"]: n }))
                }}
              />
              <span className="text-sm text-muted-foreground">días</span>
            </div>
          )}
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Embarcación</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Matrícula</TableHead>
                <TableHead>Último lavado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No hay embarcaciones para este filtro.</TableCell></TableRow>
              ) : visible.map(r => (
                <TableRow key={`${r.clientId}-${r.boatId}`}>
                  <TableCell className="font-medium"><span className="flex items-center gap-2"><Ship className="h-4 w-4 text-muted-foreground" />{r.boatName}</span></TableCell>
                  <TableCell>{r.clientName}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.registrationNumber}</TableCell>
                  <TableCell>{r.lastWashAt ? r.lastWashAt.toLocaleDateString("es-AR") : "Nunca"}</TableCell>
                  <TableCell>
                    {r.daysSinceWash === null ? (
                      <Badge variant="outline" className="border-red-400 bg-red-100 text-red-800">Sin registro de lavado</Badge>
                    ) : isUnwashed(r, days.unwashed) ? (
                      <Badge variant="outline" className="border-red-400 bg-red-100 text-red-800">Hace {r.daysSinceWash} días</Badge>
                    ) : isRecentlyWashed(r, days.washed) ? (
                      <Badge variant="outline" className="border-green-400 bg-green-100 text-green-800">{r.daysSinceWash === 0 ? "Hoy" : `Hace ${r.daysSinceWash} días`}</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-800">Hace {r.daysSinceWash} días</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  )
}
