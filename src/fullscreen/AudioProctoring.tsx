"use client";

import React, { useRef, useEffect, useState } from "react";
import { toast } from "sonner";

interface AudioProctoringProps {
    active: boolean;
    stream: MediaStream | null; // Pass the MediaStream from Proctoring
}

const AudioProctoring: React.FC<AudioProctoringProps> = ({ active, stream }) => {
    const [isAudioProctoring, setIsAudioProctoring] = useState<boolean>(false);
    const [audioViolationCount, setAudioViolationCount] = useState<number>(0);
    const [lastAudioWarning, setLastAudioWarning] = useState<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const WARNING_INTERVAL: number = 5000; // Minimum 5 seconds between warnings
    const AUDIO_THRESHOLD: number = 50; // Adjust this threshold based on testing (0-255)

    // Initialize audio context and analyser
    useEffect(() => {
        if (!active || !stream) {
            console.log("[AudioProctoring] Inactive or no stream, skipping setup.");
            return;
        }

        const setupAudioProctoring = async () => {
            console.log("[AudioProctoring] Setting up...");
            try {
                const audioContext = new AudioContext();
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                audioContextRef.current = audioContext;
                analyserRef.current = analyser;
                console.log("[AudioProctoring] Audio context and analyser set up.");
                setIsAudioProctoring(true);
            } catch (err: unknown) {
                const error = err as Error;
                console.error("[AudioProctoring] Setup failed:", error.message);
                toast.error("Audio Proctoring Setup Failed", {
                    description: "Unable to access microphone. Please allow access.",
                });
            }
        };

        setupAudioProctoring();

        return () => {
            console.log("[AudioProctoring] Cleaning up...");
            if (audioContextRef.current) {
                audioContextRef.current.close();
                console.log("[AudioProctoring] Audio context closed.");
            }
            setIsAudioProctoring(false);
        };
    }, [active, stream]);

    // Audio detection using Web Audio API (loudness detection)
    useEffect(() => {
        if (!isAudioProctoring || !active || !analyserRef.current) {
            console.log(
                "[AudioProctoring] Audio detection skipped: isAudioProctoring =",
                isAudioProctoring,
                "active =",
                active,
                "analyser =",
                analyserRef.current
            );
            return;
        }

        let isMounted = true;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const detectAudio = () => {
            if (!isMounted || !analyserRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

            const currentTime = Date.now();
            if (average > AUDIO_THRESHOLD) {
                setAudioViolationCount((prev) => {
                    const newCount = prev + 1;
                    console.log(`[AudioProctoring] Audio violation count: ${newCount}`);
                    if (currentTime - lastAudioWarning >= WARNING_INTERVAL) {
                        toast.warning(`Audio detected (${newCount})`, {
                            description: "Please avoid making noise during the test.",
                        });
                        setLastAudioWarning(currentTime);
                    }
                    return newCount;
                });
            }

            requestAnimationFrame(detectAudio);
        };

        console.log("[AudioProctoring] Starting audio detection loop...");
        detectAudio();

        return () => {
            isMounted = false;
            console.log("[AudioProctoring] Audio detection loop stopped.");
        };
    }, [isAudioProctoring, active, lastAudioWarning]);

    return null; // This component doesn't render anything in the UI
};

export default AudioProctoring;