"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { TestCasesPanel } from "./test-cases-panel"
import { TerminalOutput } from "./terminal-output"
import { StatsPanel } from "./stat-panel"

interface BottomTabsProps {
    bottomTab: string
    setBottomTab: (tab: string) => void
    isRunning: boolean
    validateSolution: () => void
    selectedProblem: any
    activeTestTab: string
    setActiveTestTab: (tab: string) => void
    useTestCase: (testCaseId: string) => void
    copyToClipboard: (text: string) => void
    output: string
    testResults: any[]
    elapsedTime: number
    stdin: string
    language: {
        name: string
        extension: string
    }
}

export function BottomTabs({
    bottomTab,
    setBottomTab,
    isRunning,
    validateSolution,
    selectedProblem,
    activeTestTab,
    setActiveTestTab,
    useTestCase,
    copyToClipboard,
    output,
    testResults,
    elapsedTime,
    stdin,
    language,
}: BottomTabsProps) {
    return (
        <Tabs defaultValue="test-cases" value={bottomTab} onValueChange={setBottomTab}>
            <div className="flex items-center px-4 py-2 border-b border-gray-700">
                <TabsList className="bg-transparent border-0">
                    <TabsTrigger value="test-cases" className="text-sm data-[state=active]:bg-[#3d3d4f]">
                        Test Cases
                    </TabsTrigger>
                    <TabsTrigger value="terminal" className="text-sm data-[state=active]:bg-[#3d3d4f]">
                        Terminal
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="text-sm data-[state=active]:bg-[#3d3d4f]">
                        Stats
                    </TabsTrigger>
                </TabsList>
                <div className="ml-auto flex space-x-2">
                    <Button size="sm" onClick={validateSolution} disabled={isRunning}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Validate
                    </Button>
                    <Button size="sm" variant="default" onClick={validateSolution} disabled={isRunning}>
                        Submit
                    </Button>
                </div>
            </div>

            <TabsContent value="test-cases" className="p-0 m-0">
                <TestCasesPanel
                    selectedProblem={selectedProblem}
                    activeTestTab={activeTestTab}
                    setActiveTestTab={setActiveTestTab}
                    onUseTestCase={useTestCase}
                    copyToClipboard={copyToClipboard}
                    output={output}
                />
            </TabsContent>

            <TabsContent value="terminal" className="p-0">
                <TerminalOutput output={output} stdin={stdin} language={language} />
            </TabsContent>

            <TabsContent value="stats" className="p-4">
                <StatsPanel elapsedTime={elapsedTime} testResults={testResults} selectedProblem={selectedProblem} />
            </TabsContent>
        </Tabs>
    )
}
