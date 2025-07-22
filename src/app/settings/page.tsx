
"use client"

import * as React from "react"
import { useAuth } from "@/components/auth-provider"
import { AppLayout } from "@/components/app-layout"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui"

export default function SettingsPage() {
  const { role, avatarKey, setAvatarKey } = useAuth();
  
  const handleAvatarChange = () => {
    // Generate a new random key to update the avatar URL
    setAvatarKey(Date.now().toString());
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-2xl mx-auto">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Configuración
          </h1>
          <p className="text-muted-foreground">
            Gestiona la configuración de tu cuenta y tus preferencias.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Esta es tu información personal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
               <Avatar className="h-20 w-20">
                 <AvatarImage src={`https://i.pravatar.cc/150?u=${avatarKey}`} alt="User" />
                 <AvatarFallback>{role === 'admin' ? 'A' : 'E'}</AvatarFallback>
               </Avatar>
               <div className="space-y-2">
                 <Label>Avatar</Label>
                 <div>
                    <Button variant="outline" onClick={handleAvatarChange}>Cambiar Avatar</Button>
                 </div>
                 <p className="text-xs text-muted-foreground">
                    Haga clic para generar un nuevo avatar aleatorio.
                 </p>
               </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input id="firstName" defaultValue="Admin" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input id="lastName" defaultValue="User" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="admin@stellamaris.com" />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button>Guardar Cambios</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contraseña</CardTitle>
            <CardDescription>
              Cambia tu contraseña. Se recomienda usar una contraseña segura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button>Cambiar Contraseña</Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  )
}
