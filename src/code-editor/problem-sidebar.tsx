"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, ArrowRight } from "lucide-react"
import { toast } from "sonner"

interface ProblemSidebarProps {
    selectedProblem: any
    sidebarTab: string
    setSidebarTab: (tab: string) => void
    copyToClipboard: (text: string) => void
    setStdin: (value: string) => void
}

export function ProblemSidebar({
    selectedProblem,
    sidebarTab,
    setSidebarTab,
    copyToClipboard,
    setStdin,
}: ProblemSidebarProps) {
    return (
        <Tabs defaultValue="problem" value={sidebarTab} onValueChange={setSidebarTab}>
            <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="problem">Problem</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="code-ai">Code AI</TabsTrigger>
            </TabsList>
            <TabsContent value="problem" className="p-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">{selectedProblem.title}</h2>
                        <Badge
                            className={
                                selectedProblem.difficulty === "Easy"
                                    ? "bg-green-600"
                                    : selectedProblem.difficulty === "Medium"
                                        ? "bg-yellow-600"
                                        : "bg-red-600"
                            }
                        >
                            {selectedProblem.difficulty}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-300">{selectedProblem.description}</p>

                    <div className="space-y-2">
                        <h3 className="font-semibold">Constraints</h3>
                        <ul className="text-sm text-gray-300 space-y-1 list-disc pl-5">
                            {selectedProblem.constraints.map((constraint: string, index: number) => (
                                <li key={index}>{constraint}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">CLI Argument Explanation</h3>
                        <p className="text-sm text-gray-300">{selectedProblem.cliExplanation}</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">STDOUT Explanation</h3>
                        <p className="text-sm text-gray-300">{selectedProblem.stdoutExplanation}</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">Example</h3>
                        {selectedProblem.examples.map((example: any, index: number) => (
                            <div key={index} className="bg-[#1e1e2e] p-3 rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400">Input:</span>
                                    <div className="flex space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 py-0 text-xs"
                                            onClick={() => {
                                                setStdin(example.input)
                                                toast.info("Example input copied to CLI")
                                            }}
                                        >
                                            Use <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => copyToClipboard(example.input)}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <pre className="text-xs bg-[#2a2a3a] p-2 rounded overflow-x-auto">{example.input}</pre>
                                <div className="flex justify-between items-center mt-3 mb-2">
                                    <span className="text-xs text-gray-400">Output:</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => copyToClipboard(example.output)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                                <pre className="text-xs bg-[#2a2a3a] p-2 rounded overflow-x-auto">{example.output}</pre>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4">
                        <div className="flex flex-wrap gap-2">
                            {selectedProblem.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="instructions" className="p-4">
                <div className="space-y-4">
                    <h3 className="font-semibold">Instructions</h3>
                    <p className="text-sm text-gray-300">1. Read the problem statement carefully.</p>
                    <p className="text-sm text-gray-300">2. Implement your solution in the code editor.</p>
                    <p className="text-sm text-gray-300">3. Test your solution with the provided test cases.</p>
                    <p className="text-sm text-gray-300">4. Click "Submit" when you're confident in your solution.</p>
                    <p className="text-sm text-gray-300">
                        5. Your solution will be evaluated against all test cases, including hidden ones.
                    </p>
                </div>
            </TabsContent>
            <TabsContent value="code-ai" className="p-4">
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">AI assistance is not available in this demo.</p>
                </div>
            </TabsContent>
        </Tabs>
    )
}
