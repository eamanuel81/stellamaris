"use client"

import Image from "next/image"
import Link from "next/link"
import { BookOpen, CircleHelp, LifeBuoy, MessageSquareWarning } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import logoTransparent from "../../../logo sin fondo.png"

const quickGuides = [
  {
    title: "Ingresar al sistema",
    detail: "Usá tu email y contraseña asignados. Si olvidaste la clave, pedí reset al administrador.",
  },
  {
    title: "Actualizar perfil y sesión",
    detail: "Desde Configuración podés revisar tus datos. Si la sesión falla, cerrá sesión e ingresá de nuevo.",
  },
  {
    title: "Soporte operativo",
    detail: "Para incidentes urgentes (acceso, tareas críticas), reportar por el canal interno de la guardería.",
  },
]

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="gap-1">
                <CircleHelp className="h-3 w-3" />
                Centro de ayuda
              </Badge>
              <h2 className="text-2xl font-semibold">Manual y asistencia del sistema</h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Esta sección está disponible para Administrador, Encargado y Empleado. Aquí podés encontrar guías rápidas,
                rutas directas y recomendaciones para resolver incidencias comunes.
              </p>
            </div>
            <Image
              src={logoTransparent}
              alt="Logo Stella Maris"
              width={340}
              height={170}
              className="h-auto w-56 md:w-72"
              priority
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {quickGuides.map((guide) => (
            <Card key={guide.title}>
              <CardHeader>
                <CardTitle className="text-base">{guide.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{guide.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5" />
              Accesos rápidos de manual
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="default">
              <Link href="/dashboard">Ir a Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/today-tasks">Manual de Tareas del Día</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/employees">Manual de Empleados</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/clients">Manual de Clientes</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings">Configuración y perfil</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LifeBuoy className="h-5 w-5" />
              Preguntas frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>No puedo iniciar sesión</AccordionTrigger>
                <AccordionContent>
                  Verificá email y contraseña. Si persiste, solicitá restablecimiento al administrador.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Me redirige al login al cerrar sesión</AccordionTrigger>
                <AccordionContent>
                  Es el comportamiento esperado. El cierre de sesión vuelve al inicio de forma dinámica según el dominio actual.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>¿Dónde reporto errores o mejoras?</AccordionTrigger>
                <AccordionContent>
                  Usá el canal interno de soporte de la guardería e indicá módulo, usuario, hora y captura de pantalla.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-start gap-3 p-4">
            <MessageSquareWarning className="mt-0.5 h-4 w-4 text-amber-700" />
            <p className="text-sm text-amber-800">
              Esta sección está pensada para ampliar ayuda, comunicados y procedimientos operativos. Si querés, después armamos
              una versión con editor de contenido para que el cliente pueda publicar novedades desde la app.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
