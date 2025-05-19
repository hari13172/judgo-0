"use client"

interface TerminalOutputProps {
    output: string
    stdin: string
    language: {
        name: string
        extension: string
    }
}

export function TerminalOutput({ output, stdin, language }: TerminalOutputProps) {
    return (
        <div className="bg-black p-3 h-full overflow-y-auto font-mono">
            {output ? (
                <div className="text-sm text-gray-300">
                    <div className="text-green-500">
                        <span className="text-blue-400">BloomSkill@</span>
                        <span className="text-red-400">tech</span>
                        <span className="text-white">:~$ </span>
                        {stdin
                            ? `${language.name.includes("Python") ? "python" : language.name.includes("JavaScript") ? "node" : language.name.includes("Java") ? "java" : "cpp"} script.${language.extension === "python" ? "py" : language.extension === "javascript" ? "js" : language.extension === "java" ? "java" : "cpp"} ${stdin}`
                            : `${language.name.includes("Python") ? "python" : language.name.includes("JavaScript") ? "node" : language.name.includes("Java") ? "java" : "cpp"} script.${language.extension === "python " ? "py" : language.extension === "javascript" ? "js" : language.extension === "java" ? "java" : "cpp"}`}
                    </div>
                    <pre className="whitespace-pre-wrap">{output}</pre>
                    <div className="text-green-500 mt-2">
                        <span className="text-blue-400">BloomSkill@</span>
                        <span className="text-red-400">tech</span>
                        <span className="text-white">:~$ </span>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-gray-500">
                    <div className="text-green-500">
                        <span className="text-blue-400">BloomSkill@</span>
                        <span className="text-red-400">tech</span>
                        <span className="text-white">:~$ </span>
                    </div>
                    <p>Run your code to see output here...</p>
                </div>
            )}
        </div>
    )
}