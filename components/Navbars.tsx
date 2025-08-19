
"use client";
import { useEffect, useState } from 'react'
import { Menu, X, Bell, User, Edit, Save, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/userStore'

export const Navbars = () => {
  // Zustand store
  const { username, password, logout, updateProfile } = useUserStore()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const router = useRouter()

  // โหลดข้อมูลจาก Zustand store เมื่อ component mount
  useEffect(() => {
    setEditForm(prev => ({
      ...prev,
      username: username  || '',
      currentPassword: password || '',
    }))
  }, [username,password])


  const handleLogout = () => {
    // ใช้ Zustand logout function
    logout()
    router.push('/login')
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Reset form เมื่อเปิด modal
    setEditForm({
      username: username || '',
      currentPassword: password || '',
      newPassword: '',
      confirmPassword: ''
    })
    setShowPassword(false)
    setIsProfileModalOpen(true)
  }


  const handleSaveProfile = async () => {
    // Validate form
    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }

    if (editForm.newPassword && !editForm.currentPassword) {
      alert('กรุณาใส่รหัสผ่านปัจจุบัน')
      return
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน (เปรียบเทียบกับ password ใน store)
    if (editForm.currentPassword && editForm.currentPassword !== password) {
      alert('รหัสผ่านปัจจุบันไม่ถูกต้อง')
      return
    }

    

    try {
      // อัพเดทข้อมูลใน Zustand store
      updateProfile(
        editForm.username.trim() !== '' ? editForm.username : undefined,
        editForm.newPassword || undefined
      )

    
      setEditForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      setIsProfileModalOpen(false)
      alert('บันทึกข้อมูลสำเร็จ')
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCloseModal = () => {
    setIsProfileModalOpen(false)
    setShowPassword(false)
    // Reset form เมื่อปิด modal
    setEditForm({
      username: username || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }
  return (
    <nav className="bg-gray-50 border-b border-gray-200 shadow-sm border-b border-gray-100">
      <div className="mx-4 px-4 md:mx-auto sm:mx-auto">
        <div className="flex justify-between items-center h-18">

          <div className="flex items-center space-x-3">
            
              {/* <Truck className="w-5 h-5 text-white" /> */}
              <img src="/mena.png" alt="Logo" className="w-15 h-10" />
   
            <div>
              <h1 className="hidden text-lg font-semibold text-gray-900">Smart - Fast Ship Tracking</h1>
              <p className="hidden text-xs text-gray-500 -mt-0.5">Menatransport</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <a href="#" onClick={handleProfileClick} className="text-gray-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg transition-colors duration-150 text-sm font-medium">
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
              <a href="#" onClick={handleProfileClick} className="block px-4 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150 text-sm font-medium">
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

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full border border-gray-300 max-w-2xl max-h-[95vh] sm:max-h-auto overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-full">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">ข้อมูลบัญชีผู้ใช้</h2>
                  <p className="text-sm text-gray-500">จัดการข้อมูลส่วนตัวของคุณ</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
             
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">ข้อมูลส่วนตัว</h3>
                  
              
                  
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ใช้</label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="กรอกชื่อผู้ใช้ใหม่"
                      readOnly
                      className="w-full px-3 py-2 border bg-gray-200 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />                 
                  </div>

                </div>

                <div className="space-y-4 pt-1">
                  <h4 className="text-md font-medium text-gray-800">เปลี่ยนรหัสผ่าน</h4>

                      {/* Current Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่านปัจจุบัน</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={editForm.currentPassword}
                            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่านใหม่</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={editForm.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                      </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ยืนยันรหัสผ่านใหม่</label>
                        <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={editForm.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                         <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          </div>
                      </div>
                    </div>
                 
            
              </div>
            </div>

              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <button onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  > 
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    บันทึกการเปลี่ยนแปลง
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}
    </nav>
  )
}
