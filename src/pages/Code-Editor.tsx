"use client"

import { useState, useRef } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Play, Check, Upload, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

// Language options with their Judge0 IDs
const LANGUAGES = [
    { id: 71, name: "Python (3.8.1)", extension: "py", defaultCode: 'print("Hello, World!")' },
    { id: 63, name: "JavaScript (Node.js 12.14.0)", extension: "js", defaultCode: 'console.log("Hello, World!");' },
    {
        id: 54,
        name: "C++ (GCC 9.2.0)",
        extension: "cpp",
        defaultCode:
            '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
    },
    {
        id: 62,
        name: "Java (OpenJDK 13.0.1)",
        extension: "java",
        defaultCode:
            'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    },
    {
        id: 51,
        name: "C# (Mono 6.6.0.161)",
        extension: "cs",
        defaultCode:
            'using System;\n\nclass Program {\n    static void Main(String[] args) {\n        Console.WriteLine("Hello, World!");\n    }\n}',
    },
    { id: 68, name: "PHP (7.4.1)", extension: "php", defaultCode: '<?php\n    echo "Hello, World!";\n?>' },
    { id: 72, name: "Ruby (2.7.0)", extension: "rb", defaultCode: 'puts "Hello, World!"' },
    { id: 74, name: "TypeScript (3.7.4)", extension: "ts", defaultCode: 'console.log("Hello, World!");' },
    { id: 82, name: "SQL (SQLite 3.27.2)", extension: "sql", defaultCode: 'SELECT "Hello, World!";' },
    {
        id: 60,
        name: "Go (1.13.5)",
        extension: "go",
        defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
    },
]

// Judge0 API endpoint - using the public endpoint that doesn't require authentication
const JUDGE0_API = "http://10.5.0.250:2358"

// Function to check if a string is valid JSON
const isValidJSON = (str: string) => {
    try {
        JSON.parse(str)
        return true
    } catch (e) {
        return false
    }
}

// Basic syntax validation without API for common languages
const validateSyntaxLocally = (code: any, language: any) => {
    const errors = []

    // Very basic syntax checks for common languages
    switch (language.extension) {
        case "py":
            // Check for basic Python syntax errors
            if (code.includes("print(") && !code.includes(")")) {
                errors.push("Missing closing parenthesis in print statement")
            }
            if (code.includes("def ") && !code.includes(":")) {
                errors.push("Missing colon after function definition")
            }
            if ((code.match(/if /g) || []).length !== (code.match(/:/g) || []).length) {
                errors.push("Possible missing colon in conditional statement")
            }
            break
        case "js":
        case "ts":
            // Check for basic JavaScript/TypeScript syntax errors
            if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) {
                errors.push("Mismatched curly braces")
            }
            if ((code.match(/$$/g) || []).length !== (code.match(/$$/g) || []).length) {
                errors.push("Mismatched parentheses")
            }
            if (code.includes("console.log(") && !code.includes(");")) {
                errors.push("Missing semicolon or closing parenthesis in console.log statement")
            }
            break
        case "cpp":
        case "java":
            // Check for basic C++/Java syntax errors
            if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) {
                errors.push("Mismatched curly braces")
            }
            if ((code.match(/$$/g) || []).length !== (code.match(/$$/g) || []).length) {
                errors.push("Mismatched parentheses")
            }
            if (!code.includes(";")) {
                errors.push("Missing semicolons")
            }
            break
        default:
            errors.push("Local syntax validation not available for this language")
    }

    return errors
}

