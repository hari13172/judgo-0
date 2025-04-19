"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

interface LanguageOption {
    id: number;           // Judge0 language_id
    name: string;          // Dropdown visible name
    editorLang: string;    // Monaco Editor language
}

const languageOptions: LanguageOption[] = [
    { id: 63, name: "JavaScript", editorLang: "javascript" },
    { id: 71, name: "Python", editorLang: "python" },
    { id: 50, name: "C", editorLang: "c" },
    { id: 54, name: "C++", editorLang: "cpp" },
    { id: 62, name: "Java", editorLang: "java" },
    { id: 78, name: "Kotlin", editorLang: "kotlin" },
    { id: 82, name: "PHP", editorLang: "php" },
    { id: 86, name: "Rust", editorLang: "rust" },
    { id: 93, name: "TypeScript", editorLang: "typescript" },
];

export default function CodeEditor() {
    const [code, setCode] = useState<string>("");
    const [languageId, setLanguageId] = useState<number>(63); // Default JavaScript (Judge0 ID)
    const [editorLanguage, setEditorLanguage] = useState<string>("javascript"); // Monaco Editor Language
    const [output, setOutput] = useState<string>("");

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = Number(event.target.value);
        const selectedLang = languageOptions.find((lang) => lang.id === selectedId);

        if (selectedLang) {
            setLanguageId(selectedLang.id);
            setEditorLanguage(selectedLang.editorLang);
        }
    };

    const handleSubmit = async () => {
        setOutput("Running...");

        try {
            // Step 1: Submit Code
            const submissionRes = await axios.post(
                "http://10.5.0.250:2358/submissions?base64_encoded=false",
                {
                    source_code: code,
                    language_id: languageId,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const token = submissionRes.data.token;
            if (!token) {
                setOutput("Failed to submit code: No token received.");
                return;
            }

            // Step 2: Fetch Result by Token
            let status = "In Queue";
            let result: any = null;
            while (status === "In Queue" || status === "Processing") {
                const resultRes = await axios.get(
                    `http://10.5.0.250:2358/submissions/${token}?base64_encoded=false`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                result = resultRes.data;
                status = result.status?.description || "";

                if (status === "In Queue" || status === "Processing") {
                    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s
                }
            }

            const { stdout, stderr, compile_output, message } = result;
            setOutput(stdout || stderr || compile_output || message || "No output.");
        } catch (error: any) {
            console.error(error);
            setOutput("Error connecting to Judge0 API. Make sure server is reachable.");
        }
    };

    return (
        <div className="flex flex-col h-screen p-4 gap-4 bg-black text-white">
            {/* Language Selector */}
            <div className="flex items-center gap-4">
                <select
                    className="text-black p-2 rounded"
                    value={languageId}
                    onChange={handleLanguageChange}
                >
                    {languageOptions.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                            {lang.name}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleSubmit}
                    className="bg-green-600 hover:bg-green-700 p-2 px-6 rounded text-white"
                >
                    Run Code
                </button>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 bg-gray-800 rounded overflow-hidden">
                <Editor
                    height="100%"
                    theme="vs-dark" // Monokai alternative
                    language={editorLanguage}
                    value={code}
                    onChange={(value) => setCode(value || "")}
                />
            </div>

            {/* Output */}
            <div className="bg-gray-900 p-4 rounded h-48 overflow-auto">
                <h2 className="text-lg font-bold mb-2">Output:</h2>
                <pre>{output}</pre>
            </div>
        </div>
    );
}
