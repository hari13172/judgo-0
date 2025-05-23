"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as faceDetection from "@tensorflow-models/face-detection";
import { toast } from "sonner";
import AudioProctoring from "./AudioProctoring";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

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

// Define props interface
interface ProctoringProps {
    active: boolean;
    onTestTermination: (reason: string) => void;
}

const Proctoring: React.FC<ProctoringProps> = ({ active, onTestTermination }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isProctoring, setIsProctoring] = useState<boolean>(false);
    const [noFaceCount, setNoFaceCount] = useState<number>(0);
    const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
    const [headDirection, setHeadDirection] = useState<string>("straight");
    const [violationCount, setViolationCount] = useState<number>(0);
    const [popupCount, setPopupCount] = useState<number>(0);
    const [isWarningPopupOpen, setIsWarningPopupOpen] = useState<boolean>(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [detector, setDetector] = useState<faceDetection.FaceDetector | null>(null);
    const [lastNoFaceWarning, setLastNoFaceWarning] = useState<number>(0);
    const [lastMultipleFacesWarning, setLastMultipleFacesWarning] = useState<number>(0);
    const [lastTabSwitchWarning, setLastTabSwitchWarning] = useState<number>(0);
    const [lastHeadTurnWarning, setLastHeadTurnWarning] = useState<number>(0);
    const NO_FACE_TIMEOUT: number = 1000; // 1 second
    const WARNING_INTERVAL: number = 1000; // Minimum 1 second between same-type warnings
    const HEAD_TURN_THRESHOLD: number = 0.1; // Reduced threshold for more sensitivity
    const VIOLATION_LIMIT: number = 5; // Violations before popup
    const POPUP_LIMIT: number = 3; // Popups before termination

    // Stop stream function
    const stopStream = () => {
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
            console.log("[Proctoring] Webcam stream stopped.");
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsProctoring(false);
    };

    // Initialize webcam and TensorFlow.js
    useEffect(() => {
        if (!active) {
            console.log("[Proctoring] Inactive, stopping stream and cleanup...");
            stopStream();
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
                    detectorModelUrl: undefined,
                    maxFaces: 2,
                };
                const loadedDetector = await faceDetection.createDetector(
                    faceDetection.SupportedModels.MediaPipeFaceDetector,
                    detectorConfig
                );
                setDetector(loadedDetector);
                console.log("[Proctoring] Face detection model loaded.");

                // Request webcam access
                const mediaStream: MediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
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
            console.log("[Proctoring] Cleaning up on unmount...");
            stopStream();
            setDetector(null);
        };
    }, [active]);

    // Function to estimate head direction based on keypoints
    const estimateHeadDirection = (keypoints: { x: number; y: number; name?: string }[]): string => {
        const noseTip = keypoints.find((kp) => kp.name === "noseTip");
        const leftEye = keypoints.find((kp) => kp.name === "leftEye");
        const rightEye = keypoints.find((kp) => kp.name === "rightEye");

        if (!noseTip || !leftEye || !rightEye) {
            console.log("[Proctoring] Missing keypoints:", { noseTip, leftEye, rightEye });
            return "straight";
        }

        const faceCenterX = (leftEye.x + rightEye.x) / 2;
        const faceWidth = Math.abs(leftEye.x - rightEye.x);
        const normalizedNosePosition = (noseTip.x - faceCenterX) / faceWidth;

        console.log("[Proctoring] Keypoints:", { noseTipX: noseTip.x, leftEyeX: leftEye.x, rightEyeX: rightEye.x });
        console.log("[Proctoring] Face Center X:", faceCenterX, "Face Width:", faceWidth);
        console.log("[Proctoring] Normalized nose position:", normalizedNosePosition);

        if (normalizedNosePosition > HEAD_TURN_THRESHOLD) {
            return "left";
        } else if (normalizedNosePosition < -HEAD_TURN_THRESHOLD) {
            return "right";
        } else {
            return "straight";
        }
    };

    // Process faces with head direction detection and violation tracking
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
                            setViolationCount((prev) => {
                                const newViolationCount = prev + 1;
                                if (newViolationCount >= VIOLATION_LIMIT && !isWarningPopupOpen) {
                                    setIsWarningPopupOpen(true);
                                    setPopupCount((prev) => prev + 1);
                                }
                                return newViolationCount;
                            });
                        }
                        return newCount;
                    });
                }
                setHeadDirection("straight");
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
                        setViolationCount((prev) => {
                            const newViolationCount = prev + 1;
                            if (newViolationCount >= VIOLATION_LIMIT && !isWarningPopupOpen) {
                                setIsWarningPopupOpen(true);
                                setPopupCount((prev) => prev + 1);
                            }
                            return newViolationCount;
                        });
                    }
                    return newCount;
                });
                setLastNoFaceTime(null);
                setHeadDirection("straight");
            } else {
                setNoFaceCount(0);
                setLastNoFaceTime(null);
                console.log("[Proctoring] Single face detected, processing head direction...");

                // Process head direction
                const direction = estimateHeadDirection(faces[0].keypoints);
                setHeadDirection(direction);

                if (direction !== "straight" && currentTime - lastHeadTurnWarning >= WARNING_INTERVAL) {
                    toast.warning(`Head turned ${direction}`, {
                        description: "Please face the camera directly.",
                    });
                    setLastHeadTurnWarning(currentTime);
                    setViolationCount((prev) => {
                        const newViolationCount = prev + 1;
                        if (newViolationCount >= VIOLATION_LIMIT && !isWarningPopupOpen) {
                            setIsWarningPopupOpen(true);
                            setPopupCount((prev) => prev + 1);
                        }
                        return newViolationCount;
                    });
                }
            }
        },
        [lastNoFaceWarning, lastMultipleFacesWarning, lastHeadTurnWarning, isWarningPopupOpen]
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

    // Handle popup close
    const handleCloseWarningPopup = () => {
        setIsWarningPopupOpen(false);
        setViolationCount(0); // Reset violation count after popup
        if (popupCount >= POPUP_LIMIT) {
            stopStream(); // Stop stream before termination
            onTestTermination("Test terminated due to repeated proctoring violations.");
        }
    };

    if (!active) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#2d2d3f] p-2 rounded-lg border border-gray-700">
            <h4 className="text-xs text-gray-300 mb-1 text-center">Proctoring</h4>
            <video ref={videoRef} width="160" height="120" autoPlay muted className="rounded" />
            <canvas ref={canvasRef} width="160" height="120" className="hidden" />
            <div className="text-xs text-gray-300 mt-1 text-center">Head Direction: {headDirection}</div>
            <AudioProctoring active={active} stream={stream} />
            <AlertDialog open={isWarningPopupOpen} onOpenChange={setIsWarningPopupOpen}>
                <AlertDialogContent className="bg-[#1e1e2e] text-white border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM11 7v4H9V7h2zm0 6v2H9v-2h2z" />
                            </svg>
                            Proctoring Warning {popupCount}/{POPUP_LIMIT}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                            You have been detected not facing the camera multiple times. During the test, you must face the camera directly to comply with proctoring rules.
                            {popupCount >= POPUP_LIMIT ? (
                                <p className="mt-2 font-bold text-red-400">This is your final warning. The test will now be terminated.</p>
                            ) : (
                                <p className="mt-2">Repeated violations may lead to test termination.</p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleCloseWarningPopup} className="bg-purple-500 hover:bg-purple-600">
                            {popupCount >= POPUP_LIMIT ? "Close and Terminate" : "Understood"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Proctoring;