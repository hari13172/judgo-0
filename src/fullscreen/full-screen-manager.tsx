"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface FullScreenManagerProps {
    active: boolean
    onExit: () => void
    children: React.ReactNode
}

export function FullScreenManager({ active, onExit, children }: FullScreenManagerProps) {
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [showWarning, setShowWarning] = useState(false)
    const [exitCount, setExitCount] = useState(0)
    const [exitCountdownActive, setExitCountdownActive] = useState(false)
    const [exitCountdown, setExitCountdown] = useState(10)
    const [terminationReason, setTerminationReason] = useState<string | null>(null)

    // Reference to store the devtools detection interval
    const devToolsCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const displayCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Track blocked key attempts for showing warnings
    const blockedKeyAttemptsRef = useRef(0)

    // Request full screen
    const enterFullScreen = async () => {
        try {
            const docEl = document.documentElement
            if (docEl.requestFullscreen) {
                await docEl.requestFullscreen()
            } else if ((docEl as any).mozRequestFullScreen) {
                await (docEl as any).mozRequestFullScreen()
            } else if ((docEl as any).webkitRequestFullscreen) {
                await (docEl as any).webkitRequestFullscreen()
            } else if ((docEl as any).msRequestFullscreen) {
                await (docEl as any).msRequestFullscreen()
            }
            setIsFullScreen(true)
        } catch (error) {
            console.error("Failed to enter full screen:", error)
        }
    }

    // Exit full screen
    const exitFullScreen = async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen()
            } else if ((document as any).mozCancelFullScreen) {
                await (document as any).mozCancelFullScreen()
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen()
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen()
            }
            setIsFullScreen(false)
        } catch (error) {
            console.error("Failed to exit full screen:", error)
        }
    }

    // Check if currently in full screen
    const checkFullScreen = (): boolean => {
        return !!(
            document.fullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).msFullscreenElement
        )
    }

    // Handle full screen change
    const handleFullScreenChange = () => {
        const fullScreenActive = checkFullScreen()
        setIsFullScreen(fullScreenActive)

        // If we should be in full screen but aren't, show warning
        if (active && !fullScreenActive) {
            handleFullScreenExit()
        }
    }

    // Handle when user exits full screen
    const handleFullScreenExit = () => {
        // Increment exit attempt counter
        const newExitCount = exitCount + 1
        setExitCount(newExitCount)

        if (newExitCount >= 3) {
            // After 3 attempts, terminate the test
            terminateTest("You exited full screen mode multiple times.")
        } else {
            // Show warning and try to re-enter full screen
            setShowWarning(true)
        }
    }

    // Handle when user confirms to continue in full screen
    const handleContinue = async () => {
        setShowWarning(false)
        if (exitCountdownActive) {
            setExitCountdownActive(false)
            setExitCountdown(10)
        }
        await enterFullScreen()
    }

    // Terminate the test with a specific reason
    const terminateTest = (reason: string) => {
        setTerminationReason(reason)
        // Clean up state
        setShowWarning(false)
        setExitCountdownActive(false)
        // Call the exit handler
        onExit()
    }

    // Show a warning toast when blocked keys are pressed
    const showBlockedKeyWarning = () => {
        blockedKeyAttemptsRef.current += 1

        // Show different messages based on number of attempts
        if (blockedKeyAttemptsRef.current <= 3) {
            toast.warning("This action is not allowed during the test", {
                description: "Developer tools access is restricted in secure test mode.",
                duration: 3000,
            })
        } else if (blockedKeyAttemptsRef.current <= 5) {
            toast.error("Multiple attempts to access developer tools detected", {
                description: "Further attempts may result in test termination.",
                duration: 4000,
            })
        } else {
            toast.error("Final warning: Developer tools access is prohibited", {
                description: "Your test will be terminated if developer tools are opened.",
                duration: 5000,
            })
        }
    }

    // Function to detect if DevTools is open
    const detectDevTools = () => {
        const threshold = 160 // DevTools usually changes window size

        // Method 1: Check window dimensions
        const widthThreshold = window.outerWidth - window.innerWidth > threshold
        const heightThreshold = window.outerHeight - window.innerHeight > threshold

        // Method 2: Check console output (this works in some browsers)
        let isDevToolsOpen = false
        const element = document.createElement("div")
        Object.defineProperty(element, "id", {
            get: () => {
                isDevToolsOpen = true
                return "id"
            },
        })
        console.log(element)
        console.clear()

        if (widthThreshold || heightThreshold || isDevToolsOpen) {
            terminateTest("Developer tools were opened during the test.")

            // Trigger debugger mode to make it difficult to use DevTools
            setInterval(() => {
                debugger
            }, 50)
        }
    }

    // Function to check for external displays during the test
    const checkForExternalDisplays = () => {
        try {
            // Use more reliable methods to detect multiple displays
            let externalDisplayDetected = false

            // Method 1: Use window.screen.isExtended if available (Chrome/Edge)
            if ("isExtended" in window.screen) {
                externalDisplayDetected = (window.screen as any).isExtended
            }
            // Method 2: Check if there are multiple screens using matchMedia
            else if (window.matchMedia) {
                // This checks for multiple screens in a more reliable way
                const multipleScreens = window.matchMedia("(min-device-pixel-ratio: 0.98), (max-device-pixel-ratio: 1.02)")
                if (multipleScreens && multipleScreens.matches) {
                    // Further verify by checking screen dimensions
                    const screenWidth = window.screen.width
                    const screenHeight = window.screen.height
                    const availWidth = window.screen.availWidth
                    const availHeight = window.screen.availHeight

                    // If available dimensions are significantly different from screen dimensions
                    // and not just due to taskbar/dock
                    const widthDiff = Math.abs(screenWidth - availWidth)
                    const heightDiff = Math.abs(screenHeight - availHeight)

                    // Only consider it an external display if the difference is very large
                    // (normal taskbar/dock differences are usually < 100px)
                    if (widthDiff > 300 || heightDiff > 300) {
                        externalDisplayDetected = true
                    }
                }
            }

            // Fallback method - only use if we're pretty confident
            if (!externalDisplayDetected) {
                // Check if window dimensions are suspiciously different from screen dimensions
                // This happens when content is displayed across multiple screens
                const windowWidth = window.innerWidth
                const screenWidth = window.screen.width

                // Only flag as external display if there's a very large difference
                // (more than double the size suggests multiple monitors)
                if (screenWidth > windowWidth * 2) {
                    externalDisplayDetected = true
                }
            }

            if (externalDisplayDetected && active) {
                terminateTest("External display detected during the test. This is not allowed for security reasons.")
            }
        } catch (error) {
            console.error("Error checking for external displays:", error)
            // Don't terminate on detection errors
        }
    }

    // Effect to manage full screen state
    useEffect(() => {
        if (active && !isFullScreen) {
            enterFullScreen()
        } else if (!active && isFullScreen) {
            exitFullScreen()
        }

        // Add event listeners for full screen change
        document.addEventListener("fullscreenchange", handleFullScreenChange)
        document.addEventListener("mozfullscreenchange", handleFullScreenChange)
        document.addEventListener("webkitfullscreenchange", handleFullScreenChange)
        document.addEventListener("MSFullscreenChange", handleFullScreenChange)

        return () => {
            // Clean up event listeners
            document.removeEventListener("fullscreenchange", handleFullScreenChange)
            document.removeEventListener("mozfullscreenchange", handleFullScreenChange)
            document.removeEventListener("webkitfullscreenchange", handleFullScreenChange)
            document.removeEventListener("MSFullscreenChange", handleFullScreenChange)
        }
    }, [active, isFullScreen])

    // Effect to prevent tab switching using keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!active) return

            // Prevent Alt+Tab, Alt+F4, Ctrl+W, etc. - TERMINATE
            if ((e.altKey && (e.key === "Tab" || e.key === "F4")) || (e.ctrlKey && (e.key === "w" || e.key === "W"))) {
                e.preventDefault()
                terminateTest("You attempted to use keyboard shortcuts to switch tabs or close the window.")
            }

            // Block Escape key (prevents exiting full screen) - DON'T TERMINATE, JUST BLOCK
            if (e.key === "Escape") {
                e.preventDefault()
                showBlockedKeyWarning()
                return
            }

            // Block F12 key (DevTools) - DON'T TERMINATE, JUST BLOCK
            if (e.key === "F12") {
                e.preventDefault()
                showBlockedKeyWarning()
                return
            }

            // Block Ctrl+Shift+I (DevTools) - DON'T TERMINATE, JUST BLOCK
            if (e.ctrlKey && e.shiftKey && (e.key === "i" || e.key === "I")) {
                e.preventDefault()
                showBlockedKeyWarning()
                return
            }

            // Block Ctrl+Shift+J (DevTools Console) - DON'T TERMINATE, JUST BLOCK
            if (e.ctrlKey && e.shiftKey && (e.key === "j" || e.key === "J")) {
                e.preventDefault()
                showBlockedKeyWarning()
                return
            }

            // Block Ctrl+Shift+C (DevTools Elements) - DON'T TERMINATE, JUST BLOCK
            if (e.ctrlKey && e.shiftKey && (e.key === "c" || e.key === "C")) {
                e.preventDefault()
                showBlockedKeyWarning()
                return
            }
        }

        window.addEventListener("keydown", handleKeyDown, { capture: true })
        return () => window.removeEventListener("keydown", handleKeyDown, { capture: true })
    }, [active, isFullScreen])

    // Effect to detect browser visibility changes - IMMEDIATE TERMINATION
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (active && document.visibilityState === "hidden") {
                // User switched tabs or minimized window - IMMEDIATE TERMINATION
                terminateTest("You switched to another tab or minimized the window.")
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
    }, [active])

    // Effect to detect window blur - IMMEDIATE TERMINATION
    useEffect(() => {
        const handleWindowBlur = () => {
            if (active) {
                // User clicked outside the browser window - IMMEDIATE TERMINATION
                terminateTest("You switched focus away from the test window.")
            }
        }

        window.addEventListener("blur", handleWindowBlur)
        return () => window.removeEventListener("blur", handleWindowBlur)
    }, [active])

    // Effect to block right-click context menu
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            if (active) {
                e.preventDefault()
                showBlockedKeyWarning()
                return false
            }
        }

        document.addEventListener("contextmenu", handleContextMenu)
        return () => document.removeEventListener("contextmenu", handleContextMenu)
    }, [active])

    // Effect to detect DevTools opening and external displays
    useEffect(() => {
        if (active) {
            // Start checking for DevTools
            devToolsCheckIntervalRef.current = setInterval(detectDevTools, 1000)

            // Start checking for external displays
            displayCheckIntervalRef.current = setInterval(checkForExternalDisplays, 5000)

            // Add a debugger trap that makes it difficult to use DevTools if opened
            const debuggerScript = document.createElement("script")
            debuggerScript.textContent = `
        (function() {
          // This creates a trap that makes it difficult to use DevTools
          function devToolsChecker() {
            if (window.outerHeight - window.innerHeight > 100 || 
                window.outerWidth - window.innerWidth > 100) {
              debugger;
              setTimeout(devToolsChecker, 50);
            } else {
              setTimeout(devToolsChecker, 500);
            }
          }
          devToolsChecker();
        })();
      `
            document.head.appendChild(debuggerScript)

            // Also check when window is resized (might indicate display changes)
            window.addEventListener("resize", checkForExternalDisplays)
        }

        return () => {
            // Clean up the intervals when component unmounts
            if (devToolsCheckIntervalRef.current) {
                clearInterval(devToolsCheckIntervalRef.current)
            }
            if (displayCheckIntervalRef.current) {
                clearInterval(displayCheckIntervalRef.current)
            }
            window.removeEventListener("resize", checkForExternalDisplays)
        }
    }, [active])

    return (
        <>
            {children}

            <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
                <AlertDialogContent className="bg-[#1e1e2e] text-white border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Warning: Full Screen Mode Required
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                            <p className="mb-2">You have exited full screen mode. This is attempt {exitCount} of 3.</p>
                            <p>
                                Please return to full screen mode to continue with your test. Exiting full screen mode is not allowed
                                during the test.
                            </p>
                            <p className="mt-2 text-red-400 font-semibold">
                                Warning: Switching tabs, minimizing the window, or using developer tools will immediately terminate your
                                test.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex items-center justify-between">
                        <Button variant="destructive" onClick={() => terminateTest("You chose to end the test.")}>
                            End Test
                        </Button>
                        <Button onClick={handleContinue} className="ml-auto">
                            Return to Full Screen
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
