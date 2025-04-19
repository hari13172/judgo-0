export interface TestCase {
    id: number
    arguments: string
    expectedOutput: string
    isHidden?: boolean
    isLocked?: boolean
  }
  
  export interface Problem {
    id: string
    title: string
    description: string
    difficulty: "Easy" | "Medium" | "Hard"
    constraints: string[]
    cliExplanation: string
    stdoutExplanation: string
    examples: { input: string; output: string }[]
    testCases: TestCase[]
    starterCode: {
      [key: number]: string // language_id -> starter code
    }
    tags: string[]
  }
  