export default function Code() {
    const [language, setLanguage] = useState(LANGUAGES[0])
    const [code, setCode] = useState(LANGUAGES[0].defaultCode)
    const [stdin, setStdin] = useState("")
    const [output, setOutput] = useState("")
    const [isRunning, setIsRunning] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isValidating, setIsValidating] = useState(false)
    const [theme, setTheme] = useState("vs-dark")
    const [showApiWarning, setShowApiWarning] = useState(false)
    const editorRef = useRef(null)

    // Handle editor mount
    function handleEditorDidMount(editor: any, monaco: any) {
        editorRef.current = editor

        // Configure Monaco editor
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

    // Handle language change
    const handleLanguageChange = (langId: any) => {
        const selectedLang = LANGUAGES.find((lang) => lang.id.toString() === langId)
        if (selectedLang) {
            setLanguage(selectedLang)
            setCode(selectedLang.defaultCode)
        }
    }

    const runCode = async () => {
        if (!code.trim()) {
            toast.error("Code is required", { description: "Please write some code before running." });
            setOutput("Code cannot be blank!");
            return;
        }
        if (!language.id) {
            toast.error("Language is required", { description: "Please select a language." });
            setOutput("Language cannot be blank!");
            return;
        }

        setIsRunning(true);
        setOutput("");

        try {
            if (!showApiWarning) {
                setShowApiWarning(true);
            }

            const response = await fetch(`${JUDGE0_API}/submissions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    source_code: code,
                    language_id: language.id,
                    stdin: stdin,
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const token = data.token;

            if (!token) {
                throw new Error("No token received from Judge0.");
            }

            let status = "Processing";
            let result = null;
            let attempts = 0;
            const maxAttempts = 10;

            while ((status === "Processing" || status === "In Queue") && attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                attempts++;

                const resultRes = await fetch(`${JUDGE0_API}/submissions/${token}`);
                const resultData = await resultRes.json();
                result = resultData;
                status = result.status?.description || "Processing";
            }

            if (attempts >= maxAttempts) {
                setOutput("Execution timed out. Try again later.");
                return;
            }

            if (result.stdout) {
                setOutput(result.stdout);
            } else if (result.stderr) {
                setOutput(`Error: ${result.stderr}`);
            } else if (result.compile_output) {
                setOutput(`Compilation Error: ${result.compile_output}`);
            } else {
                setOutput(`Execution Error: ${result.status?.description || "Unknown error"}`);
            }

            toast("Code execution complete", { description: result.status?.description || "Success" });

        } catch (error: any) {
            console.error(error);
            setOutput(`Error: ${error.message || "Unknown error occurred."}`);
        } finally {
            setIsRunning(false);
        }
    };


    // Submit code (similar to run but with different UI feedback)
    const submitCode = async () => {
        setIsSubmitting(true)
        setOutput("")

        try {
            // Show API warning if not already shown
            if (!showApiWarning) {
                setShowApiWarning(true)
            }

            // Create submission
            const response = await fetch(`${JUDGE0_API}/submissions`, {
                method: "POST",

                body: JSON.stringify({
                    source_code: code,
                    language_id: language.id,
                    stdin: stdin,
                }),
            })

            // Handle API errors
            if (response.status === 401) {
                throw new Error("API authentication required. Using local execution instead.")
            }

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`)
            }

            // Parse response
            let data
            try {
                const text = await response.text()
                if (!text || !isValidJSON(text)) {
                    throw new Error("Invalid response from Judge0 API")
                }
                data = JSON.parse(text)
            } catch (parseError) {
                throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`)
            }

            if (!data || !data.token) {
                throw new Error("Invalid response: Missing submission token")
            }

            const token = data.token

            // Poll for results
            let status = "Processing"
            let result = null
            let attempts = 0
            const maxAttempts = 10

            while ((status === "Processing" || status === "In Queue") && attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                attempts++

                try {
                    const resultResponse = await fetch(`${JUDGE0_API}/submissions/${token}`, {

                    })

                    if (!resultResponse.ok) {
                        throw new Error(`API error: ${resultResponse.status} ${resultResponse.statusText}`)
                    }

                    const resultText = await resultResponse.text()
                    if (!resultText || !isValidJSON(resultText)) {
                        throw new Error("Invalid response when checking submission status")
                    }

                    result = JSON.parse(resultText)
                    status = result.status?.description || "Processing"
                } catch (pollError) {
                    console.error("Error polling submission status:", pollError)
                    // Continue polling despite errors
                }
            }

            if (attempts >= maxAttempts) {
                setOutput("Execution timed out. The Judge0 API may be experiencing high load.")
                return
            }

            // Display results
            if (result.stdout) {
                setOutput(result.stdout)
            } else if (result.stderr) {
                setOutput(`Error: ${result.stderr}`)
            } else if (result.compile_output) {
                setOutput(`Compilation Error: ${result.compile_output}`)
            } else {
                setOutput(`Execution Error: ${result.status?.description || "Unknown error"}`)
            }

            toast('Submission complete', {
                description: result.status?.description || "Code submitted successfully",
            })
        } catch (error) {
            console.error("Error submitting code:", error)

            // Fallback to a simple message for the user
            if (error instanceof Error && error.message.includes("API authentication required")) {
                setOutput(
                    "The Judge0 API requires authentication. To use this feature, you would need to set up your own Judge0 instance or subscribe to the RapidAPI service.",
                )

                toast.error('API Authentication Required', {
                    description: "The code submission feature requires API authentication.",
                })
            } else {
                setOutput(`Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`)

                toast.error('Error submitting code', {
                    description: error instanceof Error ? error.message : "An unknown error occurred",
                })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // Validate code using local validation instead of API
    const validateCode = async () => {
        setIsValidating(true)

        try {
            // Use local validation instead of API
            const errors = validateSyntaxLocally(code, language)

            if (errors.length > 0) {
                setOutput(`Syntax validation found potential issues:\n\n${errors.join("\n")}`)

                toast.error("Validation found issues", {
                    description: "Check the output panel for details",
                })
            } else {
                setOutput("Basic syntax validation passed. Note: This is a simple check and may not catch all errors.")

                toast('Basic validation passed', {
                    description: "No obvious syntax errors detected",
                })
            }
        } catch (error) {
            console.error("Error validating code:", error)
            setOutput(`Validation Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`)

            toast.error('Error validating code', {
                description: error instanceof Error ? error.message : "An unknown error occurred",
            })
        } finally {
            setIsValidating(false)
        }
    }

    return (
        <div className="w-full max-w-6xl">
            <div className="flex flex-col gap-4">
                {showApiWarning && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>API Authentication Required</AlertTitle>
                        <AlertDescription>
                            The Judge0 API requires authentication for full functionality. This demo uses basic features only. For
                            production use, you would need to set up your own Judge0 instance or subscribe to the RapidAPI service.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-semibold">Language</h2>
                        <Select value={language.id.toString()} onValueChange={handleLanguageChange}>
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.id} value={lang.id.toString()}>
                                        {lang.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={validateCode} disabled={isValidating} className="gap-2">
                            {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Validate
                        </Button>
                        <Button onClick={runCode} disabled={isRunning} className="gap-2">
                            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            Run
                        </Button>
                        <Button variant="secondary" onClick={submitCode} disabled={isSubmitting} className="gap-2">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Submit
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="col-span-1 lg:col-span-2">
                        <CardHeader className="py-3">
                            <CardTitle>Code Editor</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 border-t">
                            <div className="h-[400px] w-full">
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
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle>Input</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Enter input for your program here..."
                                value={stdin}
                                onChange={(e) => setStdin(e.target.value)}
                                className="min-h-[150px] font-mono"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle>Output</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-black text-white p-4 rounded-md min-h-[150px] font-mono whitespace-pre-wrap overflow-auto">
                                {output || "Run your code to see output here..."}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
