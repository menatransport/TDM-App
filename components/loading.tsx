import React from 'react'
import { Truck,  Package } from 'lucide-react'

export const Loading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center relative overflow-hidden">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200 bg-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200 bg-opacity-20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300 bg-opacity-25 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300 bg-opacity-30 rounded-full animate-bounce"></div>
      </div>

      {/* Loading Content */}
      <div className="flex flex-col items-center space-y-8 z-10">
        {/* Main Loading Animation */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-32 h-32 border-4 border-emerald-200 rounded-full animate-spin">
            <div className="absolute top-0 left-1/2 w-4 h-4 bg-emerald-500 rounded-full transform -translate-x-1/2 -translate-y-2"></div>
          </div>
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full animate-pulse flex items-center justify-center">
            <Truck className="w-12 h-12 text-white animate-bounce" />
          </div>
        </div>

        {/* Loading Text with Animation */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 animate-pulse">
            กำลังโหลดข้อมูล
          </h2>
          
          {/* Animated dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>

        {/* Loading Steps Animation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-emerald-600 animate-pulse" />
              <span className="text-sm text-gray-600">โหลดข้อมูลงาน</span>
            </div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
