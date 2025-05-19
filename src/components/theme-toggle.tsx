"use client"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/context/theme-context"
import { Moon, Sun } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="h-9 w-9 rounded-md"
                        aria-label="Toggle theme"
                    >
                        {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Switch to {theme === "light" ? "dark" : "light"} theme</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
