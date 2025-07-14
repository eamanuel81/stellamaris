"use client"

import React from "react"
import { AppLayout } from "@/components/app-layout"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { PlusCircle } from "lucide-react"
import { employees, tasks } from "@/lib/data"

const generateTimeSlots = () => {
  const slots = []
  // from 6 AM to 1 AM next day
  for (let i = 6; i <= 24; i++) {
    slots.push(`${String(i % 24).padStart(2, '0')}:00`)
  }
  slots.push('01:00')
  return slots
}

export default function SchedulePage() {
  const timeSlots = generateTimeSlots()
  const [open, setOpen] = React.useState(false)

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Asignar Tareas
            </h1>
            <p className="text-muted-foreground">
              Configure el calendario laboral y asigne tareas a los empleados.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Asignar Tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Asignar una nueva tarea</DialogTitle>
                <DialogDescription>
                  Seleccione la tarea, el empleado y el horario.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="task">Tarea</Label>
                  <Select>
                    <SelectTrigger id="task">
                      <SelectValue placeholder="Seleccione una tarea" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map(task => (
                        <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="employee">Empleado</Label>
                  <Select>
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Seleccione un empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id} disabled={!emp.canDrive && tasks.find(t=>t.id === 't2')?.requiresDriving}>
                          {emp.name} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Hora de Inicio</Label>
                    <Input id="startTime" type="time" defaultValue="09:00" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">Hora de Fin</Label>
                    <Input id="endTime" type="time" defaultValue="11:00" />
                  </div>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" defaultValue={new Date().toISOString().split('T')[0]}/>
                 </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" onClick={() => setOpen(false)}>Asignar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-4 border-b">
              <h3 className="font-semibold">Horario de Hoy</h3>
              <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="relative h-[600px] overflow-y-auto">
            <div className="grid">
              {timeSlots.map((time, index) => (
                <div key={time} className="grid grid-cols-[auto_1fr] items-start">
                  <div className="sticky top-0 -mt-2 text-right">
                    <span className="relative top-2 pr-4 text-xs text-muted-foreground">{time}</span>
                  </div>
                  <div className="border-l border-border pl-4">
                     <div className="h-12 border-b border-dashed">
                        {/* Example Task */}
                        {time === "09:00" && (
                           <div className="relative -top-1 h-[6rem] z-10">
                             <div className="absolute w-[calc(100%-1rem)] rounded-lg bg-primary/20 p-2 border border-primary/50">
                                <p className="font-bold text-sm text-primary-foreground">Bajada de Lancha</p>
                                <p className="text-xs text-primary-foreground/80">Carlos Rodriguez</p>
                             </div>
                           </div>
                        )}
                         {time === "11:00" && (
                           <div className="relative -top-1 h-[4rem] z-10">
                             <div className="absolute w-[calc(100%-1rem)] rounded-lg bg-accent/20 p-2 border border-accent/50">
                                <p className="font-bold text-sm text-accent-foreground">Revisión de Motor</p>
                                <p className="text-xs text-accent-foreground/80">Maria Gomez</p>
                             </div>
                           </div>
                        )}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
