import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface TestResult {
    id: number
    passed: boolean
    output: string
    expected: string
}

interface TestResultsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    results: TestResult[]
    totalTime: string
    problemTitle: string
    allPassed: boolean
}



export function TestResultsDialog({
    open,
    onOpenChange,
    results,
    totalTime,
    problemTitle,
    allPassed,
}: TestResultsDialogProps) {
    const passedCount = results.filter((r) => r.passed).length
    const totalCount = results.length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-[#1e1e2e] text-white border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {allPassed ? (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                        )}
                        Test Results: {problemTitle}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {allPassed
                            ? "Congratulations! All test cases passed."
                            : `${passedCount} out of ${totalCount} test cases passed.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={`${allPassed
                                ? "bg-green-900/30 text-green-400 border-green-700"
                                : "bg-red-900/30 text-red-400 border-red-700"
                                }`}
                        >
                            {passedCount}/{totalCount} Passed
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{totalTime}</span>
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-2">
                    {results.map((result) => (
                        <div
                            key={result.id}
                            className={`mb-3 p-3 rounded-md ${result.passed ? "bg-green-900/20 border border-green-800/50" : "bg-red-900/20 border border-red-800/50"
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {result.passed ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="font-medium">Test Case #{result.id}</span>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`${result.passed
                                        ? "bg-green-900/30 text-green-400 border-green-700"
                                        : "bg-red-900/30 text-red-400 border-red-700"
                                        }`}
                                >
                                    {result.passed ? "Passed" : "Failed"}
                                </Badge>
                            </div>

                            {!result.passed && (
                                <div className="mt-2 space-y-2 text-sm">
                                    <div>
                                        <div className="text-gray-400 mb-1">Expected:</div>
                                        <pre className="bg-[#2a2a3a] p-2 rounded overflow-x-auto text-gray-300">
                                            {result.expected === "[Hidden]" ? "Hidden test case" : result.expected}
                                        </pre>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 mb-1">Your Output:</div>
                                        <pre className="bg-[#2a2a3a] p-2 rounded overflow-x-auto text-gray-300">{result.output}</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {allPassed && (
                    <div className="mt-4 p-4 bg-green-900/20 border border-green-800/50 rounded-md">
                        <p className="text-center text-green-400 font-medium">
                            Great job! You've successfully solved this problem.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
