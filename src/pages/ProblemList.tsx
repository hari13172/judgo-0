"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Search,
    Tag,
    ChevronDown,
    ChevronUp,
    Code,
    ClipboardList,
    Filter,
    BookOpen,
    Maximize2,
    Shield,
    Monitor,
} from "lucide-react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog"

interface Example {
    input: string
    output: string | boolean
}

interface Problem {
    id: number
    title: string
    description: string
    difficulty: string
    tags: string[]
    examples: Example[]
    constraints: string[]
    cliExplanation: string
    stdoutExplanation: string
    testCases: any[]
    starterCode: any
}

interface ProblemListProps {
    problems: Problem[]
    onSelectProblem: (problem: Problem) => void
}

// Helper function to safely format difficulty
function formatDifficulty(diff?: string) {
    if (!diff) return "Unknown"
    return diff.charAt(0).toUpperCase() + diff.slice(1)
}

// Helper function for difficulty badge color
function getDifficultyColor(difficulty?: string) {
    const diff = difficulty?.toLowerCase() || "unknown"
    switch (diff) {
        case "easy":
            return "bg-green-600 text-white"
        case "medium":
            return "bg-yellow-600 text-white"
        case "hard":
            return "bg-red-600 text-white"
        default:
            return "bg-blue-600 text-white"
    }
}

