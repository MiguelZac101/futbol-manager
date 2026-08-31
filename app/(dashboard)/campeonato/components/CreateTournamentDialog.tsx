"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { tournamentSchema, TournamentFormValues } from "./schema"
import { createTournament } from "../actions"
import { useEffect } from "react"

interface TournamentCreated {
  id: string
  name: string
  imageUrl?: string | null
}

interface Option {
  id: string
  name: string
}

interface CreateTournamentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (tournament: TournamentCreated) => void
  venues: Option[]
  referees: Option[]
}

export function CreateTournamentDialog({ open, onOpenChange, onCreated, venues, referees }: CreateTournamentDialogProps) {
  
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: { name: "", defaultVenueId: "", defaultRefereeId: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  async function onSubmit(values: TournamentFormValues) {
    const formData = new FormData()
    formData.append("name", values.name)
    if (values.defaultVenueId) {
      formData.append("defaultVenueId", values.defaultVenueId)
    }
    if (values.defaultRefereeId) {
      formData.append("defaultRefereeId", values.defaultRefereeId)
    }

    const result = await createTournament(formData)

    if (result?.error) {
      form.setError("name", { message: result.error })
      return
    }

    if (result?.tournament) {
      onCreated(result.tournament)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement
          if (target.closest("[data-slot='select-content']")) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Crear Campeonato</DialogTitle>
          <DialogDescription>
            Completa los datos básicos para iniciar un nuevo campeonato.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Torneo de verano 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultVenueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancha</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona una cancha (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultRefereeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Árbitro</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un árbitro (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {referees.map((referee) => (
                        <SelectItem key={referee.id} value={referee.id}>
                          {referee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}