
"use client";
import { useEffect, useState, useRef } from 'react'
import { Menu, X, Bell, User, Edit, Save, Eye, EyeOff, UserPlus, UserMinus, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/userStore'
import Swal from 'sweetalert2';

export const Navbars = () => {
  const { username, password , role, logout, updateProfile } = useUserStore()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [editForm, setEditForm] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [registerForm, setRegisterForm] = useState({
    username: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [deleteForm, setDeleteForm] = useState({
    username: '',
    confirmation: ''
  })

  const router = useRouter()

  useEffect(() => {
    setEditForm(prev => ({
      ...prev,
      username: username  || '',
      currentPassword: password || '',
    }))
  }, [username,password])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault()
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
    if (editForm.newPassword.length < 4) {
      alert('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร')
      return
    } 
    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }

    if (editForm.newPassword && !editForm.currentPassword) {
      alert('กรุณาใส่รหัสผ่านปัจจุบัน')
      return
    }

    if (editForm.currentPassword && editForm.currentPassword !== password) {
      alert('รหัสผ่านปัจจุบันไม่ถูกต้อง')
      return
    }

    setIsLoading(true)

    try {
      const access_token = localStorage.getItem("access_token");
     const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          user: editForm.username,
          old_password: editForm.currentPassword,
          new_password: editForm.newPassword,
        }),
      })
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Failed to update profile'}`);
        return;
      }
      localStorage.clear();
     Swal.fire({
       icon: 'success',
       title: 'แก้ไขข้อมูลสำเร็จ',
       showConfirmButton: false,
       timer: 1500
     })
      router.push('/login')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        showConfirmButton: false,
        timer: 1500
      })
    } finally {
      setIsLoading(false)
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
    setEditForm({
      username: username || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setRegisterForm({
      username: '',
      newPassword: '',
      confirmPassword: ''
    })
    setShowPassword(false)
    setIsRegisterModalOpen(true)
    setIsUserDropdownOpen(false)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setDeleteForm({
      username: '',
      confirmation: ''
    })
    setIsDeleteModalOpen(true)
    setIsUserDropdownOpen(false)
  }

  const handleRegisterSubmit = async () => {
    if (!registerForm.username.trim()) {
      alert('กรุณากรอกชื่อผู้ใช้')
      return
    }

    if (registerForm.newPassword.length < 4) {
      alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร')
      return
    }

    if (registerForm.newPassword !== registerForm.confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.USER_XAPI!
        },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.newPassword,
          role: 'user'
        }),
      })
      console.log('Register response status:', res);
      if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'ลงทะเบียนสำเร็จ',
        showConfirmButton: true
      })
      
      setIsRegisterModalOpen(false)
      setRegisterForm({
        username: '',
        newPassword: '',
        confirmPassword: ''
      })
    } else {
      const errorData = await res.json();
      Swal.fire({
        icon: 'error',
        title: `เกิดข้อผิดพลาด: ${errorData.error}`,
        showConfirmButton: true
      })
    }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการลงทะเบียน',
        showConfirmButton: false,
        timer: 1500
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSubmit = async () => {
    if (!deleteForm.username.trim()) {
      alert('กรุณากรอกชื่อผู้ใช้')
      return
    }

    if (deleteForm.confirmation.toLowerCase() !== 'ยืนยัน') {
      alert('กรุณาพิมพ์ "ยืนยัน" เพื่อดำเนินการลบ')
      return
    }

    setIsLoading(true)

    try {
      // TODO: Add your API call here
      const access_token = localStorage.getItem("access_token");
      // Example API call structure:
      // const res = await fetch('/api/users/delete', {
      //   method: 'DELETE',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${access_token}`,
      //   },
      //   body: JSON.stringify({
      //     username: deleteForm.username,
      //   }),
      // })
      
      console.log('Delete user:', {
        username: deleteForm.username,
      })

      Swal.fire({
        icon: 'success',
        title: 'ลบผู้ใช้งานสำเร็จ',
        showConfirmButton: false,
        timer: 1500
      })
      
      setIsDeleteModalOpen(false)
      setDeleteForm({
        username: '',
        confirmation: ''
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน',
        showConfirmButton: false,
        timer: 1500
      })
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <nav className="bg-gray-50 border-b border-gray-200 shadow-sm ">
      <div className="mx-4 px-4 md:mx-auto sm:mx-auto">
        <div className="flex justify-between items-center h-18">

          <div className="flex items-center space-x-3">
            
              <img src="/mena.png" alt="Logo" className="w-15 h-10" />
   
            <div>
              <h1 className="hidden text-lg font-semibold text-gray-900">Mena FastTrack</h1>
              <p className="hidden text-xs text-gray-500 -mt-0.5">Menatransport</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <a href="#" onClick={handleProfileClick} className="text-gray-600 hover:text-green-600 hover:bg-green-50 px-2 py-2 rounded-lg transition-colors duration-150 text-sm font-medium">
              บัญชี
            </a>
            
            {/* User Management Dropdown */}
           { role == 'admin' && <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1 text-gray-600 hover:text-green-600 hover:bg-green-50 px-2 py-2 rounded-lg transition-colors duration-150 text-sm font-medium"
              >
                ผู้ใช้ระบบ
                <ChevronDown className={`w-4 h-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={handleRegisterClick}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    ลงทะเบียนใหม่
                  </button>
                  {/* <button
                    onClick={handleDeleteClick}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                    ลบผู้ใช้งาน
                  </button> */}
                </div>
              )}
            </div>
            }

            <a href="#" onClick={(e) => {
          e.preventDefault()
          handleLogout()
        }} className="text-gray-600 hover:text-green-600 hover:bg-green-50 px-2 py-2 rounded-lg transition-colors duration-150 text-sm font-medium">
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

        {isMenuOpen && role == 'admin' && (
          <div className="md:hidden py-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <a href="#" onClick={handleProfileClick} className="block px-4 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150 text-sm font-medium">
                บัญชี
              </a>
              <button
                onClick={handleRegisterClick}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150 text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                ลงทะเบียนใหม่
              </button>
              {/* <button
                onClick={handleDeleteClick}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 text-sm font-medium"
              >
                <UserMinus className="w-4 h-4" />
                ลบผู้ใช้งาน
              </button> */}
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
                  <h4 className={` ${role === 'admin' ? '' : 'hidden'} text-md font-medium text-gray-800`}>เปลี่ยนรหัสผ่าน</h4>

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
                      <div className={`${role === 'admin' ? '' : 'hidden'}`}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่านใหม่</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={editForm.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
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
                      <div className={`${role === 'admin' ? '' : 'hidden'}`}>
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
                    disabled={isLoading}
                    className={`${role == 'admin' ? 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2' : 'hidden'}`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังแก้ไข...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        แก้ไขข้อมูล
                      </>
                    )}
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full border border-gray-300 max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-full">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">ลงทะเบียนผู้ใช้ใหม่</h2>
                  <p className="text-sm text-gray-500">เพิ่มผู้ใช้งานเข้าสู่ระบบ</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 mr-2">ชื่อผู้ใช้ <a href="https://docs.google.com/spreadsheets/d/1rlFFZWEAda03yCXDfh3KgekokSyc_Zzpphi0cVV3x8A/edit?gid=398724022#gid=398724022" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">เปิด Google sheet</a> </label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  placeholder="กรอกชื่อผู้ใช้"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่านใหม่</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerForm.newPassword}
                    onChange={(e) => setRegisterForm({...registerForm, newPassword: e.target.value})}
                    placeholder="กรอกรหัสผ่าน"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                    placeholder="ยืนยันรหัสผ่าน"
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
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleRegisterSubmit}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      บันทึก
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full border border-gray-300 max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-100 to-red-200 rounded-full">
                  <UserMinus className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">ลบผู้ใช้งาน</h2>
                  <p className="text-sm text-gray-500">ลบผู้ใช้งานออกจากระบบ</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>คำเตือน:</strong> การลบผู้ใช้งานจะไม่สามารถย้อนกลับได้
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ใช้ </label>
                <input
                  type="text"
                  value={deleteForm.username}
                  onChange={(e) => setDeleteForm({...deleteForm, username: e.target.value})}
                  placeholder="กรอกชื่อผู้ใช้ที่ต้องการลบ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  พิมพ์ <span className="text-red-600 font-semibold">"ยืนยัน"</span> เพื่อดำเนินการ
                </label>
                <input
                  type="text"
                  value={deleteForm.confirmation}
                  onChange={(e) => setDeleteForm({...deleteForm, confirmation: e.target.value})}
                  placeholder="พิมพ์ ยืนยัน"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังลบ...
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-4 h-4" />
                      ลบผู้ใช้งาน
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
