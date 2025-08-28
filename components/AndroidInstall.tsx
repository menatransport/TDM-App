'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export default function AndroidInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)

  useEffect(() => {
    // Detect Android
    const userAgent = navigator.userAgent || navigator.vendor
    setIsAndroid(/android/i.test(userAgent))

    // Check if already installed (standalone mode)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    
    setIsInstalled(isStandaloneMode)

    if (isStandaloneMode) return

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('App installed successfully')
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Fallback timer for Android Chrome
    const timer = setTimeout(() => {
      if (isAndroid && !isStandaloneMode && !deferredPrompt) {
        setShowManualInstructions(true)
      }
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(timer)
    }
  }, [deferredPrompt, isAndroid])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual instructions for Android
      if (isAndroid) {
        setShowManualInstructions(true)
      }
      return
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`Install prompt outcome: ${outcome}`)
      
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Error during installation:', error)
      setShowManualInstructions(true)
    }
  }

  // Don't show if already installed
  if (isInstalled) {
    return (
      <div className="text-center p-3 bg-green-50 rounded-lg mx-4 mb-4 border border-green-200">
        <p className="text-sm text-green-700 font-medium flex items-center justify-center gap-2">
          <span>✅</span> แอปติดตั้งเรียบร้อยแล้ว
        </p>
      </div>
    )
  }

  // Don't show for non-Android devices
  if (!isAndroid) {
    return null
  }

  // Show automatic install prompt if available
  if (isInstallable && deferredPrompt) {
    return (
      <div className="mx-4 mb-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="mb-3">
            <span className="text-3xl">📱</span>
          </div>
          <h3 className="font-bold text-blue-900 mb-2 text-lg">
            ติดตั้งแอปบนมือถือ
          </h3>
          <Button 
            onClick={handleInstallClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg"
          >
            ติดตั้งตอนนี้
          </Button>
        </div>
      </div>
    )
  }

  // Show manual instructions
  if (showManualInstructions) {
    return (
      <div className="mx-4 mb-4">
        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="mb-3">
            <span className="text-3xl">📱</span>
          </div>
          <h3 className="font-bold text-orange-900 mb-2">
            ติดตั้งแอปด้วยตนเอง
          </h3>
          <div className="text-sm text-orange-800 mb-4 text-left bg-white p-3 rounded border">
            <p className="font-semibold mb-2">วิธีติดตั้ง:</p>
            <ol className="space-y-1">
              <li>1. กด <strong>Menu (⋮)</strong> ที่มุมขวาบนของเบราว์เซอร์</li>
              <li>2. เลือก <strong>"Add to Home Screen"</strong></li>
              <li>3. กด <strong>"Add"</strong> เพื่อติดตั้ง</li>
              <li>4. แอปจะปรากฏบนหน้าจอหลัก</li>
            </ol>
          </div>
          <Button 
            onClick={() => setShowManualInstructions(false)}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            เข้าใจแล้ว
          </Button>
        </div>
      </div>
    )
  }

  // Default state for Android - show install option
  return (
    <div className="mx-4 mb-4">
      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="mb-3">
          <span className="text-2xl">📱</span>
        </div>
        <h3 className="font-semibold text-gray-800 mb-2">
          ติดตั้งแอปบนมือถือ
        </h3>
        <Button 
          onClick={handleInstallClick}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
        >
          วิธีติดตั้ง
        </Button>
      </div>
    </div>
  )
}
