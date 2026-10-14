"use client"

import React from "react"
import { Search, Ship } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { Badge, Card, CardContent, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsList, TabsTrigger } from "@/components/ui"
import { useAssignments } from "@/hooks/use-assignments"
import { useClients } from "@/hooks/use-clients"
import { useTasks } from "@/hooks/use-tasks"
import { ActivityKind, computeBoatActivityRows, diagnoseActivity, isRecent, isStale } from "@/lib/boat-activity"
import { matchesAnySearch } from "@/lib/utils"
import { LevelBadge } from "@/components/traffic-light"

type Mode = "all" | "stale" | "recent"

// Textos por actividad: "lavado" = clasificador LAVADO, "bajada" = clasificador BAJADA
const LABELS: Record<ActivityKind, { title: string; lastCol: string; stale: string; recent: string; staleShort: string; never: string }> = {
  lavado: { title: "Lavado", lastCol: "Último lavado", stale: "Sin lavar", recent: "Lavadas", staleShort: "Sin lavar", never: "Sin registro de lavado" },
  bajada: { title: "Bajada", lastCol: "Última bajada", stale: "Sin bajar", recent: "Bajadas", staleShort: "Sin bajar", never: "Sin registro de bajada" },
}

const DEFAULT_DAYS = { stale: 15, recent: 7 }

export default function BoatsPage() {
  const { clients, isLoading: clientsLoading } = useClients()
  const { assignments, isLoading: assignmentsLoading } = useAssignments()
  const { tasks, isLoading: tasksLoading } = useTasks()

  const [kind, setKind] = React.useState<ActivityKind>("lavado")
  const [mode, setMode] = React.useState<Mode>("all")
  const [days, setDays] = React.useState(DEFAULT_DAYS)
  const [search, setSearch] = React.useState("")

  const rows = React.useMemo(() => computeBoatActivityRows(clients, assignments, tasks), [clients, assignments, tasks])
  const L = LABELS[kind]
  const diag = React.useMemo(() => diagnoseActivity(assignments, tasks, kind), [assignments, tasks, kind])

  const visible = rows
    .filter(r => mode === "all" || (mode === "stale" ? isStale(r, kind, days.stale) : isRecent(r, kind, days.recent)))
    .filter(r => !search || matchesAnySearch([r.boatName, r.clientName, r.registrationNumber], search))
    // Primero las que más tiempo llevan sin hacerse (nunca hechas arriba de todo)
    .sort((a, b) => (b.daysSince[kind] ?? Infinity) - (a.daysSince[kind] ?? Infinity))

  const staleCount = rows.filter(r => isStale(r, kind, days.stale)).length
  const recentCount = rows.filter(r => isRecent(r, kind, days.recent)).length
  const activeKey = mode === "all" ? null : mode

  if (clientsLoading || assignmentsLoading || tasksLoading) {
    return (
      <AppLayout>
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    )
  }

  const badgeFor = (row: (typeof rows)[number]) => {
    const d = row.daysSince[kind]
    if (d === null) return <Badge variant="outline" className="border-red-400 bg-red-100 text-red-800">{L.never}</Badge>
    const text = d === 0 ? "Hoy" : `Hace ${d} días`
    if (isStale(row, kind, days.stale)) return <Badge variant="outline" className="border-red-400 bg-red-100 text-red-800">{text}</Badge>
    if (isRecent(row, kind, days.recent)) return <Badge variant="outline" className="border-green-400 bg-green-100 text-green-800">{text}</Badge>
    return <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-800">{text}</Badge>
  }
  const dateOf = (d: Date | null) => (d ? d.toLocaleDateString("es-AR") : "Nunca")

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Embarcaciones</h1>
          <p className="text-muted-foreground">
            Cuándo se lavó y se bajó cada lancha, según las tareas completadas con clasificador LAVADO o BAJADA.
          </p>
        </header>

        <Tabs value={kind} onValueChange={v => setKind(v as ActivityKind)}>
          <TabsList>
            <TabsTrigger value="lavado">Lavado</TabsTrigger>
            <TabsTrigger value="bajada">Bajada</TabsTrigger>
          </TabsList>
        </Tabs>

        {diag.taskTypes === 0 && (
          <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
            Ningún tipo de tarea tiene el clasificador <b>{kind.toUpperCase()}</b>, por eso todas las lanchas figuran sin registro.
            Entrá a <b>Tipos de Tareas</b>, editá la tarea de {kind} y escribí <b>{kind.toUpperCase()}</b> en el campo <b>Tipo</b>.
          </div>
        )}
        {diag.taskTypes > 0 && diag.completedWithoutBoat > 0 && (
          <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
            Hay {diag.completedWithoutBoat} tarea(s) de {kind} completadas <b>sin embarcación asignada</b>: no se pueden contar.
            Asignales la embarcación desde Asignar Tareas.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total de embarcaciones</p><p className="text-3xl font-bold">{rows.length}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{L.stale} hace más de {days.stale} días</p><p className="text-3xl font-bold text-red-600">{staleCount}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{L.recent} en los últimos {days.recent} días</p><p className="text-3xl font-bold text-green-600">{recentCount}</p></CardContent></Card>
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
              <SelectItem value="stale">{L.stale} hace más de X días</SelectItem>
              <SelectItem value="recent">{L.recent} en los últimos X días</SelectItem>
            </SelectContent>
          </Select>
          {activeKey && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">X =</span>
              <Input
                type="number"
                min={1}
                className="w-24"
                value={days[activeKey]}
                onChange={e => {
                  const n = Math.max(1, Number(e.target.value) || 1)
                  setDays(prev => ({ ...prev, [activeKey]: n }))
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
                <TableHead>{L.lastCol}</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden sm:table-cell">Suciedad informada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No hay embarcaciones para este filtro.</TableCell></TableRow>
              ) : visible.map(r => (
                <TableRow key={`${r.clientId}-${r.boatId}`}>
                  <TableCell className="font-medium"><span className="flex items-center gap-2"><Ship className="h-4 w-4 text-muted-foreground" />{r.boatName}</span></TableCell>
                  <TableCell>{r.clientName}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.registrationNumber}</TableCell>
                  <TableCell>{dateOf(r.last[kind])}</TableCell>
                  <TableCell>{badgeFor(r)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{r.dirt ? (
                      <span className="flex flex-col items-start gap-0.5">
                        <span className={r.dirt.washedSince ? "opacity-60" : undefined}><LevelBadge kind="dirt" level={r.dirt.level} /></span>
                        <span className="text-xs text-muted-foreground">
                          {r.dirt.reportedAt.toLocaleDateString("es-AR")}{r.dirt.washedSince ? " · luego se lavó" : ""}
                        </span>
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  )
}
