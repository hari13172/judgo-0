"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Home, Code, RefreshCw } from "lucide-react"
import { formatTime } from "./utils"

interface EditorHeaderProps {
    problems: any[]
    selectedProblemId: string
    completed: boolean
    elapsedTime: number
    handleProblemChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
    resetTimer: () => void
}

export function EditorHeader({
    problems,
    selectedProblemId,
    completed,
    elapsedTime,
    handleProblemChange,
    resetTimer,
}: EditorHeaderProps) {
    return (
        <header className="bg-[#1e1e2e] text-white p-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span className="text-sm">/</span>
                    <Code className="h-4 w-4" />
                </div>
                <select
                    value={selectedProblemId}
                    onChange={handleProblemChange}
                    className="bg-[#2d2d3f] text-white text-sm rounded-md border border-gray-700 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {problems.map((problem) => (
                        <option key={problem.id} value={problem.id}>
                            {problem.title} ({problem.difficulty})
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center">
                    <span className={`text-sm ${completed ? "text-green-400" : "text-gray-400"}`}>
                        {completed ? "Completed - Your Record:" : "Not completed"}
                    </span>
                    {completed && <span className="ml-2 text-yellow-400 font-mono">{formatTime(elapsedTime)}</span>}
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-700">
                        70
                    </Badge>
                    <Badge variant="outline" className="bg-purple-900/30 text-purple-400 border-purple-700">
                        15
                    </Badge>
                </div>
                <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-mono text-gray-400">Time: {formatTime(elapsedTime)}</span>
                </div>
                <Button variant="outline" size="sm" className="text-xs" onClick={resetTimer}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Renew
                </Button>
            </div>
        </header>
    )
}
