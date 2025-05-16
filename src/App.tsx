"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ProblemList } from "./pages/ProblemList";
import CodeEditorApp from "./pages/Code-Editor";
import { AlertCircle, Monitor } from "lucide-react";
import { FullScreenManager } from "./fullscreen/full-screen-manager";
import { SecureModeNotification } from "./fullscreen/secure-mode-notification";
import { ExternalDisplayDetector } from "./fullscreen/external-display-detector";
import Proctoring from "./fullscreen/Proctoring";
import { Toaster } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Example {
  input: string;
  output: string | boolean;
}

interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  examples: Example[];
  constraints: string[];
  cliExplanation: string;
  stdoutExplanation: string;
  testCases: any[];
  starterCode: any;
}

function App() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testTerminated, setTestTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState<string>("Your test has been terminated.");
  const [displayCheckPassed, setDisplayCheckPassed] = useState(false);
  const [showProblemContent, setShowProblemContent] = useState(false);
  const [checkingDisplays, setCheckingDisplays] = useState(false);
  const [isReadyForFullScreen, setIsReadyForFullScreen] = useState(false);

  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("http://10.5.0.21:5000/problems");
        if (!response.ok) throw new Error(`Error fetching problems: ${response.status}`);

        const data = await response.json();
        setProblems(data.problems);
      } catch (err) {
        console.error("[App] Failed to fetch problems:", err);
        setError("Failed to load problems. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, []);

  const handleSelectProblem = (problem: Problem) => {
    console.log("[App] Problem selected:", problem.title);
    setSelectedProblem(problem);
    setCheckingDisplays(true);
    setDisplayCheckPassed(false);
    setShowProblemContent(false);
    setIsReadyForFullScreen(false);
  };

  const handleDisplayCheckPassed = () => {
    console.log("[App] Display check passed, waiting for user to start test...");
    setDisplayCheckPassed(true);
    setCheckingDisplays(false);
  };

  const handleStartTest = () => {
    console.log("[App] User started the test, setting up fullscreen...");
    setShowProblemContent(true);
    setIsReadyForFullScreen(true);
  };

  // Ensure fullscreen is triggered after DOM updates
  useEffect(() => {
    if (showProblemContent && isReadyForFullScreen) {
      console.log("[App] ShowProblemContent and isReadyForFullScreen are true, expecting fullscreen...");
    }
  }, [showProblemContent, isReadyForFullScreen]);

  const handleBackToList = () => {
    console.log("[App] Back to problem list, stopping proctoring and exiting fullscreen...");
    setSelectedProblem(null);
    setShowProblemContent(false);
    setDisplayCheckPassed(false);
    setCheckingDisplays(false);
    setIsReadyForFullScreen(false);
  };

  const handleTestTermination = (reason?: string) => {
    console.log("[App] Test terminated, stopping proctoring...");
    setTerminationReason(reason || "Your test has been terminated due to exiting fullscreen mode.");
    setTestTerminated(true);
    setSelectedProblem(null);
    setShowProblemContent(false); // This sets active to false for Proctoring
    setDisplayCheckPassed(false);
    setCheckingDisplays(false);
    setIsReadyForFullScreen(false);
  };

  const handleCloseTerminationDialog = () => {
    console.log("[App] Termination dialog closed.");
    setTestTerminated(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-white">Loading Problems...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1e1e2e] text-white p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="text-center text-gray-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#1e1e2e] text-white">
      <Toaster position="top-right" richColors />
      {checkingDisplays && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1e1e2e] p-6 rounded-lg shadow-lg max-w-md text-center">
            <Monitor className="h-12 w-12 text-purple-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-bold mb-2">Checking Display Configuration</h2>
            <p className="text-gray-300 mb-4">Please wait while we verify your display setup for test security...</p>
            <ExternalDisplayDetector active={true} onContinue={handleDisplayCheckPassed} />
          </div>
        </div>
      )}

      {displayCheckPassed && !showProblemContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1e1e2e] p-6 rounded-lg shadow-lg max-w-md text-center">
            <h2 className="text-xl font-bold mb-2">Ready to Start Test</h2>
            <p className="text-gray-300 mb-4">Click the button below to start your test in fullscreen mode.</p>
            <Button onClick={handleStartTest} className="bg-purple-500 hover:bg-purple-600">
              Start Test
            </Button>
          </div>
        </div>
      )}

      <FullScreenManager active={isReadyForFullScreen} onExit={handleTestTermination}>
        {showProblemContent && selectedProblem ? (
          <div className="h-full relative">
            <SecureModeNotification active={showProblemContent} />
            <Proctoring active={showProblemContent} onTestTermination={handleTestTermination} />
            <div className="p-4 bg-[#2d2d3f] border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">{selectedProblem.title}</h1>
                <Button variant="outline" onClick={handleBackToList} className="text-sm">
                  Back to Problem List
                </Button>
              </div>
            </div>
            <div className="h-[calc(100%-64px)]">
              <CodeEditorApp />
            </div>
          </div>
        ) : (
          <ProblemList problems={problems} onSelectProblem={handleSelectProblem} />
        )}
      </FullScreenManager>

      <AlertDialog open={testTerminated} onOpenChange={handleCloseTerminationDialog}>
        <AlertDialogContent className="bg-[#1e1e2e] text-white border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Test Terminated
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              <p className="mb-2">{terminationReason}</p>
              <p>
                This is considered a violation of the test rules. If you believe this was in error, please contact your
                administrator.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseTerminationDialog}>Return to Problem List</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;