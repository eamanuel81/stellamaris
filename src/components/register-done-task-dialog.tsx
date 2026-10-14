"use client"

import React from "react"
import { Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@/components/ui"
import type { Client, Task } from "@/lib/data"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: Task[]
  clients: Client[]
  canDrive: boolean
  onSubmit: (data: { taskId: string; clientId: string; boatIds: string[]; observations: string }) => Promise<string | null>
}

// El empleado deja asentada una tarea que ya hizo por su cuenta (p. ej. bajó la lancha y además la limpió).
export function RegisterDoneTaskDialog({ open, onOpenChange, tasks, clients, canDrive, onSubmit }: Props) {
  const [taskId, setTaskId] = React.useState("")
  const [clientId, setClientId] = React.useState("")
  const [boatIds, setBoatIds] = React.useState<string[]>([])
  const [observations, setObservations] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setTaskId(""); setClientId(""); setBoatIds([]); setObservations(""); setError(null)
    }
  }, [open])

  const client = clients.find(c => c.id === clientId)
  const availableTasks = tasks.filter(t => canDrive || !t.requiresDriving)
  const canSave = taskId && clientId && boatIds.length > 0 && !saving

  const toggleBoat = (id: string, checked: boolean) =>
    setBoatIds(prev => (checked ? [...prev, id] : prev.filter(b => b !== id)))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const message = await onSubmit({ taskId, clientId, boatIds, observations })
    setSaving(false)
    if (message) setError(message)
    else onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar tarea realizada</DialogTitle>
          <DialogDescription>Dejá asentada una tarea que hiciste por tu cuenta. Queda a tu nombre, como completada y con la fecha de hoy.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tarea</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger><SelectValue placeholder="Elegí la tarea" /></SelectTrigger>
              <SelectContent>
                {availableTasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={v => { setClientId(v); setBoatIds([]) }}>
              <SelectTrigger><SelectValue placeholder="Elegí el cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {client && (
            <div className="space-y-2">
              <Label>Embarcación</Label>
              {(client.boats ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Este cliente no tiene embarcaciones cargadas.</p>
              ) : (client.boats ?? []).map(b => (
                <div key={b.id} className="flex items-center gap-2">
                  <Checkbox id={`boat-${b.id}`} checked={boatIds.includes(b.id)} onCheckedChange={c => toggleBoat(b.id, c === true)} />
                  <Label htmlFor={`boat-${b.id}`} className="font-normal">{b.name}</Label>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="done-notes">Observaciones (opcional)</Label>
            <Textarea id="done-notes" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Ej: estaba muy sucia, la lavé después de bajarla" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!canSave}>{saving ? "Guardando..." : "Registrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
