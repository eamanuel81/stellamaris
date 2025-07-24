
"use client"

import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/components/ui"
import { Employee } from "@/lib/data"
import { useAuth } from '@/components/auth-provider';

export const EmployeeDialog = ({
    open,
    setOpen,
    onSave,
    employeeToEdit,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    onSave: (employee: Employee) => void;
    employeeToEdit: Employee | null;
}) => {
    const isEditMode = !!employeeToEdit;
    const { subrole: mySubrole } = useAuth();

    const [name, setName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [nickname, setNickname] = React.useState("");
    const [dni, setDni] = React.useState("");
    const [address, setAddress] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [canDrive, setCanDrive] = React.useState(false);
    const [sendLink, setSendLink] = React.useState(false);
    const [avatarKey, setAvatarKey] = React.useState(Date.now().toString());
    const [subrole, setSubrole] = React.useState<'empleado' | 'encargado' | 'admin'>('empleado');

    React.useEffect(() => {
        if (isEditMode && employeeToEdit) {
            setName(employeeToEdit.name);
            setLastName(employeeToEdit.lastName);
            setNickname(employeeToEdit.nickname);
            setDni(employeeToEdit.dni);
            setAddress(employeeToEdit.address);
            setPhone(employeeToEdit.phone);
            setEmail(employeeToEdit.email);
            setCanDrive(employeeToEdit.canDrive);
            setAvatarKey(employeeToEdit.avatarUrl);
            setSubrole(employeeToEdit.subrole || 'empleado');
            setSendLink(false); // Don't default to sending link in edit mode
        } else {
            setName("");
            setLastName("");
            setNickname("");
            setDni("");
            setAddress("");
            setPhone("");
            setEmail("");
            setCanDrive(false);
            setAvatarKey(Date.now().toString());
            setSubrole('empleado');
            setSendLink(false);
        }
    }, [employeeToEdit, isEditMode, open]);

    const handleAvatarChange = () => {
        setAvatarKey(Date.now().toString());
    };

    const handleSubmit = () => {
        if (!name || !lastName || !email) {
            alert("Por favor complete Nombre, Apellido y Email.");
            return;
        }

        const employeeData: Employee = {
            id: isEditMode ? employeeToEdit!.id : `e${Date.now()}`,
            name,
            lastName,
            nickname,
            dni,
            phone,
            address,
            canDrive,
            email,
            role: isEditMode ? employeeToEdit!.role : 'employee',
            avatarUrl: `https://i.pravatar.cc/150?u=${avatarKey}`,
            subrole,
        };

        onSave(employeeData);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Editar Empleado" : "Agregar Nuevo Empleado"}</DialogTitle>
                    <DialogDescription>
                       {isEditMode ? "Modifique los datos del empleado." : "Complete los datos del empleado. Se le enviará un enlace para generar su contraseña."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${avatarKey}`} alt="User" />
                            <AvatarFallback>{name?.[0]}{lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                            <Label>Avatar</Label>
                            <div>
                                <Button type="button" variant="outline" onClick={handleAvatarChange}>Cambiar Avatar</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Haga clic para generar un nuevo avatar aleatorio.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" placeholder="Juan" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input id="lastName" placeholder="Perez" value={lastName} onChange={e => setLastName(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nickname">Apodo</Label>
                            <Input id="nickname" placeholder="Juani" value={nickname} onChange={e => setNickname(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dni">DNI</Label>
                            <Input id="dni" placeholder="12345678" value={dni} onChange={e => setDni(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Domicilio</Label>
                        <Input id="address" placeholder="Av. Siempre Viva 123" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Número de Celular</Label>
                            <Input id="phone" type="tel" placeholder="1122334455" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="juan.perez@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                    </div>
                    {mySubrole === 'admin' && (
                      <div className="grid gap-2">
                        <Label htmlFor="subrole">Subrol</Label>
                        <select
                          id="subrole"
                          className="border rounded px-2 py-1"
                          value={subrole}
                          onChange={e => setSubrole(e.target.value as 'empleado' | 'encargado' | 'admin')}
                        >
                          <option value="empleado">Empleado</option>
                          <option value="encargado">Encargado</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="canDrive" checked={canDrive} onCheckedChange={(checked) => setCanDrive(Boolean(checked))} />
                        <Label htmlFor="canDrive" className="font-normal">
                            El empleado sabe conducir
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="sendLink" checked={sendLink} onCheckedChange={(checked) => setSendLink(Boolean(checked))} />
                        <Label htmlFor="sendLink" className="font-normal">
                            Enviar enlace para generar nueva contraseña
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Guardar Cambios' : 'Guardar Empleado'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
