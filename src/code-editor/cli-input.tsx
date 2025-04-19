"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface CLIInputProps {
    stdin: string
    setStdin: (value: string) => void
    isRunning: boolean
    runCodeWithCLI: () => void
    handleCliKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function CLIInput({ stdin, setStdin, isRunning, runCodeWithCLI, handleCliKeyDown }: CLIInputProps) {
    return (
        <div className="bg-[#1e1e2e] border-t border-gray-700 p-2">
            <div className="flex items-center bg-[#2d2d3f] rounded-md px-3 py-2">
                <span className="text-gray-400 text-sm mr-2">Enter the cli arguments...</span>
                <input
                    type="text"
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    onKeyDown={handleCliKeyDown}
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                    placeholder="Enter arguments here..."
                />
                <Button size="sm" className="ml-2" onClick={runCodeWithCLI} disabled={isRunning}>
                    <Play className="h-3 w-3 mr-1" />
                    Run
                </Button>
            </div>
        </div>
    )
}
