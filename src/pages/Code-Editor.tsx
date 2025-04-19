"use client"

import { useState, useRef } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Play, Check, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

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
    {
        id: 51,
        name: "C# (Mono 6.6.0.161)",
        extension: "csharp",
        defaultCode:
            'using System;\nclass Program {\nstatic void Main(String[] args) {\nConsole.WriteLine("Hello, World!");\n}\n}',
    },
    { id: 68, name: "PHP (7.4.1)", extension: "php", defaultCode: '<?php\necho "Hello, World!";\n?>' },
    { id: 72, name: "Ruby (2.7.0)", extension: "ruby", defaultCode: 'puts "Hello, World!"' },
    { id: 74, name: "TypeScript (3.7.4)", extension: "typescript", defaultCode: 'console.log("Hello, World!");' },
    { id: 82, name: "SQL (SQLite 3.27.2)", extension: "sql", defaultCode: 'SELECT "Hello, World!";' },
    {
        id: 60,
        name: "Go (1.13.5)",
        extension: "go",
        defaultCode: 'package main\nimport "fmt"\nfunc main() {\nfmt.Println("Hello, World!")\n}',
    },
]

const SAMPLE_PROBLEMS: Problem[] = [
    {
        id: "sum-two-numbers",
        title: "Sum of Two Numbers",
        description: "Write a function that takes two numbers as input and returns their sum.",
        difficulty: "Easy",
        testCases: [
            { id: 1, input: "2 3", expectedOutput: "5", isHidden: false },
            { id: 2, input: "0 0", expectedOutput: "0", isHidden: false },
            { id: 3, input: "-5 10", expectedOutput: "5", isHidden: false },
            { id: 4, input: "999 1", expectedOutput: "1000", isHidden: true },
        ],
        starterCode: {
            71: "def sum_two_numbers(a, b):\n    # Your code here\n    pass\n\n# Read input\na, b = map(int, input().split())\n# Call function and print result\nprint(sum_two_numbers(a, b))",
            63: "function sumTwoNumbers(a, b) {\n    // Your code here\n}\n\n// Read input\nconst input = require('readline')\n    .createInterface(process.stdin, process.stdout);\n\ninput.question('', (line) => {\n    const [a, b] = line.split(' ').map(Number);\n    console.log(sumTwoNumbers(a, b));\n    input.close();\n});",
            54: "#include <iostream>\nusing namespace std;\n\nint sumTwoNumbers(int a, int b) {\n    // Your code here\n    return 0;\n}\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << sumTwoNumbers(a, b) << endl;\n    return 0;\n}",
            62: "import java.util.Scanner;\n\npublic class Main {\n    public static int sumTwoNumbers(int a, int b) {\n        // Your code here\n        return 0;\n    }\n    \n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        int a = scanner.nextInt();\n        int b = scanner.nextInt();\n        System.out.println(sumTwoNumbers(a, b));\n    }\n}",
        },
    },
    {
        id: "reverse-string",
        title: "Reverse a String",
        description: "Write a function that reverses a string.",
        difficulty: "Easy",
        testCases: [
            { id: 1, input: "hello", expectedOutput: "olleh", isHidden: false },
            { id: 2, input: "world", expectedOutput: "dlrow", isHidden: false },
            { id: 3, input: "a", expectedOutput: "a", isHidden: false },
            { id: 4, input: "racecar", expectedOutput: "racecar", isHidden: true },
        ],
        starterCode: {
            71: "def reverse_string(s):\n    # Your code here\n    pass\n\n# Read input\ns = input().strip()\n# Call function and print result\nprint(reverse_string(s))",
            63: "function reverseString(s) {\n    // Your code here\n}\n\n// Read input\nconst input = require('readline')\n    .createInterface(process.stdin, process.stdout);\n\ninput.question('', (line) => {\n    console.log(reverseString(line));\n    input.close();\n});",
        },
    },
]

const JUDGE0_API = "http://10.5.0.250:2358"

// ---------------------- UTILS ------------------------ //

function encodeBase64(text: string): string {
    return btoa(unescape(encodeURIComponent(text)))
}

function decodeBase64(base64: string): string {
    return decodeURIComponent(escape(atob(base64)))
}

function isValidJSON(str: string) {
    try {
        JSON.parse(str)
        return true
    } catch (e) {
        return false
    }
}

// --------------------- INTERFACES ------------------------- //

