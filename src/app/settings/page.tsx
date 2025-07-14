
"use client"

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
} from "@/components/ui"

export default function SettingsPage() {
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
          <CardContent className="space-y-4">
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
