"use client"

import Link from "next/link"
import { Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PublicLinkProps {
  slug: string
}

export function PublicLink({ slug }: PublicLinkProps) {
  return (
    <Button
      type="button"
      variant="outline"
      asChild
      title="Ver resumen público del campeonato"
      className="flex h-auto min-w-24 cursor-pointer flex-col items-center gap-2 px-3 py-3 text-xs"
    >
      <Link href={`/t/${slug}`} target="_blank" rel="noopener noreferrer">
        <Link2 className="h-7 w-7" />
        <span>Resumen</span>
      </Link>
    </Button>
  )
}
