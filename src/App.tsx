"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { ProblemList } from "./pages/ProblemList"
import CodeEditorApp from "./pages/Code-Editor"
import { AlertCircle } from "lucide-react"

interface Example {
  input: string
  output: string | boolean
}

interface Problem {
  id: number
  title: string
  description: string
  difficulty: string
  tags: string[]
  examples: Example[]
  constraints: string[]
  cliExplanation: string
  stdoutExplanation: string
  testCases: any[]
  starterCode: any
}

function App() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("http://10.5.0.21:5000/problems")
        if (!response.ok) throw new Error(`Error fetching problems: ${response.status}`)

        const data = await response.json()
        setProblems(data.problems)  // 👈 very important: problems inside `data.problems`
      } catch (err) {
        console.error("Failed to fetch problems:", err)
        setError("Failed to load problems. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchProblems()
  }, [])

  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem)
  }

  const handleBackToList = () => {
    setSelectedProblem(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading Problems...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1e1e2e] text-white p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="text-center text-gray-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#1e1e2e] text-white">
      {selectedProblem ? (
        <div className="h-full">
          <div className="p-4 bg-[#2d2d3f] border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">{selectedProblem.title}</h1>
              <Button variant="outline" onClick={handleBackToList} className="text-sm">
                Back to Problem List
              </Button>
            </div>
          </div>
          <div className="h-[calc(100%-64px)]">
            <CodeEditorApp selectedProblem={selectedProblem} />
          </div>
        </div>
      ) : (
        <ProblemList problems={problems} onSelectProblem={handleSelectProblem} />
      )}
    </div>
  )
}

export default App