export function ProblemList({ problems = [], onSelectProblem }: ProblemListProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
    const [expandedProblem, setExpandedProblem] = useState<number | null>(null)
    const [showFullScreenWarning, setShowFullScreenWarning] = useState(false)
    const [problemToStart, setProblemToStart] = useState<Problem | null>(null)

    const validProblems = Array.isArray(problems) ? problems : []

    const allTags = Array.from(new Set(validProblems.reduce<string[]>((acc, p) => acc.concat(p.tags), [])))
    const allDifficulties = Array.from(new Set(validProblems.map((p) => p.difficulty)))

    const filteredProblems = validProblems.filter((problem) => {
        const matchesSearch =
            (problem.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (problem.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
        const matchesTag = selectedTag === null || problem.tags.includes(selectedTag)
        const matchesDifficulty = selectedDifficulty === null || problem.difficulty === selectedDifficulty
        return matchesSearch && matchesTag && matchesDifficulty
    })

    const toggleExpand = (id: number) => {
        setExpandedProblem(expandedProblem === id ? null : id)
    }

    const handleStartProblem = (problem: Problem) => {
        setProblemToStart(problem)
        setShowFullScreenWarning(true)
    }

    const confirmStartProblem = () => {
        if (problemToStart) {
            setShowFullScreenWarning(false)
            onSelectProblem(problemToStart)
        }
    }

    return (
        <div className="bg-[#1e1e2e] text-white h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-xl font-bold mb-4 flex items-center">
                    <ClipboardList className="mr-2 h-5 w-5" /> Coding Problems
                </h1>

                {/* Search */}
                <div className="relative mb-4">
                    <Input
                        type="text"
                        placeholder="Search problems..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#2d2d3f] text-white border-gray-700 pl-10"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                {/* Difficulty Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center bg-[#2d2d3f] rounded-md px-2 py-1">
                        <Filter className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-300 mr-2">Difficulty:</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setSelectedDifficulty(null)}
                                className={`px-2 py-0.5 rounded-md text-xs ${selectedDifficulty === null ? "bg-purple-600 text-white" : "bg-[#3d3d4f] text-gray-300"}`}
                            >
                                All
                            </button>
                            {allDifficulties.map((difficulty) => (
                                <button
                                    key={difficulty}
                                    onClick={() => setSelectedDifficulty(difficulty === selectedDifficulty ? null : difficulty)}
                                    className={`px-2 py-0.5 rounded-md text-xs ${selectedDifficulty === difficulty ? getDifficultyColor(difficulty) : "bg-[#3d3d4f] text-gray-300"
                                        }`}
                                >
                                    {formatDifficulty(difficulty)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tag Filter */}
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center bg-[#2d2d3f] rounded-md px-2 py-1">
                        <Tag className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-300 mr-2">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                            <button
                                onClick={() => setSelectedTag(null)}
                                className={`px-2 py-0.5 rounded-md text-xs ${selectedTag === null ? "bg-purple-600 text-white" : "bg-[#3d3d4f] text-gray-300"}`}
                            >
                                All
                            </button>
                            {allTags.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                    className={`px-2 py-0.5 rounded-md text-xs ${selectedTag === tag ? "bg-purple-600 text-white" : "bg-[#3d3d4f] text-gray-300"
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Problems List */}
            <div className="flex-1 overflow-y-auto">
                {filteredProblems.length > 0 ? (
                    <div className="divide-y divide-gray-700">
                        {filteredProblems.map((problem) => (
                            <div key={problem.id} className="p-4 hover:bg-[#2a2a3a] transition-colors">
                                <div
                                    className="flex justify-between items-start cursor-pointer"
                                    onClick={() => toggleExpand(problem.id)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <Code className="h-4 w-4 mr-2 text-purple-400" />
                                            <h2 className="text-lg font-semibold">{problem.title}</h2>
                                        </div>
                                        <p className="text-sm text-gray-300 mt-1 line-clamp-2">{problem.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Badge className={`${getDifficultyColor(problem.difficulty)} text-xs`}>
                                            {formatDifficulty(problem.difficulty)}
                                        </Badge>
                                        {expandedProblem === problem.id ? (
                                            <ChevronUp className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Problem Details */}
                                {expandedProblem === problem.id && (
                                    <div className="mt-4 pl-6">
                                        <div className="mb-3">
                                            <h3 className="text-sm font-semibold flex items-center mb-2">
                                                <BookOpen className="h-4 w-4 mr-1 text-gray-400" /> Description
                                            </h3>
                                            <p className="text-sm text-gray-300">{problem.description}</p>
                                        </div>

                                        <div className="mb-3">
                                            <h3 className="text-sm font-semibold mb-2">Tags</h3>
                                            <div className="flex flex-wrap gap-1">
                                                {problem.tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs bg-[#3d3d4f] border-gray-700">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold mb-2">Examples</h3>
                                            <div className="space-y-2">
                                                {problem.examples.map((example, index) => (
                                                    <div key={index} className="bg-[#2d2d3f] p-3 rounded-md">
                                                        <div className="text-xs text-gray-400 mb-1">Input:</div>
                                                        <pre className="text-xs bg-[#2a2a3a] p-2 rounded overflow-x-auto">
                                                            {JSON.stringify(example.input)}
                                                        </pre>
                                                        <div className="text-xs text-gray-400 mt-2 mb-1">Output:</div>
                                                        <pre className="text-xs bg-[#2a2a3a] p-2 rounded overflow-x-auto">
                                                            {JSON.stringify(example.output)}
                                                        </pre>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full flex items-center justify-center gap-2"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleStartProblem(problem)
                                            }}
                                        >
                                            <Maximize2 className="h-4 w-4" />
                                            Solve this problem
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
                        <ClipboardList className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No matching problems found</h3>
                        <p className="text-center text-sm">Try adjusting your search or filters to find more problems.</p>
                    </div>
                )}
            </div>

            {/* Full Screen Warning Dialog */}
            <AlertDialog open={showFullScreenWarning} onOpenChange={setShowFullScreenWarning}>
                <AlertDialogContent className="bg-[#1e1e2e] text-white border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-400" />
                            Secure Test Environment Required
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                            <p className="mb-2">
                                This coding test requires a secure environment. The following security checks will be performed:
                            </p>

                            <div className="flex items-center gap-3 bg-[#2d2d3f] border border-gray-700 rounded-md p-3 my-3">
                                <Monitor className="h-8 w-8 text-purple-400 flex-shrink-0" />
                                <div>
                                    <h3 className="font-medium text-white">Display Configuration Check</h3>
                                    <p className="text-sm text-gray-300">
                                        We'll check if you have multiple displays connected. External displays are not allowed during the
                                        test.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-[#2d2d3f] border border-gray-700 rounded-md p-3 my-3">
                                <p className="font-semibold text-white mb-2">Security measures:</p>
                                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                                    <li>
                                        <span className="text-red-400 font-medium">Immediate termination:</span> Switching tabs or
                                        minimizing the window
                                    </li>
                                    <li>
                                        <span className="text-yellow-400 font-medium">Blocked with warning:</span> Developer tools access
                                        (F12, Ctrl+Shift+I, right-click)
                                    </li>
                                    <li>
                                        <span className="text-yellow-400 font-medium">Three warnings:</span> Exiting full screen mode
                                    </li>
                                </ul>
                            </div>
                            <p>Please ensure you have saved any work in other applications before continuing.</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setShowFullScreenWarning(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmStartProblem}>Continue to Security Check</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
