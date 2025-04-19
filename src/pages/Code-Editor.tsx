"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, CheckCircle, Copy, Heart, RefreshCw, Home, Code, ArrowRight } from 'lucide-react'
import { toast } from "sonner"
import { codingProblems } from "../problems/CodingProblems"
import { TestResultsDialog } from "../pages/test-results-dialog"

// ------------------------ CONFIG -------------------------------- //

const LANGUAGES = [
    { id: 71, name: "Python (3.8.1)", extension: "python", defaultCode: 'print("Hello, World!")' },
    {
        id: 63,
        name: "JavaScript (Node.js 12.14.0)",
        extension: "javascript",
        defaultCode: 'console.log("Hello, World!");',
    },
    {
        id: 54,
        name: "C++ (GCC 9.2.0)",
        extension: "cpp",
        defaultCode: '#include <iostream>\nint main() {\nstd::cout << "Hello, World!" << std::endl;\nreturn 0;\n}',
    },
    {
        id: 62,
        name: "Java (OpenJDK 13.0.1)",
        extension: "java",
        defaultCode:
            'public class Main {\npublic static void main(String[] args) {\nSystem.out.println("Hello, World!");\n}\n}',
    },
]



// Use the custom API endpoint provided in the user's code
const JUDGE0_API = "http://10.5.0.21:5000"

// ---------------------- UTILS ------------------------ //

function encodeBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
}

function decodeBase64(base64: string): string {
    return decodeURIComponent(escape(atob(base64)))
}

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

// --------------------- MAIN COMPONENT ------------------------- //

