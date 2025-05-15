"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Mic } from "lucide-react"

interface VoiceDetectionProps {
    active: boolean
    threshold?: number // dB threshold for noise detection
    onNoiseDetected?: (reason: string) => void // Callback for termination with reason
}

export function VoiceDetection({ active, threshold = -50, onNoiseDetected }: VoiceDetectionProps) {
    const [isMonitoring, setIsMonitoring] = useState(false)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const rafRef = useRef<number | null>(null)

    // Start audio monitoring
    const startMonitoring = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const audioContext = new AudioContext()
            audioContextRef.current = audioContext

            const source = audioContext.createMediaStreamSource(stream)
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 2048
            analyserRef.current = analyser

            source.connect(analyser)

            setIsMonitoring(true)
            monitorAudio()
        } catch (error) {
            console.error("Error accessing microphone:", error)
            toast.error("Microphone Access Denied", {
                description: "Please allow microphone access to proceed with the test.",
            })
            onNoiseDetected?.("Microphone access denied.")
        }
    }

    // Stop audio monitoring
    const stopMonitoring = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        setIsMonitoring(false)
    }

    // Monitor audio levels
    const monitorAudio = () => {
        if (!analyserRef.current) return

        const dataArray = new Float32Array(analyserRef.current.fftSize)
        analyserRef.current.getFloatTimeDomainData(dataArray)

        // Calculate RMS (Root Mean Square) to estimate volume
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i]
        }
        const rms = Math.sqrt(sum / dataArray.length)

        // Convert RMS to dB
        const db = 20 * Math.log10(rms + 0.00001) // Avoid log(0)

        // Check if noise exceeds threshold
        if (db > threshold) {
            console.log(`Noise detected: ${db.toFixed(2)} dB`)
            toast.warning("Background Noise Detected", {
                description: "Excessive noise detected. Test will be terminated.",
            })
            onNoiseDetected?.("Excessive background noise detected.")
            stopMonitoring() // Stop monitoring after detection
            return // Exit to prevent multiple triggers
        }

        // Continue monitoring
        rafRef.current = requestAnimationFrame(monitorAudio)
    }

    useEffect(() => {
        if (active) {
            startMonitoring()
        } else {
            stopMonitoring()
        }

        return () => {
            stopMonitoring()
        }
    }, [active])

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {isMonitoring && (
                <div className="flex items-center gap-2 bg-[#2d2d3f] text-white px-3 py-2 rounded-md shadow-lg">
                    <Mic className="h-4 w-4 text-purple-400 animate-pulse" />
                    <span className="text-sm">Monitoring audio...</span>
                </div>
            )}
        </div>
    )
}