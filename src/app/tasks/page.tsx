"use client"

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@/components/ui"
import { AppLayout } from "@/components/app-layout"
import { Car, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react"
import { tasks } from "@/lib/data"
import React from "react"
import { Badge } from "@/components/ui/badge"

export default function TasksPage() {
    const [open, setOpen] = React.useState(false);
  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Tipos de Tareas
            </h1>
            <p className="text-muted-foreground">
              Cree y gestione los tipos de tareas para asignar.
            </p>
          </div>
           <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Crear nuevo tipo de tarea</DialogTitle>
                <DialogDescription>
                  Complete los detalles de la nueva tarea. Podrá asignarla a los empleados más tarde.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título de la Tarea</Label>
                  <Input id="title" placeholder="Ej: Limpieza de cubierta" />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" placeholder="Describa la tarea en detalle..." />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="duration">Duración (minutos)</Label>
                        <Input id="duration" type="number" placeholder="Ej: 60" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="type">Tipo (Opcional)</Label>
                        <Input id="type" placeholder="Ej: Mantenimiento" />
                    </div>
                </div>
                 <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="requiresDriving" />
                    <Label htmlFor="requiresDriving" className="font-normal">
                        Esta tarea necesita que el empleado sepa conducir
                    </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" onClick={() => setOpen(false)}>Crear Tarea</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Duración</TableHead>
                <TableHead className="text-center">Requiere Conducir</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell className="max-w-sm truncate text-muted-foreground">{task.description}</TableCell>
                  <TableCell className="text-center">{task.duration} min</TableCell>
                  <TableCell className="text-center">
                    {task.requiresDriving && (
                      <Badge variant="outline" className="border-amber-500 bg-amber-50 text-amber-700">
                        <Car className="mr-2 h-4 w-4" />
                        Sí
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    Eliminar
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de tarea.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

// Dummy Card component to resolve compilation error
const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className} {...props} />
)
