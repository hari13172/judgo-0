"use client"

import { Button } from "@/components/ui/button"
import { Copy, ArrowRight } from "lucide-react"

interface TestCasesPanelProps {
    selectedProblem: any
    activeTestTab: string
    setActiveTestTab: (tab: string) => void
    onUseTestCase: (testCaseId: string) => void
    copyToClipboard: (text: string) => void
    output: string
}

export function TestCasesPanel({
    selectedProblem,
    activeTestTab,
    setActiveTestTab,
    onUseTestCase,
    copyToClipboard,
    output,
}: TestCasesPanelProps) {
    return (
        <div className="flex flex-col">
            <div className="flex border-b border-gray-700 overflow-x-auto">
                {selectedProblem.testCases.map((testCase: any) => (
                    <button
                        key={testCase.id}
                        className={`px-4 py-2 text-sm ${activeTestTab === testCase.id.toString() ? "bg-[#3d3d4f] text-white" : "text-gray-400"} ${testCase.isLocked ? "opacity-50" : ""}`}
                        onClick={() => setActiveTestTab(testCase.id.toString())}
                        disabled={testCase.isLocked}
                    >
                        Test Case {testCase.id} {testCase.isLocked && "🔒"}
                    </button>
                ))}
            </div>

            <div className="p-4 space-y-4">
                <div>
                    <h3 className="text-sm font-semibold mb-2">Arguments</h3>
                    <div className="flex items-center justify-between bg-[#1e1e2e] p-3 rounded-md">
                        <pre className="text-sm text-gray-300 overflow-x-auto">
                            {selectedProblem.testCases.find((tc: any) => tc.id.toString() === activeTestTab)?.arguments || ""}
                        </pre>
                        <div className="flex space-x-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 py-0 text-xs"
                                onClick={() => onUseTestCase(activeTestTab)}
                            >
                                Use <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() =>
                                    copyToClipboard(
                                        selectedProblem.testCases.find((tc: any) => tc.id.toString() === activeTestTab)?.arguments || "",
                                    )
                                }
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold mb-2">Expected STDOUT</h3>
                    <div className="flex items-center justify-between bg-[#1e1e2e] p-3 rounded-md">
                        <pre className="text-sm text-gray-300 overflow-x-auto">
                            {selectedProblem.testCases.find((tc: any) => tc.id.toString() === activeTestTab)?.expectedOutput || ""}
                        </pre>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                                copyToClipboard(
                                    selectedProblem.testCases.find((tc: any) => tc.id.toString() === activeTestTab)?.expectedOutput || "",
                                )
                            }
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {output && (
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Your Output</h3>
                        <div className="bg-[#1e1e2e] p-3 rounded-md">
                            <pre className="text-sm text-gray-300 overflow-x-auto">{output}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
