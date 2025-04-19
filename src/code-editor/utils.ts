export function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
  
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }
  
  export function encodeBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
  }
  
  export function decodeBase64(base64: string): string {
    return decodeURIComponent(escape(atob(base64)))
  }
  