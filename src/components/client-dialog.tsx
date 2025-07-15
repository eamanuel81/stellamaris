
"use client"

import React from "react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@/components/ui"
import { PlusCircle, Trash2 } from "lucide-react"
import { Client, Boat } from "@/lib/data"

export const ClientDialog = ({
    open,
    setOpen,
    onSave,
    clientToEdit
}: {
    open: boolean,
    setOpen: (open: boolean) => void,
    onSave: (client: Client) => void,
    clientToEdit: Client | null
}) => {
    const isEditMode = !!clientToEdit;
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [internalNote, setInternalNote] = React.useState('');
    const [boats, setBoats] = React.useState<Boat[]>([]);

    React.useEffect(() => {
        if (isEditMode && clientToEdit) {
            setFirstName(clientToEdit.firstName);
            setLastName(clientToEdit.lastName);
            setEmail(clientToEdit.email);
            setPhone(clientToEdit.phone);
            setInternalNote(clientToEdit.internalNote);
            setBoats(clientToEdit.boats);
        } else {
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhone('');
            setInternalNote('');
            setBoats([{ id: `b${Date.now()}`, name: '' }]);
        }
    }, [clientToEdit, isEditMode, open]);

    const handleBoatChange = (index: number, value: string) => {
        const newBoats = [...boats];
        newBoats[index].name = value;
        setBoats(newBoats);
    };

    const handleAddBoat = () => {
        setBoats([...boats, { id: `b${Date.now()}`, name: '' }]);
    };
    
    const handleRemoveBoat = (index: number) => {
        if (boats.length > 1) {
            const newBoats = boats.filter((_, i) => i !== index);
            setBoats(newBoats);
        }
    };

    const handleSubmit = () => {
        if (!firstName || !lastName || !email) {
            alert('Por favor complete Nombre, Apellido y Email.');
            return;
        }

        const clientData: Client = {
            id: isEditMode && clientToEdit ? clientToEdit.id : `c${Date.now()}`,
            firstName,
            lastName,
            email,
            phone,
            internalNote,
            boats: boats.filter(b => b.name.trim() !== ''),
            avatarUrl: isEditMode && clientToEdit ? clientToEdit.avatarUrl : `https://i.pravatar.cc/150?u=${Date.now()}`
        };

        onSave(clientData);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</DialogTitle>
                    <DialogDescription>
                        Complete los datos del cliente y sus embarcaciones.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">Nombre</Label>
                            <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Perez" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@example.com" />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="phone">Celular</Label>
                            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="1122334455" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="internalNote">Nota Interna</Label>
                         <Textarea id="internalNote" value={internalNote} onChange={e => setInternalNote(e.target.value)} placeholder="Información relevante sobre el cliente..." />
                    </div>
                    <div className="grid gap-2 pt-2">
                        <Label>Embarcaciones</Label>
                        <div className="space-y-2">
                        {boats.map((boat, index) => (
                             <div key={index} className="flex items-center gap-2">
                                <Input 
                                    value={boat.name}
                                    onChange={(e) => handleBoatChange(index, e.target.value)}
                                    placeholder={`Nombre de la embarcación ${index + 1}`}
                                />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveBoat(index)} disabled={boats.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddBoat} className="mt-2 w-fit">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar Embarcación
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Guardar Cambios' : 'Guardar Cliente'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
