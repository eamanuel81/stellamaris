
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
import { useEmployees } from '@/hooks/use-employees';
import { useAuth } from '@/components/auth-provider';
import { matchesAnySearch } from '@/lib/utils';

export default function EmployeesPage() {
  const { employees, isLoading, error, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { subrole } = useAuth();
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = React.useState(false);
  const [isTasksDialogOpen, setIsTasksDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [employeeToEdit, setEmployeeToEdit] = React.useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [employeeToDelete, setEmployeeToDelete] = React.useState<Employee | null>(null);

  const handleCreateClick = () => {
    setEmployeeToEdit(null);
    setIsEmployeeDialogOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    // Si el diálogo ya está abierto, ciérralo primero
    if (isEmployeeDialogOpen) {
      setIsEmployeeDialogOpen(false);
      // Espera un momento para que el diálogo se cierre completamente
      setTimeout(() => {
        setEmployeeToEdit(employee);
        setIsEmployeeDialogOpen(true);
      }, 100);
    } else {
      setEmployeeToEdit(employee);
      setIsEmployeeDialogOpen(true);
    }
  };

  const handleCloseEmployeeDialog = (open: boolean) => {
    setIsEmployeeDialogOpen(open);
    if (!open) {
      // Limpiar después de cerrar para asegurar limpieza completa
      setTimeout(() => {
        setEmployeeToEdit(null);
      }, 300);
    }
  };

  const handleViewTasksClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsTasksDialogOpen(true);
  };

  const handleSaveEmployee = async (employeeData: Employee) => {
    setActionLoading(true);
    setActionError(null);
    if (employeeToEdit) {
      const { error } = await updateEmployee(employeeData);
      if (error) setActionError(error.message);
    } else {
      const { id, ...employeeDataWithoutId } = employeeData;
      const { error } = await addEmployee(employeeDataWithoutId as Omit<Employee, 'id'>);
      if (error) setActionError(error.message);
    }
    setActionLoading(false);
  };

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setActionLoading(true);
    setActionError(null);
    const { error } = await deleteEmployee(employeeToDelete.id);
    if (error) setActionError(error.message);
    setActionLoading(false);
    setIsDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  const filteredEmployees = employees.filter(employee => {
    return matchesAnySearch(
      [employee.name, employee.lastName, employee.dni, employee.nickname, employee.email, employee.phone],
      searchTerm
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
          {subrole !== 'encargado' && (
            <Button onClick={handleCreateClick} disabled={actionLoading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Empleado
            </Button>
          )}
        </header>

        {isEmployeeDialogOpen && (
            <EmployeeDialog
              key={employeeToEdit ? `edit-${employeeToEdit.id}` : 'create'}
              open={isEmployeeDialogOpen}
              setOpen={handleCloseEmployeeDialog}
              onSave={handleSaveEmployee}
              employeeToEdit={employeeToEdit}
            />
        )}
        {selectedEmployee && (
          <EmployeeTasksDialog
            open={isTasksDialogOpen}
            setOpen={setIsTasksDialogOpen}
            employee={selectedEmployee}
            assignments={[]}
          />
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente al empleado {employeeToDelete?.name} {employeeToDelete?.lastName} y sus datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, DNI o apodo..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading || actionLoading ? (
          <div className="text-center py-8">Cargando empleados...</div>
        ) : error || actionError ? (
          <div className="text-center text-red-500 py-8">Error: {error || actionError}</div>
        ) : (
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
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        {subrole !== 'encargado' && (
                          <DropdownMenuItem 
                            className="cursor-pointer" 
                            onSelect={(e) => {
                              e.preventDefault();
                              setTimeout(() => handleEditClick(employee), 0);
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="cursor-pointer" 
                          onSelect={(e) => {
                            e.preventDefault();
                            setTimeout(() => handleViewTasksClick(employee), 0);
                          }}
                        >
                          Ver Tareas
                        </DropdownMenuItem>
                        {subrole !== 'encargado' && (
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                            onSelect={(e) => {
                              e.preventDefault();
                              setTimeout(() => handleDeleteClick(employee), 0);
                            }}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AppLayout>
  );
}
