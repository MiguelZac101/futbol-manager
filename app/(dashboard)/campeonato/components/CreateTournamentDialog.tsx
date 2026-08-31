"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDownIcon } from "lucide-react"
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
      <DialogContent className="sm:max-w-md">
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
                  <FormControl>
                    <div className="relative">
                      <select
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="flex h-8 w-full appearance-none items-center rounded-lg border border-input bg-transparent py-2 pr-8 pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        <option value="">Selecciona una cancha (opcional)</option>
                        {venues.map((venue) => (
                          <option key={venue.id} value={venue.id}>
                            {venue.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </FormControl>
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
                  <FormControl>
                    <div className="relative">
                      <select
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="flex h-8 w-full appearance-none items-center rounded-lg border border-input bg-transparent py-2 pr-8 pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                      >
                        <option value="">Selecciona un árbitro (opcional)</option>
                        {referees.map((referee) => (
                          <option key={referee.id} value={referee.id}>
                            {referee.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </FormControl>
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