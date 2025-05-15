"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as faceDetection from "@tensorflow-models/face-detection";
import { toast } from "sonner";
import AudioProctoring from "./AudioProctoring"; // Import the new component

// Define types for TensorFlow.js face detection results
interface Face {
    box: {
        xMin: number;
        yMin: number;
        width: number;
        height: number;
    };
    confidence?: number;
    keypoints: { x: number; y: number; name?: string }[];
}

// Define props interface (removed onViolation)
interface ProctoringProps {
    active: boolean;
}

const Proctoring: React.FC<ProctoringProps> = ({ active }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isProctoring, setIsProctoring] = useState<boolean>(false);
    const [noFaceCount, setNoFaceCount] = useState<number>(0);
    const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
    const [stream, setStream] = useState<MediaStream | null>(null); // Store the stream to pass to AudioProctoring
    const [detector, setDetector] = useState<faceDetection.FaceDetector | null>(null);
    const [lastNoFaceWarning, setLastNoFaceWarning] = useState<number>(0);
    const [lastMultipleFacesWarning, setLastMultipleFacesWarning] = useState<number>(0);
    const [lastTabSwitchWarning, setLastTabSwitchWarning] = useState<number>(0);
    const NO_FACE_TIMEOUT: number = 5000; // 5 seconds
    const WARNING_INTERVAL: number = 5000; // Minimum 5 seconds between same-type warnings

    // Initialize webcam and TensorFlow.js
    useEffect(() => {
        if (!active) {
            console.log("[Proctoring] Inactive, skipping setup.");
            return;
        }

        const setupProctoring = async () => {
            console.log("[Proctoring] Setting up...");
            try {
                // Set WebGL backend
                await tf.setBackend("webgl");
                console.log("[Proctoring] TensorFlow.js backend:", tf.getBackend());

                // Load face detection model using MediaPipeFaceDetector
                const detectorConfig: faceDetection.MediaPipeFaceDetectorTfjsModelConfig = {
                    runtime: "tfjs",
                    detectorModelUrl: undefined, // Use default model URL
                    maxFaces: 2,
                };
                const loadedDetector = await faceDetection.createDetector(
                    faceDetection.SupportedModels.MediaPipeFaceDetector,
                    detectorConfig
                );
                setDetector(loadedDetector);
                console.log("[Proctoring] Face detection model loaded.");

                // Request webcam access (include audio for AudioProctoring)
                const mediaStream: MediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true, // Include audio for AudioProctoring
                });
                console.log("[Proctoring] Webcam stream obtained:", mediaStream);
                setStream(mediaStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.onloadedmetadata = () => {
                        console.log("[Proctoring] Video metadata loaded, starting playback...");
                        videoRef.current!.play()
                            .then(() => {
                                console.log("[Proctoring] Video playback started.");
                                setIsProctoring(true);
                            })
                            .catch((err: Error) => {
                                console.error("[Proctoring] Error starting video playback:", err);
                                toast.error("Video Playback Failed", {
                                    description: "Unable to start webcam video.",
                                });
                            });
                    };
                }
            } catch (err: unknown) {
                const error = err as Error;
                console.error("[Proctoring] Setup failed:", error.message);
                toast.error("Proctoring Setup Failed", {
                    description: "Unable to access webcam or microphone. Please allow access.",
                });
            }
        };

        setupProctoring();

        return () => {
            console.log("[Proctoring] Cleaning up...");
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                const tracks = stream.getTracks();
                tracks.forEach((track) => track.stop());
                console.log("[Proctoring] Webcam stream stopped.");
            }
            setStream(null);
            setDetector(null);
            setIsProctoring(false);
        };
    }, [active]);

    // Process faces with proper typing
    const processFaces = useCallback(
        (faces: Face[], lastNoFaceTime: number | null, setLastNoFaceTime: (time: number | null) => void) => {
            const currentTime = Date.now();

            if (faces.length === 0) {
                console.log("[Proctoring] No face detected at:", new Date().toISOString());
                if (!lastNoFaceTime) {
                    setLastNoFaceTime(currentTime);
                } else if (currentTime - lastNoFaceTime >= NO_FACE_TIMEOUT) {
                    setNoFaceCount((prev) => {
                        const newCount = prev + 1;
                        console.log(`[Proctoring] No face violation count: ${newCount}`);
                        if (currentTime - lastNoFaceWarning >= WARNING_INTERVAL) {
                            toast.warning(`No face detected (${newCount})`, {
                                description: "Please stay in the camera view.",
                            });
                            setLastNoFaceWarning(currentTime);
                        }
                        return newCount;
                    });
                }
            } else if (faces.length > 1) {
                console.log("[Proctoring] Multiple faces detected:", faces);
                setNoFaceCount((prev) => {
                    const newCount = prev + 1;
                    console.log(`[Proctoring] Multiple faces violation count: ${newCount}`);
                    if (currentTime - lastMultipleFacesWarning >= WARNING_INTERVAL) {
                        toast.warning(`Multiple faces detected (${newCount})`, {
                            description: "Only one person is allowed during the test.",
                        });
                        setLastMultipleFacesWarning(currentTime);
                    }
                    return newCount;
                });
                setLastNoFaceTime(null);
            } else {
                setNoFaceCount(0);
                setLastNoFaceTime(null);
                console.log("[Proctoring] Single face detected, counters reset.");
            }
        },
        [lastNoFaceWarning, lastMultipleFacesWarning]
    );

    // Run face detection
    useEffect(() => {
        if (!isProctoring || !active || !detector) {
            console.log(
                "[Proctoring] Face detection skipped: isProctoring =",
                isProctoring,
                "active =",
                active,
                "detector =",
                detector
            );
            return;
        }

        let lastNoFaceTime: number | null = null;
        let isMounted = true;

        const detectFaces = async () => {
            if (!isMounted || !videoRef.current || videoRef.current.readyState !== 4) {
                console.log("[Proctoring] Video not ready, retrying:", videoRef.current?.readyState);
                setTimeout(detectFaces, 1000);
                return;
            }

            try {
                const faces: Face[] = await detector.estimateFaces(videoRef.current, {
                    flipHorizontal: false,
                });
                console.log("[Proctoring] Faces detected:", faces);
                processFaces(faces, lastNoFaceTime, (newTime) => (lastNoFaceTime = newTime));
            } catch (err: unknown) {
                const error = err as Error;
                console.error("[Proctoring] Face detection error:", error.message);
            }

            if (isMounted) {
                setTimeout(detectFaces, 1000);
            }
        };

        console.log("[Proctoring] Starting face detection loop...");
        detectFaces();

        return () => {
            isMounted = false;
            console.log("[Proctoring] Face detection loop stopped.");
        };
    }, [isProctoring, active, detector, processFaces]);

    // Detect tab/window switching
    useEffect(() => {
        if (!active) {
            console.log("[Proctoring] Tab switch detection skipped: active =", active);
            return;
        }

        const handleBlur = () => {
            console.log("[Proctoring] Tab switch detected at:", new Date().toISOString());
            setTabSwitchCount((prev) => {
                const newCount = prev + 1;
                console.log(`[Proctoring] Tab switch violation count: ${newCount}`);
                const currentTime = Date.now();
                if (currentTime - lastTabSwitchWarning >= WARNING_INTERVAL) {
                    toast.warning(`Tab switch detected (${newCount})`, {
                        description: "Switching tabs is not allowed during the test.",
                    });
                    setLastTabSwitchWarning(currentTime);
                }
                return newCount;
            });
        };

        window.addEventListener("blur", handleBlur);
        console.log("[Proctoring] Tab switch event listener added.");
        return () => {
            window.removeEventListener("blur", handleBlur);
            console.log("[Proctoring] Tab switch event listener removed.");
        };
    }, [active, lastTabSwitchWarning]);

    if (!active) return null;

    return (
        <div className="fixed top-4 right-4 z-50 bg-[#2d2d3f] p-2 rounded-lg border border-gray-700">
            <h4 className="text-xs text-gray-300 mb-1">Proctoring</h4>
            <video ref={videoRef} width="160" height="120" autoPlay muted className="rounded" />
            <canvas ref={canvasRef} width="160" height="120" className="hidden" />
            <AudioProctoring active={active} stream={stream} />
        </div>
    );
};

export default Proctoring;