"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Editor from "@monaco-editor/react"
import { toast } from "sonner"
import { codingProblems } from "../problems/CodingProblems"
import { TestResultsDialog } from "./test-results-dialog"

// Import components
import { EditorHeader } from "../code-editor/editor-header"
import { LanguageSelector } from "../code-editor/language-selector"
import { CLIInput } from "../code-editor/cli-input"
import { BottomTabs } from "../code-editor/bottom-tabs"
import { ProblemSidebar } from "../code-editor/problem-sidebar"

// Import utilities
import { formatTime } from "../code-editor/utils"

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
            <EditorHeader
                problems={problems}
                selectedProblemId={selectedProblemId}
                completed={completed}
                elapsedTime={elapsedTime}
                handleProblemChange={handleProblemChange}
                resetTimer={resetTimer}
            />

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar */}
                <div className="w-[350px] bg-[#2d2d3f] text-white overflow-y-auto">
                    <ProblemSidebar
                        selectedProblem={selectedProblem}
                        sidebarTab={sidebarTab}
                        setSidebarTab={setSidebarTab}
                        copyToClipboard={copyToClipboard}
                        setStdin={setStdin}
                    />
                </div>

                {/* Main editor area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Language selector and buttons */}
                    <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        languages={LANGUAGES}
                        handleLanguageChange={handleLanguageChange}
                    />

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
                    <CLIInput
                        stdin={stdin}
                        setStdin={setStdin}
                        isRunning={isRunning}
                        runCodeWithCLI={runCodeWithCLI}
                        handleCliKeyDown={handleCliKeyDown}
                    />

                    {/* Test cases tabs */}
                    <div className="bg-[#2d2d3f] border-t border-gray-700">
                        <BottomTabs
                            bottomTab={bottomTab}
                            setBottomTab={setBottomTab}
                            isRunning={isRunning}
                            validateSolution={validateSolution}
                            selectedProblem={selectedProblem}
                            activeTestTab={activeTestTab}
                            setActiveTestTab={setActiveTestTab}
                            useTestCase={useTestCase}
                            copyToClipboard={copyToClipboard}
                            output={output}
                            testResults={testResults}
                            elapsedTime={elapsedTime}
                            stdin={stdin}
                            language={language}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
