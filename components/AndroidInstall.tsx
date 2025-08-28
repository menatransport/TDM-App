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
  const [isChrome, setIsChrome] = useState(false)

  useEffect(() => {
    // Detect Android and Chrome
    const userAgent = navigator.userAgent || navigator.vendor
    setIsAndroid(/android/i.test(userAgent))
    setIsChrome(/chrome/i.test(userAgent) && !/edg/i.test(userAgent))

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

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const openInChrome = () => {
    const currentUrl = window.location.href
    const chromeIntent = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`
    
    // Try to open in Chrome
    window.location.href = chromeIntent
    
    // Fallback to Play Store if Chrome is not installed
    setTimeout(() => {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.android.chrome'
    }, 2000)
  }

  const handleInstallClick = async () => {
    // If not Chrome on Android, redirect to Chrome
    if (isAndroid && !isChrome) {
      openInChrome()
      return
    }

    // If Chrome but no install prompt available yet, show install hint
    if (isChrome && !deferredPrompt) {
      // Force trigger install check
      setIsInstallable(true)
      return
    }

    // Install with prompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log(`Install prompt outcome: ${outcome}`)
        setDeferredPrompt(null)
        setIsInstallable(false)
      } catch (error) {
        console.error('Error during installation:', error)
      }
    }
  }

  // Don't show if already installed
  if (isInstalled) {
    return null
  }

  // Don't show for non-Android devices
  if (!isAndroid) {
    return null
  }

  // Show install button - works for all scenarios
  return (
    <div className="mx-4 mb-4">
      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="mb-3">
          <span className="text-3xl">📱</span>
        </div>
        <h3 className="font-bold text-green-900 mb-2 text-lg">
          ติดตั้งแอปบนมือถือ
        </h3>
        <p className="text-sm text-green-700 mb-4">
          {!isChrome 
            ? "กดเพื่อเปิดใน Chrome และติดตั้งแอป" 
            : "กดเพื่อติดตั้งแอปบนหน้าจอหลัก"
          }
        </p>
        <Button 
          onClick={handleInstallClick}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg"
        >
          {!isChrome ? "เปิดใน Chrome" : "ติดตั้งตอนนี้"}
        </Button>
      </div>
    </div>
  )
}
