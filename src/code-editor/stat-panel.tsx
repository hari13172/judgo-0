import { formatTime } from "./utils"

interface StatsPanelProps {
    elapsedTime: number
    testResults: { id: number; passed: boolean }[]
    selectedProblem: any
}

export function StatsPanel({ elapsedTime, testResults, selectedProblem }: StatsPanelProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1e1e2e] p-3 rounded-md">
                    <h3 className="text-sm font-semibold mb-2">Execution Time</h3>
                    <p className="text-2xl font-mono">{formatTime(elapsedTime)}</p>
                </div>
                <div className="bg-[#1e1e2e] p-3 rounded-md">
                    <h3 className="text-sm font-semibold mb-2">Test Cases</h3>
                    <p className="text-2xl font-mono">
                        {testResults.filter((r) => r.passed).length}/{selectedProblem.testCases.length}
                    </p>
                </div>
            </div>

            {testResults.length > 0 && (
                <div className="bg-[#1e1e2e] p-3 rounded-md">
                    <h3 className="text-sm font-semibold mb-2">Test Results</h3>
                    <div className="space-y-2">
                        {testResults.map((result) => (
                            <div key={result.id} className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-2 ${result.passed ? "bg-green-500" : "bg-red-500"}`}></div>
                                <span className="text-sm">Test Case #{result.id}</span>
                                <span className={`ml-auto text-xs ${result.passed ? "text-green-400" : "text-red-400"}`}>
                                    {result.passed ? "Passed" : "Failed"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
