
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Anchor, Ship } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [role, setRole] = React.useState<"admin" | "employee">("employee")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (role) {
      login(role)
      if (role === "admin") {
        router.push("/dashboard")
      } else {
        router.push("/my-tasks")
      }
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Ship className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-3xl">Stella Maris Manager</CardTitle>
            <CardDescription>
              Inicie sesión para gestionar las tareas de la guardería.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="empleado@stellamaris.com" required defaultValue="juan.perez@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" required defaultValue="password" />
            </div>
            <div className="space-y-3">
              <Label>Simular rol</Label>
              <RadioGroup
                defaultValue="employee"
                className="flex items-center space-x-4"
                onValueChange={(value: "admin" | "employee") => setRole(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="font-normal">Administrador</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="employee" id="employee" />
                  <Label htmlFor="employee" className="font-normal">Empleado</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">Ingresar</Button>
            <Button variant="link" size="sm" className="w-full font-normal text-muted-foreground">
              ¿Olvidó su contraseña?
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
