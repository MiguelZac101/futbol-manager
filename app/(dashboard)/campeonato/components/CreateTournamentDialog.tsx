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
import { tournamentSchema, TournamentFormValues } from "./schema"
import { createTournament } from "../actions"
import { useEffect } from "react"

interface CreateTournamentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTournamentDialog({ open, onOpenChange }: CreateTournamentDialogProps) {
  
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  async function onSubmit(values: TournamentFormValues) {
    const formData = new FormData()
    formData.append("name", values.name)

    const result = await createTournament(formData)

    if (result?.error) {
      form.setError("name", { message: result.error })
      return
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