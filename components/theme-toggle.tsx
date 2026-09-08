"use client"

import { useTheme } from "@wrksz/themes/client"
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

  return (
    <Button
      variant={mounted ? "ghost" : "outline"}
      size="lg"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={mounted ? "px-2 cursor-pointer" : "pointer-events-none opacity-0"}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
