
"use client"

import React from "react"
import { AppLayout } from "@/components/app-layout"
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
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui"
import { employees as initialEmployees, assignments as initialAssignments, Employee, Assignment } from "@/lib/data"
import { Car, MoreHorizontal, PlusCircle, Search } from "lucide-react"
import { EmployeeDialog } from "@/components/employee-dialog"
import { EmployeeTasksDialog } from "@/components/employee-tasks-dialog"

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = React.useState(false);
  const [isTasksDialogOpen, setIsTasksDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [employeeToEdit, setEmployeeToEdit] = React.useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  const loadData = React.useCallback(() => {
    try {
      const savedEmployees = localStorage.getItem('employees');
      setEmployees(savedEmployees ? JSON.parse(savedEmployees) : initialEmployees);
      const savedAssignments = localStorage.getItem('assignments');
       if (savedAssignments) {
            const parsedAssignments = JSON.parse(savedAssignments, (key, value) => {
                if (key === 'startTime' || key === 'endTime') {
                    return new Date(value);
                }
                return value;
            });
            setAssignments(parsedAssignments);
        } else {
            setAssignments(initialAssignments);
        }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setEmployees(initialEmployees);
      setAssignments(initialAssignments);
    }
  }, []);

  React.useEffect(() => {
    loadData();
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'employees' || event.key === 'assignments') {
            loadData();
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  const updateEmployeesAndStorage = (updatedEmployees: Employee[]) => {
    setEmployees(updatedEmployees);
    try {
      const newEmployeesJSON = JSON.stringify(updatedEmployees);
      localStorage.setItem('employees', newEmployeesJSON);
      window.dispatchEvent(new StorageEvent('storage', { key: 'employees', newValue: newEmployeesJSON }));
    } catch (error) {
      console.error("Failed to save employees to localStorage", error);
    }
  };

  const handleCreateClick = () => {
    setEmployeeToEdit(null);
    setIsEmployeeDialogOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsEmployeeDialogOpen(true);
  };

  const handleViewTasksClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsTasksDialogOpen(true);
  }

  const handleSaveEmployee = (employeeData: Employee) => {
    const isEditing = employees.some(e => e.id === employeeData.id);
    let updatedEmployees;
    if (isEditing) {
      updatedEmployees = employees.map(e => e.id === employeeData.id ? employeeData : e);
    } else {
      updatedEmployees = [...employees, employeeData];
    }
    updateEmployeesAndStorage(updatedEmployees);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    const updatedEmployees = employees.filter(e => e.id !== employeeId);
    updateEmployeesAndStorage(updatedEmployees);
  };

  const filteredEmployees = employees.filter(employee => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      employee.name.toLowerCase().includes(searchTermLower) ||
      employee.lastName.toLowerCase().includes(searchTermLower) ||
      employee.dni.toLowerCase().includes(searchTermLower) ||
      employee.nickname.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Empleados
            </h1>
            <p className="text-muted-foreground">
              Gestione el personal de la guardería.
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Empleado
          </Button>
        </header>

        <EmployeeDialog
          open={isEmployeeDialogOpen}
          setOpen={setIsEmployeeDialogOpen}
          onSave={handleSaveEmployee}
          employeeToEdit={employeeToEdit}
        />

        {selectedEmployee && (
            <EmployeeTasksDialog
                open={isTasksDialogOpen}
                setOpen={setIsTasksDialogOpen}
                employee={selectedEmployee}
                assignments={assignments.filter(a => a.employeeId === selectedEmployee.id)}
            />
        )}


        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, DNI o apodo..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Apodo</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead className="text-center">Sabe Conducir</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                        <AvatarFallback>{employee.name[0]}{employee.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        {employee.name} {employee.lastName}
                        <div className="text-xs text-muted-foreground">{employee.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.dni}</TableCell>
                  <TableCell>{employee.nickname}</TableCell>
                  <TableCell>{employee.phone}</TableCell>
                  <TableCell className="text-center">
                    {employee.canDrive && (
                      <Badge variant="outline" className="border-green-500 bg-green-50 text-green-700">
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
                        <DropdownMenuItem onClick={() => handleEditClick(employee)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewTasksClick(employee)}>Ver Tareas</DropdownMenuItem>
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
                                Esta acción no se puede deshacer. Esto eliminará permanentemente al empleado y sus datos asociados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteEmployee(employee.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
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
