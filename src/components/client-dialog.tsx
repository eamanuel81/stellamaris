
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
  Separator,
} from "@/components/ui"
import { PlusCircle, Trash2, Camera } from "lucide-react"
import { Client, Boat, ResponsibleParty } from "@/lib/data"
import Image from "next/image"

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
    const [dni, setDni] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [internalNote, setInternalNote] = React.useState('');
    const [boats, setBoats] = React.useState<Boat[]>([]);
    const [responsibles, setResponsibles] = React.useState<ResponsibleParty[]>([]);
    
    const initialBoatState = { id: `b${Date.now()}`, name: '', hullType: '', engine: '', registrationNumber: '', photos: [] };

    React.useEffect(() => {
        if (isEditMode && clientToEdit) {
            setFirstName(clientToEdit.firstName);
            setLastName(clientToEdit.lastName);
            setDni(clientToEdit.dni);
            setEmail(clientToEdit.email);
            setPhone(clientToEdit.phone);
            setInternalNote(clientToEdit.internalNote);
            setBoats(clientToEdit.boats.length > 0 ? clientToEdit.boats : [initialBoatState]);
            setResponsibles(clientToEdit.responsibles.length > 0 ? clientToEdit.responsibles : [{ id: `r${Date.now()}`, firstName: '', lastName: '', dni: '', phone: '' }]);
        } else {
            setFirstName('');
            setLastName('');
            setDni('');
            setEmail('');
            setPhone('');
            setInternalNote('');
            setBoats([initialBoatState]);
            setResponsibles([{ id: `r${Date.now()}`, firstName: '', lastName: '', dni: '', phone: '' }]);
        }
    }, [clientToEdit, isEditMode, open]);

    const handleBoatChange = (index: number, field: keyof Boat, value: any) => {
        const newBoats = [...boats];
        (newBoats[index] as any)[field] = value;
        setBoats(newBoats);
    };

    const handleAddBoat = () => {
        setBoats([...boats, { ...initialBoatState, id: `b${Date.now()}` }]);
    };
    
    const handleRemoveBoat = (index: number) => {
        if (boats.length > 1) {
            const newBoats = boats.filter((_, i) => i !== index);
            setBoats(newBoats);
        } else {
            // Clear the only boat if removed
            setBoats([{ ...initialBoatState, id: `b${Date.now()}` }]);
        }
    };
    
    const handleAddPhoto = (boatIndex: number) => {
        const newBoats = [...boats];
        if (!newBoats[boatIndex].photos) {
            newBoats[boatIndex].photos = [];
        }
        // Using a random number to vary the placeholder image
        const randomId = Math.floor(Math.random() * 1000);
        newBoats[boatIndex].photos!.push(`https://placehold.co/600x400.png?text=Foto+${randomId}`);
        setBoats(newBoats);
    };

    const handleRemovePhoto = (boatIndex: number, photoIndex: number) => {
        const newBoats = [...boats];
        newBoats[boatIndex].photos?.splice(photoIndex, 1);
        setBoats(newBoats);
    };
    
    const handleResponsibleChange = (index: number, field: keyof ResponsibleParty, value: string) => {
        const newResponsibles = [...responsibles];
        newResponsibles[index] = { ...newResponsibles[index], [field]: value };
        setResponsibles(newResponsibles);
    };

    const handleAddResponsible = () => {
        setResponsibles([...responsibles, { id: `r${Date.now()}`, firstName: '', lastName: '', dni: '', phone: '' }]);
    };

    const handleRemoveResponsible = (index: number) => {
        if (responsibles.length > 1) {
            const newResponsibles = responsibles.filter((_, i) => i !== index);
            setResponsibles(newResponsibles);
        } else {
             setResponsibles([{ id: `r${Date.now()}`, firstName: '', lastName: '', dni: '', phone: '' }]);
        }
    };

    const handleSubmit = () => {
        if (!firstName || !lastName || !email) {
            alert('Por favor complete Nombre, Apellido y Email del cliente.');
            return;
        }

        const clientData: Client = {
            id: isEditMode && clientToEdit ? clientToEdit.id : `c${Date.now()}`,
            firstName,
            lastName,
            dni,
            email,
            phone,
            internalNote,
            boats: boats.filter(b => b.name.trim() !== ''),
            responsibles: responsibles.filter(r => r.firstName.trim() !== '' && r.lastName.trim() !== ''),
            avatarUrl: isEditMode && clientToEdit ? clientToEdit.avatarUrl : `https://i.pravatar.cc/150?u=${Date.now()}`
        };

        onSave(clientData);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</DialogTitle>
                    <DialogDescription>
                        Complete los datos del cliente, sus embarcaciones y personas responsables.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-6">
                    {/* Client Details */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Datos del Cliente</h4>
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
                                <Label htmlFor="dni">DNI</Label>
                                <Input id="dni" value={dni} onChange={e => setDni(e.target.value)} placeholder="12345678" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Celular</Label>
                                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="1122334455" />
                            </div>
                        </div>
                         <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@example.com" />
                            </div>
                        <div className="grid gap-2">
                            <Label htmlFor="internalNote">Nota Interna</Label>
                            <Textarea id="internalNote" value={internalNote} onChange={e => setInternalNote(e.target.value)} placeholder="Información relevante sobre el cliente..." />
                        </div>
                    </div>
                    
                    <Separator />

                    {/* Boats Section */}
                    <div className="space-y-4">
                         <h4 className="font-semibold text-lg">Embarcaciones</h4>
                        {boats.map((boat, index) => (
                             <div key={boat.id} className="p-4 border rounded-lg space-y-4 relative">
                                <h5 className="font-medium">Embarcación #{index+1}</h5>
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="grid gap-2">
                                        <Label htmlFor={`boat-name-${index}`}>Nombre</Label>
                                        <Input id={`boat-name-${index}`} value={boat.name} onChange={(e) => handleBoatChange(index, 'name', e.target.value)} placeholder="Nombre" />
                                     </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor={`boat-reg-${index}`}>Patente</Label>
                                        <Input id={`boat-reg-${index}`} value={boat.registrationNumber} onChange={(e) => handleBoatChange(index, 'registrationNumber', e.target.value)} placeholder="ABC-123" />
                                     </div>
                                </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="grid gap-2">
                                        <Label htmlFor={`boat-hull-${index}`}>Tipo de Casco</Label>
                                        <Input id={`boat-hull-${index}`} value={boat.hullType} onChange={(e) => handleBoatChange(index, 'hullType', e.target.value)} placeholder="Tracker open 420 mts" />
                                     </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor={`boat-engine-${index}`}>Motor</Label>
                                        <Input id={`boat-engine-${index}`} value={boat.engine} onChange={(e) => handleBoatChange(index, 'engine', e.target.value)} placeholder="Datos del Motor" />
                                     </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveBoat(index)} className="absolute top-2 right-2">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                
                                <Separator />

                                <div>
                                    <Label>Fotos de la Embarcación (Opcional)</Label>
                                    <div className="mt-2 flex items-center gap-4">
                                        <Button type="button" variant="outline" size="sm" onClick={() => handleAddPhoto(index)}>
                                            <Camera className="mr-2 h-4 w-4" />
                                            Agregar Foto
                                        </Button>
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-4">
                                        {boat.photos?.map((photo, photoIndex) => (
                                            <div key={photoIndex} className="relative group">
                                                <Image
                                                    src={photo}
                                                    alt={`Foto de la embarcación ${photoIndex + 1}`}
                                                    width={200}
                                                    height={150}
                                                    data-ai-hint="boat"
                                                    className="rounded-md object-cover aspect-[4/3]"
                                                />
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleRemovePhoto(index, photoIndex)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={handleAddBoat} className="mt-2 w-fit">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar Embarcación
                        </Button>
                    </div>

                    <Separator />

                     {/* Responsibles Section */}
                     <div className="space-y-4">
                         <h4 className="font-semibold text-lg">Otros Responsables</h4>
                        {responsibles.map((resp, index) => (
                             <div key={resp.id} className="p-4 border rounded-lg space-y-4 relative">
                                <h5 className="font-medium">Responsable #{index+1}</h5>
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="grid gap-2">
                                        <Label htmlFor={`resp-first-name-${index}`}>Nombre</Label>
                                        <Input id={`resp-first-name-${index}`} value={resp.firstName} onChange={(e) => handleResponsibleChange(index, 'firstName', e.target.value)} placeholder="Nombre" />
                                     </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor={`resp-last-name-${index}`}>Apellido</Label>
                                        <Input id={`resp-last-name-${index}`} value={resp.lastName} onChange={(e) => handleResponsibleChange(index, 'lastName', e.target.value)} placeholder="Apellido" />
                                     </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="grid gap-2">
                                        <Label htmlFor={`resp-dni-${index}`}>DNI</Label>
                                        <Input id={`resp-dni-${index}`} value={resp.dni} onChange={(e) => handleResponsibleChange(index, 'dni', e.target.value)} placeholder="DNI" />
                                     </div>
                                      <div className="grid gap-2">
                                        <Label htmlFor={`resp-phone-${index}`}>Celular</Label>
                                        <Input id={`resp-phone-${index}`} value={resp.phone} onChange={(e) => handleResponsibleChange(index, 'phone', e.target.value)} placeholder="Celular" />
                                     </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveResponsible(index)} className="absolute top-2 right-2">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={handleAddResponsible} className="mt-2 w-fit">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Agregar Responsable
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
