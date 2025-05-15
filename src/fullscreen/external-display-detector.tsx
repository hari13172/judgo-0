"use client"

import { useState, useEffect, useRef } from "react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Monitor, MonitorX, Info } from "lucide-react"

interface ExternalDisplayDetectorProps {
    active: boolean
    onContinue: () => void
}

export function ExternalDisplayDetector({ active, onContinue }: ExternalDisplayDetectorProps) {
    const [hasExternalDisplay, setHasExternalDisplay] = useState(false)
    const [showWarning, setShowWarning] = useState(false)
    const [debugInfo, setDebugInfo] = useState<string>("")
    const [showDebugInfo, setShowDebugInfo] = useState(false)
    const checkAttempts = useRef(0)

    // Function to check for external displays with multiple methods
    const checkForExternalDisplays = () => {
        checkAttempts.current += 1
        const detectionMethods: { method: string; result: boolean; details: string }[] = []
        let externalDisplayDetected = false

        try {
            // Method 1: Check using screen.width vs window.innerWidth
            const screenWidth = window.screen.width
            const screenHeight = window.screen.height
            const innerWidth = window.innerWidth
            const innerHeight = window.innerHeight
            const widthRatio = screenWidth / innerWidth
            const heightRatio = screenHeight / innerHeight

            const method1Result = widthRatio > 1.5 || heightRatio > 1.5
            detectionMethods.push({
                method: "Screen vs Window Size",
                result: method1Result,
                details: `Screen: ${screenWidth}x${screenHeight}, Window: ${innerWidth}x${innerHeight}, Ratios: ${widthRatio.toFixed(2)}/${heightRatio.toFixed(2)}`,
            })

            if (method1Result) externalDisplayDetected = true

            // Method 2: Check using screen.availWidth vs window.innerWidth
            const availWidth = window.screen.availWidth
            const availHeight = window.screen.availHeight
            const availWidthRatio = availWidth / innerWidth
            const availHeightRatio = availHeight / innerHeight

            const method2Result = availWidthRatio > 1.5 || availHeightRatio > 1.5
            detectionMethods.push({
                method: "Available Screen vs Window",
                result: method2Result,
                details: `Available: ${availWidth}x${availHeight}, Ratios: ${availWidthRatio.toFixed(2)}/${availHeightRatio.toFixed(2)}`,
            })

            if (method2Result) externalDisplayDetected = true

            // Method 3: Check if screen.width is significantly different from screen.availWidth
            const widthDiff = Math.abs(screenWidth - availWidth)
            const heightDiff = Math.abs(screenHeight - availHeight)

            const method3Result = widthDiff > 200 || heightDiff > 200
            detectionMethods.push({
                method: "Screen vs Available Difference",
                result: method3Result,
                details: `Width diff: ${widthDiff}px, Height diff: ${heightDiff}px`,
            })

            if (method3Result) externalDisplayDetected = true

            // Method 4: Check using devicePixelRatio
            const pixelRatio = window.devicePixelRatio
            const method4Result = pixelRatio < 0.95 || pixelRatio > 1.05
            detectionMethods.push({
                method: "Device Pixel Ratio",
                result: method4Result,
                details: `Pixel ratio: ${pixelRatio}`,
            })

            if (method4Result) externalDisplayDetected = true

            // Method 5: Check if window.screen.isExtended is available (Chrome/Edge)
            if ("isExtended" in window.screen) {
                const isExtended = (window.screen as any).isExtended
                detectionMethods.push({
                    method: "screen.isExtended API",
                    result: isExtended,
                    details: `isExtended: ${isExtended}`,
                })

                if (isExtended) externalDisplayDetected = true
            } else {
                detectionMethods.push({
                    method: "screen.isExtended API",
                    result: false,
                    details: "API not available",
                })
            }

            // Method 6: Check using media queries
            if (window.matchMedia) {
                try {
                    const multipleScreens = window.matchMedia("(min-device-pixel-ratio: 0.9), (max-device-pixel-ratio: 1.1)")
                    detectionMethods.push({
                        method: "Media Query",
                        result: multipleScreens.matches,
                        details: `matches: ${multipleScreens.matches}`,
                    })

                    if (multipleScreens.matches) {
                        // Additional verification needed as this can give false positives
                        // Only count this if another method also detected an external display
                        if (externalDisplayDetected) {
                            externalDisplayDetected = true
                        }
                    }
                } catch (err) {
                    detectionMethods.push({
                        method: "Media Query",
                        result: false,
                        details: `Error: ${err}`,
                    })
                }
            }

            // Build debug info string
            const debugInfoText = detectionMethods
                .map((m) => `${m.method}: ${m.result ? "✓" : "✗"} - ${m.details}`)
                .join("\n")

            setDebugInfo(debugInfoText)

            // Update state based on detection
            setHasExternalDisplay(externalDisplayDetected)

            // Show warning if external display detected and component is active
            if (externalDisplayDetected && active) {
                setShowWarning(true)
            } else if (active) {
                // If no external display and component is active, continue
                setShowWarning(false)
                onContinue()
            }
        } catch (error) {
            console.error("Error detecting external displays:", error)
            setDebugInfo(`Error during detection: ${error}`)

            // If detection fails after multiple attempts, allow the user to continue
            if (checkAttempts.current > 2) {
                if (active) {
                    onContinue()
                }
            } else {
                // Try again after a short delay
                setTimeout(checkForExternalDisplays, 500)
            }
        }
    }

    // Check for external displays when component mounts and when active changes
    useEffect(() => {
        if (active) {
            // Reset attempts counter
            checkAttempts.current = 0

            // Initial check with a slight delay to ensure browser is ready
            const timer = setTimeout(() => {
                checkForExternalDisplays()
            }, 500)

            return () => clearTimeout(timer)
        }
    }, [active])

    // Handle retry - check again if external displays have been disconnected
    const handleRetry = () => {
        checkForExternalDisplays()
    }

    return (
        <AlertDialog open={showWarning && active} onOpenChange={setShowWarning}>
            <AlertDialogContent className="bg-[#1e1e2e] text-white border-gray-700 max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        External Display Detected
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                        <div className="flex flex-col items-center my-4">
                            <MonitorX className="h-16 w-16 text-red-500 mb-4" />
                            <p className="text-center mb-2">
                                We've detected that you have multiple displays connected to your device.
                            </p>
                            <p className="text-center font-medium text-red-400">
                                External displays are not allowed during the test for security reasons.
                            </p>
                        </div>
                        <div className="bg-[#2d2d3f] border border-gray-700 rounded-md p-3 my-3">
                            <p className="font-semibold text-white mb-2">Please follow these steps:</p>
                            <ol className="list-decimal pl-5 space-y-1 text-gray-300">
                                <li>Disconnect all external monitors from your device</li>
                                <li>Close any screen sharing or remote desktop applications</li>
                                <li>If using a laptop, close the lid if you're using an external display</li>
                                <li>Click "Check Again" after you've disconnected all external displays</li>
                            </ol>
                        </div>

                        {showDebugInfo && (
                            <div className="mt-4 bg-[#1a1a2a] border border-gray-800 rounded-md p-2">
                                <p className="text-xs font-mono text-gray-400 whitespace-pre-wrap">{debugInfo}</p>
                            </div>
                        )}

                        <p className="text-center text-sm text-gray-400 mt-4">
                            You cannot proceed with the test until all external displays are disconnected.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDebugInfo(!showDebugInfo)}
                        className="text-gray-400 hover:text-white"
                    >
                        <Info className="h-4 w-4 mr-1" />
                        {showDebugInfo ? "Hide Details" : "Show Details"}
                    </Button>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleRetry} className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Check Again
                        </Button>
                        {/* Add a force continue button for cases where detection might be wrong */}
                        <Button variant="default" onClick={onContinue}>
                            Continue Anyway
                        </Button>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
