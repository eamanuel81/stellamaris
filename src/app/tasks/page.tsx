"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
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
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui"
import { AppLayout } from "@/components/app-layout"
import { Car, ChevronDown, MoreHorizontal, PlusCircle, Search } from "lucide-react"
import { tasks as initialTasks, employees, Task } from "@/lib/data"
import React from "react"
import { Badge } from "@/components/ui/badge"

const getEmployeeById = (id: string) => employees.find(e => e.id === a.id)

const CreateTaskDialog = ({ setOpen, onTaskCreate }: { setOpen: (open: boolean) => void; onTaskCreate: (newTask: Task) => void }) => {
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [duration, setDuration] = React.useState<number | "">("");
    const [type, setType] = React.useState("");
    const [requiresDriving, setRequiresDriving] = React.useState(false);
    const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([]);
    
    const handleEmployeeSelect = (employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    }
    
    const handleSubmit = () => {
        if (!title || !description || !duration) {
            // Basic validation
            alert("Por favor complete Título, Descripción y Duración.");
            return;
        }

        const newTask: Task = {
            id: `t${Date.now()}`,
            title,
            description,
            duration: Number(duration),
            type,
            requiresDriving,
            qualifiedEmployeeIds: selectedEmployees
        };

        onTaskCreate(newTask);
        setOpen(false);
    }

    return (
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
                <Input id="title" placeholder="Ej: Limpieza de cubierta" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
                <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" placeholder="Describa la tarea en detalle..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
                <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="duration">Duración (minutos)</Label>
                    <Input id="duration" type="number" placeholder="Ej: 60" value={duration} onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                    <div className="grid gap-2">
                    <Label htmlFor="type">Tipo (Opcional)</Label>
                    <Input id="type" placeholder="Ej: Mantenimiento" value={type} onChange={e => setType(e.target.value)} />
                </div>
            </div>
                <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="requiresDriving" checked={requiresDriving} onCheckedChange={(checked) => setRequiresDriving(Boolean(checked))} />
                <Label htmlFor="requiresDriving" className="font-normal">
                    Esta tarea necesita que el empleado sepa conducir
                </Label>
            </div>
            <div className="grid gap-2 pt-2">
                <Label>Empleados Cualificados</Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex justify-between items-center font-normal">
                            <span className="truncate">
                                {selectedEmployees.length === 0 && "Seleccione empleados"}
                                {selectedEmployees.length === 1 && employees.find(e => e.id === selectedEmployees[0])?.name + ' ' + employees.find(e => e.id === selectedEmployees[0])?.lastName}
                                {selectedEmployees.length > 1 && `${selectedEmployees.length} empleados seleccionados`}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {employees.map(emp => (
                            <DropdownMenuCheckboxItem
                                key={emp.id}
                                checked={selectedEmployees.includes(emp.id)}
                                onSelect={(e) => e.preventDefault()}
                                onCheckedChange={() => handleEmployeeSelect(emp.id)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span>{emp.name} {emp.lastName}</span>
                                    {emp.canDrive && <Car className="h-4 w-4 text-muted-foreground" />}
                                </div>
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex flex-wrap gap-1 mt-2">
                    {selectedEmployees.map(id => {
                        const emp = employees.find(e => e.id === id);
                        return emp ? <Badge key={id} variant="secondary">{emp.name} {emp.lastName}</Badge> : null;
                    })}
                </div>
            </div>
            </div>
            <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); }}>Cancelar</Button>
            <Button type="submit" onClick={handleSubmit}>Crear Tarea</Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default function TasksPage() {
    const [open, setOpen] = React.useState(false);
    const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
    const [searchTerm, setSearchTerm] = React.useState("");

    const handleCreateTask = (newTask: Task) => {
        setTasks(prev => [...prev, newTask]);
    }

    const filteredTasks = tasks.filter(task => {
        const searchTermLower = searchTerm.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchTermLower);
        
        const employeeMatch = task.qualifiedEmployeeIds?.some(empId => {
            const employee = employees.find(e => e.id === empId);
            return employee && (
                employee.name.toLowerCase().includes(searchTermLower) ||
                employee.lastName.toLowerCase().includes(searchTermLower)
            );
        });

        return titleMatch || employeeMatch;
    });
    
  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <CreateTaskDialog setOpen={setOpen} onTaskCreate={handleCreateTask} />
          </Dialog>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por título o empleado cualificado..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
              {filteredTasks.map((task) => (
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
