"use client"

import React from "react"
import Image from "next/image"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@/components/ui"
import { Client } from "@/lib/data"
import {
  Edit,
  Mail,
  Phone,
  CreditCard,
  Ship,
  Shield,
  FileText,
  User,
} from "lucide-react"

function display(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : "—"
}

function getInitials(client: Client) {
  const first = client.firstName?.trim()?.[0] ?? ""
  const last = client.lastName?.trim()?.[0] ?? ""
  return (first + last).toUpperCase() || "?"
}

interface ClientDetailDialogProps {
  client: Client
  canEdit: boolean
  onEdit: () => void
  setOpen: (open: boolean) => void
}

export function ClientDetailDialog({
  client,
  canEdit,
  onEdit,
  setOpen,
}: ClientDetailDialogProps) {
  const boats = client.boats ?? []
  const responsibles = client.responsibles ?? []

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage
              src={client.avatarUrl}
              alt={`${client.firstName} ${client.lastName}`}
            />
            <AvatarFallback>{getInitials(client)}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-2xl">
              {client.firstName} {client.lastName}
            </DialogTitle>
            <DialogDescription>
              Ficha del cliente y embarcaciones registradas
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 text-sm">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Nombre completo</p>
              <p className="text-muted-foreground">
                {client.firstName} {client.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">DNI</p>
              <p className="text-muted-foreground">{display(client.dni)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground break-all">
                {display(client.email)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Celular</p>
              <p className="text-muted-foreground">{display(client.phone)}</p>
            </div>
          </div>
        </div>

        {client.internalNote?.trim() && (
          <>
            <Separator />
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 shrink-0" />
                <span>Nota interna</span>
              </div>
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="text-sm whitespace-pre-wrap">{client.internalNote}</p>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Ship className="h-4 w-4 shrink-0" />
            <span>Embarcaciones ({boats.length})</span>
          </div>

          {boats.length > 0 ? (
            <div className="space-y-3">
              {boats.map((boat, index) => (
                <div key={boat.id ?? index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium">{display(boat.name)}</h4>
                    {boat.registrationNumber?.trim() && (
                      <Badge variant="secondary">{boat.registrationNumber}</Badge>
                    )}
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-medium">Tipo de casco</p>
                      <p className="text-muted-foreground">
                        {display(boat.hullType)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Motor</p>
                      <p className="text-muted-foreground">
                        {display(boat.engine)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Patente</p>
                      <p className="text-muted-foreground">
                        {display(boat.registrationNumber)}
                      </p>
                    </div>
                  </div>
                  {boat.photos && boat.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {boat.photos.map((photo, photoIndex) => (
                        <Image
                          key={photoIndex}
                          src={photo}
                          alt={`Foto de ${boat.name}`}
                          width={160}
                          height={120}
                          data-ai-hint="boat"
                          className="rounded-md object-cover aspect-[4/3]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin embarcaciones registradas.
            </p>
          )}
        </div>

        {responsibles.length > 0 && (
          <>
            <Separator />
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="h-4 w-4 shrink-0" />
                <span>Otros responsables ({responsibles.length})</span>
              </div>
              <div className="space-y-3">
                {responsibles.map((resp, index) => (
                  <div
                    key={resp.id ?? index}
                    className="rounded-lg border p-4 text-sm"
                  >
                    <p className="font-medium">
                      {resp.firstName} {resp.lastName}
                    </p>
                    <p className="text-muted-foreground">
                      DNI: {display(resp.dni)}
                    </p>
                    <p className="text-muted-foreground">
                      Celular: {display(resp.phone)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <DialogFooter className="justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cerrar
        </Button>
        {canEdit && (
          <Button onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  )
}