export default function CodeEditorApp() {
    const [selectedLanguage, setSelectedLanguage] = useState<string>("Python (3.8.1)")
    const [language, setLanguage] = useState(LANGUAGES[0])
    const [code, setCode] = useState(language.defaultCode)
    const [stdin, setStdin] = useState("")
    const [output, setOutput] = useState("")
    const [isRunning, setIsRunning] = useState(false)
    const [theme, setTheme] = useState("vs-dark")
    const [problems] = useState(codingProblems)
    const [selectedProblemId, setSelectedProblemId] = useState(problems[0].id)
    const [selectedProblem, setSelectedProblem] = useState(problems[0])
    const [sidebarTab, setSidebarTab] = useState("problem")
    const [bottomTab, setBottomTab] = useState("terminal")
    const [activeTestTab, setActiveTestTab] = useState("1")
    const [testResults, setTestResults] = useState<{ id: number; passed: boolean; output: string; expected: string }[]>(
        [],
    )
    const [elapsedTime, setElapsedTime] = useState(0)
    const [timerActive, setTimerActive] = useState(false)
    const [completed, setCompleted] = useState(false)
    const editorRef = useRef(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const tabsRef = useRef<HTMLDivElement>(null)
    const [showResultsDialog, setShowResultsDialog] = useState(false)

    // Completely rewritten runCodeWithCLI function to use command_line_arguments parameter
    const runCodeWithCLI = async () => {
        if (!code.trim()) {
            toast.error("Code is required", { description: "Please write some code before running." })
            return
        }

        setIsRunning(true)

        try {
            // First, switch to terminal tab immediately
            setBottomTab("terminal")

            // If no arguments provided, show the "No arguments provided" message
            if (!stdin.trim()) {
                setOutput("No arguments provided.")
                setIsRunning(false)
                return
            }

            console.log("Running with CLI arguments:", stdin)

            // Send the code to Judge0 with command_line_arguments parameter
            const response = await fetch(`${JUDGE0_API}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_code: code,
                    language_id: language.id,
                    command_line_arguments: stdin, // This is the key change - use command_line_arguments
                }),
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const result = await response.json()
            console.log("API response:", result)

            let actualOutput = ""
            if (result.stdout) {
                actualOutput = result.stdout.trim()
            } else if (result.stderr) {
                actualOutput = `Error: ${result.stderr}`
            } else if (result.compile_output) {
                actualOutput = `Compilation Error: ${result.compile_output}`
            } else {
                actualOutput = `Execution Error: ${result.status?.description || "Unknown error"}`
            }

            // Find the test case that matches the CLI argument
            const matchingTestCase = selectedProblem.testCases.find((tc) => tc.arguments.trim() === stdin.trim())

            // If we have a matching test case, compare and show result
            if (matchingTestCase) {
                const expectedOutput = matchingTestCase.expectedOutput.trim()
                const passed = actualOutput === expectedOutput

                if (passed) {
                    setOutput(`${actualOutput}\n\n✅ Success! Output matches expected result.`)
                    toast.success("Test passed!", { description: "Your code produced the expected output." })
                } else {
                    setOutput(`${actualOutput}\n\n❌ Failed! Expected: "${expectedOutput}", but got: "${actualOutput}"`)
                    toast.error("Test failed", { description: "Output doesn't match expected result." })
                }
            } else {
                // No matching test case found, just show the output
                setOutput(actualOutput)
            }
        } catch (error: any) {
            console.error("Error running code:", error)
            setOutput(`Error: ${error.message || "Unknown error occurred"}`)
        } finally {
            setIsRunning(false)
        }
    }

    // Add a keyboard event handler for the CLI input field
    const handleCliKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !isRunning) {
            e.preventDefault()
            runCodeWithCLI()
        }
    }

    // Function to use a test case as CLI input
    const useTestCase = (testCaseId: string) => {
        const testCase = selectedProblem.testCases.find((tc) => tc.id.toString() === testCaseId)
        if (testCase) {
            setStdin(testCase.arguments)
            toast.info("Test case copied to CLI", { description: "Click Run to execute with this input." })
        }
    }

    useEffect(() => {
        // Find the selected problem
        const problem = problems.find((p) => p.id === selectedProblemId)
        if (problem) {
            setSelectedProblem(problem)
            // Reset test results when changing problems
            setTestResults([])
            setCompleted(false)
            setActiveTestTab("1")

            // Set initial code based on selected problem and language
            if (problem.starterCode && problem.starterCode[language.id]) {
                setCode(problem.starterCode[language.id])
            } else {
                setCode(language.defaultCode)
            }
        }
    }, [selectedProblemId, problems, language])

    useEffect(() => {
        // Timer logic
        if (timerActive) {
            timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1)
            }, 1000)
        } else if (timerRef.current) {
            clearInterval(timerRef.current)
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [timerActive])

    function handleEditorDidMount(editor: any, monaco: any) {
        editorRef.current = editor

        monaco.editor.defineTheme("judge0-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
                { token: "comment", foreground: "88846f", fontStyle: "italic" },
                { token: "keyword", foreground: "f92672" },
                { token: "string", foreground: "e6db74" },
                { token: "number", foreground: "ae81ff" },
                { token: "type", foreground: "66d9ef", fontStyle: "italic" },
            ],
            colors: {
                "editor.background": "#1e1e2e",
                "editor.foreground": "#f8f8f2",
                "editorLineNumber.foreground": "#8F908A",
                "editor.selectionBackground": "#49483E",
                "editor.lineHighlightBackground": "#3E3D32",
            },
        })

        setTheme("judge0-dark")

        // Start the timer when editor is mounted
        setTimerActive(true)
    }

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const langName = event.target.value
        const selectedLang = LANGUAGES.find((lang) => lang.name === langName)
        if (selectedLang) {
            setSelectedLanguage(langName)
            setLanguage(selectedLang)

            // Update code with starter code if available
            if (selectedProblem && selectedProblem.starterCode && selectedProblem.starterCode[selectedLang.id]) {
                setCode(selectedProblem.starterCode[selectedLang.id])
            } else {
                setCode(selectedLang.defaultCode)
            }
        }
    }

    const handleProblemChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const problemId = event.target.value
        setSelectedProblemId(problemId)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    // Update runTestCase function to use command_line_arguments
    const runTestCase = async (testCase: any) => {
        if (!code.trim()) {
            toast.error("Code is required", { description: "Please write some code before running." })
            return { passed: false, output: "Code cannot be blank!" }
        }

        try {
            setIsRunning(true)

            const response = await fetch(`${JUDGE0_API}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_code: code,
                    language_id: language.id,
                    command_line_arguments: testCase.arguments, // Use command_line_arguments parameter
                }),
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const result = await response.json()

            let actualOutput = ""
            if (result.stdout) {
                actualOutput = result.stdout.trim()
            } else if (result.stderr) {
                actualOutput = `Error: ${result.stderr}`
            } else if (result.compile_output) {
                actualOutput = `Compilation Error: ${result.compile_output}`
            } else {
                actualOutput = `Execution Error: ${result.status?.description || "Unknown error"}`
            }

            // Compare with expected output
            const passed = actualOutput === testCase.expectedOutput.trim()

            return { passed, output: actualOutput }
        } catch (error: any) {
            console.error(error)
            return { passed: false, output: `Error: ${error.message || "Unknown error occurred"}` }
        } finally {
            setIsRunning(false)
        }
    }

    const runAllTests = async () => {
        if (!selectedProblem) {
            toast.error("No problem selected", { description: "Please select a problem first." })
            return
        }

        setIsRunning(true)
        setTestResults([])
        const results = []

        try {
            for (const testCase of selectedProblem.testCases) {
                const result = await runTestCase(testCase)

                results.push({
                    id: testCase.id,
                    passed: result.passed,
                    output: result.output,
                    expected: testCase.isHidden ? "[Hidden]" : testCase.expectedOutput,
                })
            }

            setTestResults(results)

            // Switch to terminal tab after running all tests
            setBottomTab("terminal")

            const allPassed = results.every((r) => r.passed)
            setShowResultsDialog(true)
            if (allPassed) {
                setCompleted(true)
                toast.success("All test cases passed!", { description: "Great job!" })
            } else {
                toast.error("Some test cases failed", { description: "Check the results below." })
            }
        } catch (error: any) {
            console.error(error)
            toast.error("Error running test cases", { description: error.message })
        } finally {
            setIsRunning(false)
        }
    }

    const validateSolution = async () => {
        await runAllTests()
    }

    const runSingleTest = async (testCaseId: string) => {
        const testCase = selectedProblem.testCases.find((tc) => tc.id.toString() === testCaseId)
        if (!testCase) return

        setIsRunning(true)
        setStdin(testCase.arguments)

        try {
            const result = await runTestCase(testCase)
            setOutput(result.output)

            // Switch to terminal tab after running
            setBottomTab("terminal")

            if (result.passed) {
                toast.success("Test case passed!", { description: `Test case #${testCaseId} executed successfully.` })
            } else {
                toast.error("Test case failed", { description: `Expected: ${testCase.expectedOutput}, Got: ${result.output}` })
            }
        } catch (error: any) {
            console.error(error)
            setOutput(`Error: ${error.message || "Unknown error occurred"}`)
        } finally {
            setIsRunning(false)
        }
    }

    const resetTimer = () => {
        setElapsedTime(0)
    }

    return (
        <div className="flex flex-col h-screen bg-[#1e1e2e]">

            <TestResultsDialog
                open={showResultsDialog}
                onOpenChange={setShowResultsDialog}
                results={testResults}
                totalTime={formatTime(elapsedTime)}
                problemTitle={selectedProblem.title}
                allPassed={testResults.length > 0 && testResults.every((r) => r.passed)}
            />
            {/* Header */}
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

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar */}
                <div className="w-[350px] bg-[#2d2d3f] text-white overflow-y-auto">
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
                                        {selectedProblem.constraints.map((constraint, index) => (
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
                                    {selectedProblem.examples.map((example, index) => (
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
                                        {selectedProblem.tags.map((tag, index) => (
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
                </div>

                {/* Main editor area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Language selector and buttons */}
                    <div className="bg-[#1e1e2e] text-white p-2 flex items-center justify-between border-b border-gray-700">
                        <div className="flex items-center">
                            <select
                                value={selectedLanguage}
                                onChange={handleLanguageChange}
                                className="bg-[#2d2d3f] text-white text-sm rounded-md border border-gray-700 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {LANGUAGES.map((lang) => (
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

                    {/* Code editor */}
                    <div className="flex-1 overflow-hidden">
                        <Editor
                            height="100%"
                            language={language.extension}
                            value={code}
                            onChange={(value) => setCode(value || "")}
                            theme={theme}
                            onMount={handleEditorDidMount}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: "on",
                                lineNumbers: "on",
                            }}
                        />
                    </div>

                    {/* CLI input */}
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

                    {/* Test cases tabs */}
                    <div className="bg-[#2d2d3f] border-t border-gray-700">
                        <Tabs defaultValue="test-cases" value={bottomTab} onValueChange={setBottomTab} ref={tabsRef}>
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
                                    {/* Removed the Run button here to avoid duplication */}
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
                                <div className="flex flex-col">
                                    <div className="flex border-b border-gray-700 overflow-x-auto">
                                        {selectedProblem.testCases.map((testCase) => (
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
                                                    {selectedProblem.testCases.find((tc) => tc.id.toString() === activeTestTab)?.arguments || ""}
                                                </pre>
                                                <div className="flex space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 py-0 text-xs"
                                                        onClick={() => useTestCase(activeTestTab)}
                                                    >
                                                        Use <ArrowRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                selectedProblem.testCases.find((tc) => tc.id.toString() === activeTestTab)?.arguments ||
                                                                "",
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
                                                    {selectedProblem.testCases.find((tc) => tc.id.toString() === activeTestTab)?.expectedOutput ||
                                                        ""}
                                                </pre>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            selectedProblem.testCases.find((tc) => tc.id.toString() === activeTestTab)
                                                                ?.expectedOutput || "",
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
                            </TabsContent>

                            <TabsContent value="terminal" className="p-0">
                                <div className="bg-black p-3 h-[200px] overflow-y-auto font-mono">
                                    {output ? (
                                        <div className="text-sm text-gray-300">
                                            <div className="text-green-500">
                                                <span className="text-blue-400">ninja@</span>
                                                <span className="text-red-400">selfmade</span>
                                                <span className="text-white">:~$ </span>
                                                {stdin
                                                    ? `${language.name.includes("Python") ? "python" : language.name.includes("JavaScript") ? "node" : language.name.includes("Java") ? "java" : "cpp"} script.${language.extension === "python" ? "py" : language.extension === "javascript" ? "js" : language.extension === "java" ? "java" : "cpp"} ${stdin}`
                                                    : `${language.name.includes("Python") ? "python" : language.name.includes("JavaScript") ? "node" : language.name.includes("Java") ? "java" : "cpp"} script.${language.extension === "python" ? "py" : language.extension === "javascript" ? "js" : language.extension === "java" ? "java" : "cpp"}`}
                                            </div>
                                            <pre className="whitespace-pre-wrap">{output}</pre>
                                            <div className="text-green-500 mt-2">
                                                <span className="text-blue-400">ninja@</span>
                                                <span className="text-red-400">selfmade</span>
                                                <span className="text-white">:~$ </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500">
                                            <div className="text-green-500">
                                                <span className="text-blue-400">ninja@</span>
                                                <span className="text-red-400">selfmade</span>
                                                <span className="text-white">:~$ </span>
                                            </div>
                                            <p>Run your code to see output here...</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="stats" className="p-4">
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
                                                        <div
                                                            className={`w-2 h-2 rounded-full mr-2 ${result.passed ? "bg-green-500" : "bg-red-500"}`}
                                                        ></div>
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
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}
