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
    // Detect Android and Chrome with more accurate detection
    const userAgent = navigator.userAgent.toLowerCase()
    const isAndroidDevice = /android/.test(userAgent)
    const isChromeApp = /chrome/.test(userAgent) && !/edg|opr|samsung|mi browser/.test(userAgent)
    
    setIsAndroid(isAndroidDevice)
    setIsChrome(isChromeApp)
    
    console.log('User Agent:', userAgent)
    console.log('Is Android:', isAndroidDevice)
    console.log('Is Chrome:', isChromeApp)

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
    console.log('Attempting to open in Chrome:', currentUrl)
    
    // Method 1: Try Android intent
    const intentUrl = `intent://${window.location.hostname}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`
    
    try {
      // Create a hidden link and click it
      const link = document.createElement('a')
      link.href = intentUrl
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Intent URL launched:', intentUrl)
    } catch (error) {
      console.error('Intent failed:', error)
      
      // Method 2: Try direct Chrome URL scheme
      try {
        window.location.href = `googlechrome://${window.location.hostname}${window.location.pathname}`
      } catch (error2) {
        console.error('Chrome scheme failed:', error2)
        
        // Method 3: Fallback to Play Store
        setTimeout(() => {
          window.open('https://play.google.com/store/apps/details?id=com.android.chrome', '_blank')
        }, 1000)
      }
    }
  }

  const handleInstallClick = async () => {
    console.log('Install button clicked')
    console.log('Is Android:', isAndroid, 'Is Chrome:', isChrome)
    
    // If not Chrome on Android, redirect to Chrome
    if (isAndroid && !isChrome) {
      console.log('Not Chrome, redirecting to Chrome...')
      openInChrome()
      return
    }

    // If Chrome but no install prompt available yet
    if (isChrome && !deferredPrompt) {
      console.log('Chrome detected but no install prompt yet')
      openInChrome();
      return
    }

    // Install with prompt
    if (deferredPrompt) {
      console.log('Installing with prompt...')
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log(`Install prompt outcome: ${outcome}`)
        setDeferredPrompt(null)
        setIsInstallable(false)
      } catch (error) {
        console.error('Error during installation:', error)
        alert('ติดตั้งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
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
   <div className={`mx-4 mb-4`}>
      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="mb-3">
          <span className="text-3xl">📱</span>
        </div>
        <h3 className="font-bold text-green-900 mb-2 text-lg">
          ติดตั้งแอปบนมือถือ
        </h3>
        <p className="text-sm text-green-700 mb-4">
          {!isChrome 
            ? `ตรวจพบ: ${navigator.userAgent.includes('Samsung') ? 'Samsung Browser' : navigator.userAgent.includes('Mi Browser') ? 'Mi Browser' : 'Browser อื่น'} - กดเพื่อเปิดใน Chrome` 
            : deferredPrompt 
              ? "พร้อมติดตั้งแล้ว! กดเพื่อติดตั้งบนหน้าจอหลัก"
              : ""
          }
        </p>
        <Button 
          onClick={handleInstallClick}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg"
        >
          {!isChrome 
            ? "🌐 เปิดใน Chrome" 
            : deferredPrompt 
              ? "ติดตั้งตอนนี้" 
              : "โปรดเปิด Google Chrome"
          }
        </Button>
        
        {/* Debug info in development */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-500">
            <p>Android: {isAndroid ? 'Yes' : 'No'}</p>
            <p>Chrome: {isChrome ? 'Yes' : 'No'}</p>
            <p>Install Prompt: {deferredPrompt ? 'Ready' : 'Not Ready'}</p>
            <p>UA: {navigator.userAgent.substring(0, 50)}...</p>
          </div>
        )} */}
      </div>
    </div>
  )
}
