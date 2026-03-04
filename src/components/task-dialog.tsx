
"use client"

import React from "react"
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Input,
  Label,
  Textarea,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui"
import { Car, ChevronDown, PlusCircle, Trash2 } from "lucide-react"
import { employees, Task, TaskExtra } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { useEmployees } from '@/hooks/use-employees';

export const TaskDialog = ({ 
    open, 
    setOpen, 
    onTaskSave, 
    taskToEdit 
}: { 
    open: boolean;
    setOpen: (open: boolean) => void; 
    onTaskSave: (task: Task) => void;
    taskToEdit: Task | null;
}) => {
    const isEditMode = !!taskToEdit;
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [duration, setDuration] = React.useState<number | "">("");
    const [type, setType] = React.useState("");
    const [requiresDriving, setRequiresDriving] = React.useState(false);
    const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([]);
    const [extras, setExtras] = React.useState<TaskExtra[]>([]);

    const { employees, isLoading } = useEmployees();
    const qualifiedEmployees = React.useMemo(() => 
        employees.filter(e => e.subrole === 'empleado'), 
        [employees]
    );

    React.useEffect(() => {
        if (isEditMode && taskToEdit) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description);
            setDuration(taskToEdit.duration);
            setType(taskToEdit.type || "");
            setRequiresDriving(taskToEdit.requiresDriving);
            setSelectedEmployees(taskToEdit.qualifiedEmployeeIds || []);
            setExtras(taskToEdit.extras || []);
        } else if (open && !isEditMode) {
            // Solo resetear cuando se abre el diálogo y NO está en modo edición
            setTitle("");
            setDescription("");
            setDuration("");
            setType("");
            setRequiresDriving(false);
            // Preseleccionar todos los empleados por defecto cuando se crea una nueva tarea
            setSelectedEmployees(qualifiedEmployees.map(emp => emp.id));
            setExtras([]);
        }
    }, [taskToEdit, isEditMode, open, qualifiedEmployees]); // Depend on `open` and `qualifiedEmployees` to reset form
    
    const handleEmployeeSelect = (employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    }
    
    const handleSelectAllEmployees = () => {
        if (selectedEmployees.length === qualifiedEmployees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(qualifiedEmployees.map(emp => emp.id));
        }
    }

    const handleAddExtra = () => {
        setExtras(prev => [...prev, { id: `extra-${Date.now()}`, name: '', price: 0 }]);
    }

    const handleExtraChange = (index: number, field: 'name' | 'price', value: string | number) => {
        const newExtras = [...extras];
        if (field === 'price') {
             const price = Number(value);
            newExtras[index][field] = isNaN(price) ? 0 : price;
        } else {
            newExtras[index][field] = String(value);
        }
        setExtras(newExtras);
    }
    
    const handleRemoveExtra = (index: number) => {
        setExtras(prev => prev.filter((_, i) => i !== index));
    }

    const handleSubmit = () => {
        if (!title || !duration) {
            alert("Por favor complete Título y Duración.");
            return;
        }
        const baseTaskData = {
            title,
            description,
            duration: Number(duration),
            type,
            requiresDriving,
            qualifiedEmployeeIds: selectedEmployees,
            extras: extras.filter(e => e.name.trim() !== "")
        };
        let taskData: Task;
        if (isEditMode) {
            taskData = { ...baseTaskData, id: taskToEdit!.id } as Task;
        } else {
            // No enviar id, lo genera Supabase
            taskData = baseTaskData as Task;
        }
        onTaskSave(taskData);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
             <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Tarea' : 'Crear nuevo tipo de tarea'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Modifique los detalles de la tarea.' : 'Complete los detalles de la nueva tarea. Podrá asignarla a los empleados más tarde.'}
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="general">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="extras">Extras Opcionales</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general">
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Título de la Tarea</Label>
                                <Input id="title" placeholder="Ej: Limpieza de cubierta" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción (Opcional)</Label>
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
                                                {selectedEmployees.length === 0 && "Seleccione empleados (opcional)"}
                                                {selectedEmployees.length === qualifiedEmployees.length && "Todos los empleados seleccionados"}
                                                {selectedEmployees.length > 0 && selectedEmployees.length < qualifiedEmployees.length && `${selectedEmployees.length} empleados seleccionados`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent 
                                        className="w-[--radix-dropdown-menu-trigger-width] max-h-[400px] !overflow-hidden p-0"
                                    >
                                        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                                            <div className="p-1 sticky top-0 bg-popover z-10 border-b">
                                                <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuCheckboxItem
                                                    checked={selectedEmployees.length === qualifiedEmployees.length && qualifiedEmployees.length > 0}
                                                    onCheckedChange={handleSelectAllEmployees}
                                                    onSelect={(e) => e.preventDefault()}
                                                >
                                                    Seleccionar Todos
                                                </DropdownMenuCheckboxItem>
                                                <DropdownMenuSeparator />
                                            </div>
                                            <div className="p-1">
                                                {qualifiedEmployees.map(emp => (
                                                    <DropdownMenuCheckboxItem
                                                        key={emp.id}
                                                        checked={selectedEmployees.includes(emp.id)}
                                                        onSelect={(e) => e.preventDefault()}
                                                        onCheckedChange={() => handleEmployeeSelect(emp.id)}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span>{emp.name} {emp.lastName}</span>
                                                            {emp.canDrive && <Car className="h-4 w-4 text-muted-foreground ml-2" />}
                                                        </div>
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </div>
                                        </div>
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
                    </TabsContent>
                    <TabsContent value="extras">
                         <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                            <div className="space-y-4">
                                {extras.map((extra, index) => (
                                    <div key={extra.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                                        <Input 
                                            placeholder="Nombre del extra (ej. Nafta)" 
                                            value={extra.name}
                                            onChange={(e) => handleExtraChange(index, 'name', e.target.value)}
                                        />
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground text-sm">AR$</span>
                                            <Input 
                                                type="number" 
                                                placeholder="Precio (opcional)" 
                                                className="w-40 pl-10"
                                                value={extra.price || ''}
                                                onChange={(e) => handleExtraChange(index, 'price', e.target.value)}
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveExtra(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" onClick={handleAddExtra} className="mt-2">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Agregar Extra
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); }}>Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Guardar Cambios' : 'Crear Tarea'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
