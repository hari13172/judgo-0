"use client"

import { useState, useEffect } from "react"
import { Shield, X } from "lucide-react"

interface SecureModeNotificationProps {
    active: boolean
}

export function SecureModeNotification({ active }: SecureModeNotificationProps) {
    const [show, setShow] = useState(false)

    useEffect(() => {
        if (active) {
            setShow(true)
            const timer = setTimeout(() => {
                setShow(false)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [active])

    if (!show) return null

    return (
        <div className="fixed top-4 right-4 z-50 bg-purple-900/80 border border-purple-700 rounded-md p-3 shadow-lg max-w-xs animate-in fade-in slide-in-from-top-5 duration-300">
            <div className="flex items-start">
                <Shield className="h-5 w-5 text-purple-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                    <h4 className="font-medium text-white mb-1">Secure Test Mode Active</h4>
                    <p className="text-xs text-purple-200">
                        Do not exit full screen, switch tabs, or open developer tools. Your test will be terminated immediately.
                    </p>
                </div>
                <button onClick={() => setShow(false)} className="text-purple-300 hover:text-white flex-shrink-0">
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
