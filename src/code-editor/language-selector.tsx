"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"

interface LanguageSelectorProps {
    selectedLanguage: string
    languages: { id: number; name: string; extension: string; defaultCode: string }[]
    handleLanguageChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

export function LanguageSelector({ selectedLanguage, languages, handleLanguageChange }: LanguageSelectorProps) {
    return (
        <div className="bg-[#1e1e2e] text-white p-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center">
                <select
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                    className="bg-[#2d2d3f] text-white text-sm rounded-md border border-gray-700 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {languages.map((lang) => (
                        <option key={lang.id} value={lang.name}>
                            {lang.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <Heart className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
