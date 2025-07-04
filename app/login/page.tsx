'use client' 

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Eye, EyeOff, User, Lock, ArrowRight, Check } from 'lucide-react'
import { transortUser } from '@/backend/transort-user'

const login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const router = useRouter() 
  const local_remember = () => {
    if (typeof window !== 'undefined') {
      if (isChecked) {
        localStorage.setItem('user', username)
        localStorage.setItem('pass', password)
        localStorage.setItem('checked', 'true')
      } else {
        localStorage.removeItem('user')
        localStorage.removeItem('pass')
        localStorage.removeItem('checked')
      }
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rememberedUser = localStorage.getItem('user') || ''
      const rememberedPass = localStorage.getItem('pass') || ''
      const rememberedCheck = localStorage.getItem('checked') === 'true'

      setUsername(rememberedUser)
      setPassword(rememberedPass)
      setIsChecked(rememberedCheck)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async () => {
  setIsLoading(true)
  setError('')

  try {

    let chck = transortUser(username, password);

    if (chck) {
    if (username == "user" && password == "1234") {
      localStorage.setItem('isLoggedIn', 'true')
      local_remember()
      router.push('/home')
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    }
  } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    }
  } catch (err) {
    console.error('Login error:', err)
    setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
  } finally {
    setIsLoading(false)
  }
  
}

return (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4 relative overflow-hidden">
    {/* Animated background elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200 bg-opacity-30 rounded-full animate-pulse"></div>
      <div className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200 bg-opacity-20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300 bg-opacity-25 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300 bg-opacity-30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
    </div>

    {/* Main container */}
    <div className={`w-full max-w-md transform transition-all duration-1000 ease-out ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`}>

      {/* Logo section */}
      <div className="text-center mb-2">
        <div className={`inline-flex items-center justify-center w-50 h-25 bg-gradient-to-br from-white-400 to-white-500 rounded-2xl mb-4  transform transition-all duration-700 ease-out ${
          isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-45'
        }`}>
         <img src="/mena.png" alt="Logo" className="w-40 h-25" />
        </div>
        <h1 className={`text-2xl font-bold text-gray-800 mb-1 transform transition-all duration-700 ease-out delay-200 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          Smart - TDM Tracking Status
        </h1>
        <p className={`text-gray-500 text-sm transform transition-all duration-700 ease-out delay-300 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          Deverloped by Process Improvment Team 2025
        </p>
      </div>

      {/* Login card */}
      <div className={`bg-white rounded-3xl shadow-xl p-5 backdrop-blur-sm bg-opacity-95 transform transition-all duration-700 ease-out delay-400 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div className="text-center mb-3">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">เข้าสู่ระบบ</h2>
          <p className="text-gray-500 text-sm">ยินดีต้อนรับกลับมา</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg transform animate-pulse">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Username field */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-green-500">
              <User className="h-5 w-5 text-gray-400 group-focus-within:text-green-500" />
            </div>
            <input
              type="text"
              placeholder="ชื่อผู้ใช้"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Password field */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-green-500">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-500" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-500 transition-colors duration-200"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Remember me */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 mt-3 pl-3 flex items-center transition-colors duration-200 group-focus-within:text-green-500">
              <div
                onClick={() => setIsChecked(!isChecked)}
                className={`relative w-5 h-5 rounded-md border-2 cursor-pointer transition-all duration-200 ${
                  isChecked ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300 hover:border-green-400'
                }`}
              >
                <Check
                  className={`w-3 h-3 text-white absolute top-0.5 left-0.5 transform transition-all duration-200 ${
                    isChecked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                />
              </div>
              <label
                onClick={() => setIsChecked(!isChecked)}
                className="text-sm ml-3 text-gray-600 cursor-pointer select-none hover:text-green-600 transition-colors duration-200"
              >
                จดจำเข้าใช้งาน
              </label>
            </div>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full mt-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
          >
            <div className="flex items-center justify-center">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </div>
          </button>

          {/* Forgot password */}
          <div className="text-center">
            <button className="text-sm text-gray-500 hover:text-green-600 transition-colors duration-200 hover:underline">
              ลืมรหัสผ่าน?
            </button>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
          <p className="text-sm text-green-800 font-medium mb-2">ข้อมูลสำหรับทดสอบ:</p>
          <div className="text-xs space-y-1">
            <p className="text-green-700 flex items-center">
              <span className="w-16">ชื่อผู้ใช้:</span>
              <code className="bg-green-100 px-2 py-1 rounded text-green-800">user</code>
            </p>
            <p className="text-green-700 flex items-center">
              <span className="w-16">รหัสผ่าน:</span>
              <code className="bg-green-100 px-2 py-1 rounded text-green-800">1234</code>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`text-center mt-6 text-gray-500 text-sm transform transition-all duration-700 ease-out delay-600 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        <p>© 2025 MENA TRANSPORT PUBLIC.CO.,LTD</p>
      </div>
    </div>
  </div>
);

}


export default login