interface TestCase {
    id: number
    input: string
    expectedOutput: string
    isHidden?: boolean
}

interface Problem {
    id: string
    title: string
    description: string
    difficulty: "Easy" | "Medium" | "Hard"
    testCases: TestCase[]
    starterCode: {
        [key: number]: string // language_id -> starter code
    }
}

// --------------------- MAIN COMPONENT ------------------------- //

export default function CodeEditorApp() {
    const [language, setLanguage] = useState(LANGUAGES[0])
    const [code, setCode] = useState(language.defaultCode)
    const [stdin, setStdin] = useState("")
    const [output, setOutput] = useState("")
    const [isRunning, setIsRunning] = useState(false)
    const [theme, setTheme] = useState("vs-dark")
    const [showApiWarning, setShowApiWarning] = useState(false)
    const [problems, setProblems] = useState<Problem[]>(SAMPLE_PROBLEMS)
    const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
    const [testResults, setTestResults] = useState<{ id: number; passed: boolean; output: string; expected: string }[]>(
        [],
    )
    const [viewMode, setViewMode] = useState<"code" | "problem">("code")
    const editorRef = useRef(null)

    function handleEditorDidMount(editor: any, monaco: any) {
        editorRef.current = editor

        monaco.editor.defineTheme("monokai", {
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
                "editor.background": "#272822",
                "editor.foreground": "#f8f8f2",
                "editorLineNumber.foreground": "#8F908A",
                "editor.selectionBackground": "#49483E",
                "editor.lineHighlightBackground": "#3E3D32",
            },
        })

        setTheme("monokai")
    }

    const handleLanguageChange = (langId: string) => {
        const selectedLang = LANGUAGES.find((lang) => lang.id.toString() === langId)
        if (selectedLang) {
            setLanguage(selectedLang)
            setCode(selectedLang.defaultCode)
        }
    }

    const handleProblemSelect = (problemId: string) => {
        const problem = problems.find((p) => p.id === problemId)
        if (problem) {
            setSelectedProblem(problem)
            setViewMode("problem")

            // Set starter code for the selected language if available
            if (problem.starterCode && problem.starterCode[language.id]) {
                setCode(problem.starterCode[language.id])
            }
        }
    }

    const runTestCases = async () => {
        if (!selectedProblem) {
            toast.error("No problem selected", { description: "Please select a problem first." })
            return
        }

        setIsRunning(true)
        setTestResults([])
        const results = []

        try {
            for (const testCase of selectedProblem.testCases) {
                // Run code with test case input
                const response = await fetch(`${JUDGE0_API}/submissions?base64_encoded=true`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        source_code: encodeBase64(code),
                        language_id: language.id,
                        stdin: encodeBase64(testCase.input),
                    }),
                })

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`)
                }

                const data = await response.json()
                const token = data.token

                if (!token) {
                    throw new Error("No token received.")
                }

                let attempts = 0
                let result = null
                let status = "Processing"

                while ((status === "Processing" || status === "In Queue") && attempts < 10) {
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                    const resultRes = await fetch(`${JUDGE0_API}/submissions/${token}?base64_encoded=true`)
                    result = await resultRes.json()
                    status = result.status?.description || "Processing"
                    attempts++
                }

                let actualOutput = ""
                if (result.stdout) {
                    actualOutput = decodeBase64(result.stdout).trim()
                } else if (result.stderr) {
                    actualOutput = `Error: ${decodeBase64(result.stderr)}`
                } else if (result.compile_output) {
                    actualOutput = `Compilation Error: ${decodeBase64(result.compile_output)}`
                } else {
                    actualOutput = `Execution Error: ${result.status?.description || "Unknown error"}`
                }

                // Compare with expected output
                const passed = actualOutput === testCase.expectedOutput.trim()

                results.push({
                    id: testCase.id,
                    passed,
                    output: actualOutput,
                    expected: testCase.isHidden ? "[Hidden]" : testCase.expectedOutput,
                })
            }

            setTestResults(results)

            const allPassed = results.every((r) => r.passed)
            if (allPassed) {
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

    const runCode = async () => {
        if (!code.trim()) {
            toast.error("Code is required", { description: "Please write some code before running." })
            setOutput("Code cannot be blank!")
            return
        }
        if (!language.id) {
            toast.error("Language is required", { description: "Please select a language." })
            setOutput("Language cannot be blank!")
            return
        }

        setIsRunning(true)
        setOutput("")

        try {
            const response = await fetch(`${JUDGE0_API}/submissions?base64_encoded=true`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_code: encodeBase64(code),
                    language_id: language.id,
                    stdin: encodeBase64(stdin),
                }),
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()
            const token = data.token

            if (!token) {
                throw new Error("No token received.")
            }

            let attempts = 0
            let result = null
            let status = "Processing"

            while ((status === "Processing" || status === "In Queue") && attempts < 10) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                const resultRes = await fetch(`${JUDGE0_API}/submissions/${token}?base64_encoded=true`)
                result = await resultRes.json()
                status = result.status?.description || "Processing"
                attempts++
            }

            if (result.stdout) {
                setOutput(decodeBase64(result.stdout))
            } else if (result.stderr) {
                setOutput(`Error: ${decodeBase64(result.stderr)}`)
            } else if (result.compile_output) {
                setOutput(`Compilation Error: ${decodeBase64(result.compile_output)}`)
            } else {
                setOutput(`Execution Error: ${result.status?.description || "Unknown error"}`)
            }

            toast.success("Execution Complete!", {
                description: result.status?.description || "Success",
            })
        } catch (error: any) {
            console.error(error)
            setOutput(`Error: ${error.message || "Unknown error occurred"}`)
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            {showApiWarning && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Judge0 Warning</AlertTitle>
                    <AlertDescription>
                        Base64 encoding is enabled. Please ensure your Judge0 server is configured correctly.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <Select value={language.id.toString()} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.id} value={lang.id.toString()}>
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedProblem?.id || ""} onValueChange={handleProblemSelect}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select Problem" />
                        </SelectTrigger>
                        <SelectContent>
                            {problems.map((problem) => (
                                <SelectItem key={problem.id} value={problem.id}>
                                    {problem.title} ({problem.difficulty})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setViewMode(viewMode === "code" ? "problem" : "code")}>
                        {viewMode === "code" ? "View Problem" : "View Code"}
                    </Button>
                    <Button onClick={runCode} disabled={isRunning} className="gap-2">
                        {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        Run
                    </Button>
                    {selectedProblem && (
                        <Button onClick={runTestCases} disabled={isRunning} variant="default" className="gap-2">
                            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Run Tests
                        </Button>
                    )}
                </div>
            </div>

            {viewMode === "problem" && selectedProblem ? (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>{selectedProblem.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose dark:prose-invert max-w-none">
                            <div className="flex items-center gap-2 mb-4">
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${selectedProblem.difficulty === "Easy"
                                        ? "bg-green-100 text-green-800"
                                        : selectedProblem.difficulty === "Medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                >
                                    {selectedProblem.difficulty}
                                </span>
                            </div>
                            <p>{selectedProblem.description}</p>

                            <h3 className="text-lg font-semibold mt-4">Example Test Cases:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                {selectedProblem.testCases
                                    .filter((tc) => !tc.isHidden)
                                    .map((testCase) => (
                                        <div key={testCase.id} className="border rounded-md p-3">
                                            <div className="font-mono text-sm">
                                                <div className="font-semibold">Input:</div>
                                                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded">{testCase.input}</pre>
                                                <div className="font-semibold mt-2">Expected Output:</div>
                                                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded">{testCase.expectedOutput}</pre>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Code Editor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Editor
                            height="400px"
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
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Input</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Enter program input..."
                            value={stdin}
                            onChange={(e) => setStdin(e.target.value)}
                            className="min-h-[150px] font-mono"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-black text-white p-4 rounded-md min-h-[150px] font-mono whitespace-pre-wrap overflow-auto">
                            {output || "Run your code to see output here..."}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {testResults.length > 0 && (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Test Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            {testResults.map((result) => (
                                <div
                                    key={result.id}
                                    className={`border p-4 rounded-md ${result.passed
                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                        : "border-red-500 bg-red-50 dark:bg-red-900/20"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Test Case #{result.id}</h3>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${result.passed
                                                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                                : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                                }`}
                                        >
                                            {result.passed ? "Passed" : "Failed"}
                                        </span>
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Your Output:</p>
                                            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto max-h-[100px]">
                                                {result.output}
                                            </pre>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Expected Output:</p>
                                            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto max-h-[100px]">
                                                {result.expected}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
