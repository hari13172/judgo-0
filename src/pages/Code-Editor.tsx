"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
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

// Fallback languages in case API fails
const FALLBACK_LANGUAGES = [
    { id: 71, name: "Python (3.8.1)", extension: "python", defaultCode: 'print("Hello, World!")' },
    { id: 63, name: "JavaScript (Node.js 12.14.0)", extension: "javascript", defaultCode: 'console.log("Hello, World!");' },
    { id: 54, name: "C++ (GCC 9.2.0)", extension: "cpp", defaultCode: '#include <iostream>\nint main() {\nstd::cout << "Hello, World!" << std::endl;\nreturn 0;\n}' },
    { id: 62, name: "Java (OpenJDK 13.0.1)", extension: "java", defaultCode: 'public class Main {\npublic static void main(String[] args) {\nSystem.out.println("Hello, World!");\n}\n}' },
]

// API endpoints
const JUDGE0_API = "http://10.5.0.21:5000"
const LANGUAGE_API = "http://10.5.0.2:8001/languages"

// Language interface for type safety
interface Language {
    id: number
    name: string
    extension: string
    defaultCode: string
}

// --------------------- MAIN COMPONENT ------------------------- //

export default function CodeEditorApp() {
    const [selectedLanguage, setSelectedLanguage] = useState<string>("")
    const [language, setLanguage] = useState<Language | null>(null)
    const [languages, setLanguages] = useState<Language[]>([])
    const [code, setCode] = useState<string>("")
    const [stdin, setStdin] = useState<string>("")
    const [output, setOutput] = useState<string>("")
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [theme, setTheme] = useState<string>("vs-dark")
    const [problems] = useState(codingProblems)
    const [selectedProblemId, setSelectedProblemId] = useState<string>(problems[0].id)
    const [selectedProblem, setSelectedProblem] = useState(problems[0])
    const [sidebarTab, setSidebarTab] = useState<string>("problem")
    const [bottomTab, setBottomTab] = useState<string>("terminal")
    const [activeTestTab, setActiveTestTab] = useState<string>("1")
    const [testResults, setTestResults] = useState<{ id: number; passed: boolean; output: string; expected: string }[]>([])
    const [elapsedTime, setElapsedTime] = useState<number>(0)
    const [timerActive, setTimerActive] = useState<boolean>(false)
    const [completed, setCompleted] = useState<boolean>(false)
    const editorRef = useRef<any>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false)

    // New states for resize and collapse
    const [sidebarWidth, setSidebarWidth] = useState<number>(350)
    const [terminalHeight, setTerminalHeight] = useState<number>(200)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
    const [isTerminalCollapsed, setIsTerminalCollapsed] = useState<boolean>(false)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const terminalRef = useRef<HTMLDivElement>(null)
    const isResizing = useRef<boolean>(false)

    // Fetch languages from API
    useEffect(() => {
        const fetchLanguages = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(LANGUAGE_API, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch languages: ${response.status}`)
                }

                const data: any[] = await response.json()
                const formattedLanguages: Language[] = data.map((lang) => ({
                    id: lang.id,
                    name: lang.name,
                    extension: lang.extension || lang.name.toLowerCase().split(" ")[0],
                    defaultCode: lang.defaultCode || `// ${lang.name} code`,
                }))

                setLanguages(formattedLanguages)

                if (formattedLanguages.length > 0) {
                    setSelectedLanguage(formattedLanguages[0].name)
                    setLanguage(formattedLanguages[0])
                    setCode(formattedLanguages[0].defaultCode)
                } else {
                    throw new Error("No languages returned from API")
                }
            } catch (error: any) {
                console.error("Error fetching languages:", error)
                toast.error("Failed to load languages", { description: error.message })
                setLanguages(FALLBACK_LANGUAGES)
                setSelectedLanguage(FALLBACK_LANGUAGES[0].name)
                setLanguage(FALLBACK_LANGUAGES[0])
                setCode(FALLBACK_LANGUAGES[0].defaultCode)
            } finally {
                setIsLoading(false)
            }
        }

        fetchLanguages()
    }, [])

    // Handle language change and send POST request with language ID
    const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const langName = event.target.value
        const selectedLang = languages.find((lang) => lang.name === langName)
        if (selectedLang) {
            try {
                const response = await fetch(LANGUAGE_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: selectedLang.id }),
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch language details: ${response.status}`)
                }

                const langData: any = await response.json()
                const formattedLang: Language = {
                    id: langData.id,
                    name: langData.name,
                    extension: langData.extension || langData.name.toLowerCase().split(" ")[0],
                    defaultCode: langData.defaultCode || `// ${langData.name} code`,
                }

                setSelectedLanguage(langName)
                setLanguage(formattedLang)
                if (selectedProblem && selectedProblem.starterCode && selectedProblem.starterCode[formattedLang.id]) {
                    setCode(selectedProblem.starterCode[formattedLang.id])
                } else {
                    setCode(formattedLang.defaultCode)
                }
            } catch (error: any) {
                console.error("Error fetching language details:", error)
                toast.error("Failed to load language details", { description: error.message })
                setSelectedLanguage(langName)
                setLanguage(selectedLang)
                if (selectedProblem && selectedProblem.starterCode && selectedProblem.starterCode[selectedLang.id]) {
                    setCode(selectedProblem.starterCode[selectedLang.id])
                } else {
                    setCode(selectedLang.defaultCode)
                }
            }
        }
    }

    // Run code with CLI input
    const runCodeWithCLI = async () => {
        if (!code.trim()) {
            toast.error("Code is required", { description: "Please write some code before running." })
            return
        }

        if (!language) {
            toast.error("No language selected", { description: "Please select a programming language." })
            return
        }

        setIsRunning(true)

        try {
            setBottomTab("terminal")
            if (!stdin.trim()) {
                setOutput("No arguments provided.")
                setIsRunning(false)
                return
            }

            console.log("Running with CLI arguments:", stdin)
            const matchingTestCase = selectedProblem.testCases.find((tc) => tc.arguments.trim() === stdin.trim())
            const expectedOutput = matchingTestCase ? matchingTestCase.expectedOutput.trim() : ""

            const response = await fetch(`http://10.5.0.2:8001/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_code: code,
                    language_id: language.id,
                    command_line_arguments: stdin,
                    expected_output: expectedOutput,
                }),
            })

            console.log("API response status:", response)
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
            setOutput(actualOutput)
        } catch (error: any) {
            console.error("Error running code:", error)
            setOutput(`Error: ${error.message || "Unknown error occurred"}`)
        } finally {
            setIsRunning(false)
        }
    }

    const handleCliKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !isRunning) {
            e.preventDefault()
            runCodeWithCLI()
        }
    }

    const useTestCase = (testCaseId: string) => {
        const testCase = selectedProblem.testCases.find((tc) => tc.id.toString() === testCaseId)
        if (testCase) {
            setStdin(testCase.arguments)
            toast.info("Test case copied to CLI", { description: "Click Run to execute with this input." })
        }
    }

    useEffect(() => {
        const problem = problems.find((p) => p.id === selectedProblemId)
        if (problem) {
            setSelectedProblem(problem)
            setTestResults([])
            setCompleted(false)
            setActiveTestTab("1")

            if (language && problem.starterCode && problem.starterCode[language.id]) {
                setCode(problem.starterCode[language.id])
            } else if (language) {
                setCode(language.defaultCode)
            }
        }
    }, [selectedProblemId, problems, language])

    useEffect(() => {
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
        setTimerActive(true)
    }

    const handleProblemChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const problemId = event.target.value
        setSelectedProblemId(problemId)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    const runTestCase = async (testCase: any) => {
        if (!code.trim()) {
            toast.error("Code is required", { description: "Please write some code before running." })
            return { passed: false, output: "Code cannot be blank!" }
        }

        if (!language) {
            toast.error("No language selected", { description: "Please select a programming language." })
            return { passed: false, output: "No language selected" }
        }

        try {
            setIsRunning(true)
            const response = await fetch(`${JUDGE0_API}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_code: code,
                    language_id: language.id,
                    command_line_arguments: testCase.arguments,
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

    const resetTimer = () => {
        setElapsedTime(0)
    }

    // Resize and collapse handlers
    const startSidebarResize = useCallback((e: MouseEvent) => {
        isResizing.current = true
        document.addEventListener("mousemove", resizeSidebar)
        document.addEventListener("mouseup", stopResize)
    }, [])

    const resizeSidebar = useCallback((e: MouseEvent) => {
        if (isResizing.current && sidebarRef.current) {
            const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left
            if (newWidth >= 200 && newWidth <= 600) {
                setSidebarWidth(newWidth)
            }
        }
    }, [])

    const startTerminalResize = useCallback((e: MouseEvent) => {
        isResizing.current = true
        document.addEventListener("mousemove", resizeTerminal)
        document.addEventListener("mouseup", stopResize)
    }, [])

    const resizeTerminal = useCallback((e: MouseEvent) => {
        if (isResizing.current && terminalRef.current) {
            const containerHeight = window.innerHeight
            const newHeight = containerHeight - e.clientY
            if (newHeight >= 100 && newHeight <= 400) {
                setTerminalHeight(newHeight)
            }
        }
    }, [])

    const stopResize = useCallback(() => {
        isResizing.current = false
        document.removeEventListener("mousemove", resizeSidebar)
        document.removeEventListener("mousemove", resizeTerminal)
        document.removeEventListener("mouseup", stopResize)
    }, [resizeSidebar, resizeTerminal])

    const toggleSidebarCollapse = () => {
        setIsSidebarCollapsed((prev) => !prev)
        setSidebarWidth(isSidebarCollapsed ? 350 : 50)
    }

    const toggleTerminalCollapse = () => {
        setIsTerminalCollapsed((prev) => !prev)
        setTerminalHeight(isTerminalCollapsed ? 200 : 30)
    }

    // Optional: Persist sizes to localStorage
    /*
    useEffect(() => {
        const savedSidebarWidth = localStorage.getItem("sidebarWidth")
        const savedTerminalHeight = localStorage.getItem("terminalHeight")
        if (savedSidebarWidth) setSidebarWidth(Number(savedSidebarWidth))
        if (savedTerminalHeight) setTerminalHeight(Number(savedTerminalHeight))
    }, [])

    useEffect(() => {
        localStorage.setItem("sidebarWidth", sidebarWidth.toString())
    }, [sidebarWidth])

    useEffect(() => {
        localStorage.setItem("terminalHeight", terminalHeight.toString())
    }, [terminalHeight])
    */

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-[#1e1e2e] text-white">Loading languages...</div>
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

            <EditorHeader
                problems={problems}
                selectedProblemId={selectedProblemId}
                completed={completed}
                elapsedTime={elapsedTime}
                handleProblemChange={handleProblemChange}
                resetTimer={resetTimer}
            />

            <div className="flex flex-1 overflow-hidden">
                <div
                    ref={sidebarRef}
                    className="bg-[#2d2d3f] text-white overflow-y-auto relative transition-all duration-300"
                    style={{ width: isSidebarCollapsed ? 50 : sidebarWidth }}
                >
                    <ProblemSidebar
                        selectedProblem={selectedProblem}
                        sidebarTab={sidebarTab}
                        setSidebarTab={setSidebarTab}
                        copyToClipboard={copyToClipboard}
                        setStdin={setStdin}
                        isCollapsed={isSidebarCollapsed}
                        toggleCollapse={toggleSidebarCollapse}
                    />
                    {!isSidebarCollapsed && (
                        <div
                            className="absolute top-0 right-0 w-2 h-full bg-gray-600 cursor-ew-resize hover:bg-gray-500"
                            onMouseDown={(e) => startSidebarResize(e.nativeEvent)}
                        />
                    )}
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        languages={languages}
                        handleLanguageChange={handleLanguageChange}
                    />

                    <div className="flex-1 overflow-hidden">
                        <Editor
                            height="100%"
                            language={language?.extension || "plaintext"}
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

                    <CLIInput
                        stdin={stdin}
                        setStdin={setStdin}
                        isRunning={isRunning}
                        runCodeWithCLI={runCodeWithCLI}
                        handleCliKeyDown={handleCliKeyDown}
                    />

                    <div
                        ref={terminalRef}
                        className="bg-[#2d2d3f] border-t border-gray-700 relative transition-all duration-300"
                        style={{ height: isTerminalCollapsed ? 30 : terminalHeight }}
                    >
                        {!isTerminalCollapsed && (
                            <div
                                className="absolute top-0 left-0 w-full h-2 bg-gray-600 cursor-ns-resize hover:bg-gray-500"
                                onMouseDown={(e) => startTerminalResize(e.nativeEvent)}
                            />
                        )}
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
                            language={language ?? { id: 0, name: "", extension: "plaintext", defaultCode: "" }}
                            isCollapsed={isTerminalCollapsed}
                            toggleCollapse={toggleTerminalCollapse}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}