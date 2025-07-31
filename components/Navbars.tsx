'use client' 
import { useState } from 'react'
import { Truck, Menu, X, Bell, User } from 'lucide-react'
import { useRouter } from 'next/navigation'


export const Navbars = () => {

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const username = localStorage.getItem('user');
  const handleLogout = () => {
        localStorage.setItem('isLoggedIn', 'false') 
        router.push('/login')
  }

  return (
    <nav className="bg-gray-50 border-b border-gray-200 shadow-sm border-b border-gray-100">
      <div className="mx-4 px-4 md:mx-auto sm:mx-auto">
        <div className="flex justify-between items-center h-18">

          <div className="flex items-center space-x-3">
            
              {/* <Truck className="w-5 h-5 text-white" /> */}
              <img src="/mena.png" alt="Logo" className="w-15 h-10" />
   
            <div>
              <h1 className="hidden text-lg font-semibold text-gray-900">Smart - TDM</h1>
              <p className="hidden text-xs text-gray-500 -mt-0.5">Menatransport</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <a href="#" className="text-gray-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg transition-colors duration-150 text-sm font-medium">
              บัญชี
            </a>
            <a href="#" onClick={(e) => {
          e.preventDefault()
          handleLogout()
        }} className="text-gray-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg transition-colors duration-150 text-sm font-medium">
              ออกจากระบบ
            </a>
          </div>

          <div className="flex items-center space-x-2">

            <button className="hidden relative p-2 text-gray-500 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors duration-150">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            </button>

            <button className="flex items-center space-x-2 px-3 py-2 text-gray-500 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors duration-150">
              <User className="w-5 h-5" />
              <span className="sm:block text-sm font-bold text-gray-700">{username}</span>
            </button>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors duration-150"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <a href="#" className="block px-4 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150 text-sm font-medium">
                บัญชี
              </a>
               <a href="#"  onClick={(e) => {
          e.preventDefault()
          handleLogout()
        }}
      className="block px-4 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150 text-sm font-medium">
      ออกจากระบบ</a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
