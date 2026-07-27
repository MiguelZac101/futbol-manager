"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSyncExternalStore } from "react"

// Un "store externo" ficticio: nunca cambia, solo diferencia server vs client
const emptySubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // snapshot en el cliente
    () => false   // snapshot en el servidor (SSR)
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) {
    return <Button variant="outline" size="icon" disabled={true} className="opacity-0" />
  }

  return (
    <Button
      variant="ghost"
      size="lg"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="px-2 cursor-pointer"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
