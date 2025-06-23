'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useJobStore } from '@/store/useStore'
import { mockTransportJobs } from '@/backend/transort-data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, ArrowRight } from 'lucide-react'


export const Jobcards = () => {
  const jobs = mockTransportJobs
  const router = useRouter()
  const getStatusConfig = (status: string | undefined) => {
    switch (status) {
      case 'พร้อมรับงาน':
      case 'ขนส่งสำเร็จ':
        return {
          color: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
          bgColor: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600',
          btn: 'bg-green-200 '
        }
      case 'รับงานแล้ว' :
      case 'ถึงต้นทาง' :
      case 'เริ่มขึ้นสินค้า' :
      case 'ขึ้นสินค้าเสร็จ' :
        return {
          color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          btn: 'bg-blue-200 '
        }
      case 'ถึงปลายทาง' :
      case 'เริ่มลงสินค้า' :
      case 'ลงสินค้าเสร็จ' :
        return {
          color: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
          bgColor: 'bg-purple-50 border-purple-200',
          iconColor: 'text-purple-600',
          btn: 'bg-purple-200 '
        }
      case 'เริ่มขนส่ง':
        return {
          color: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
          bgColor: 'bg-orange-50 border-orange-200',
          iconColor: 'text-orange-600',
          btn: 'bg-orange-200'
        }
      default:
        return {
          color: 'bg-gray-600 text-white',
          bgColor: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
          btn: 'bg-gray-200 '
        }
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('th-TH', { 
      day: '2-digit', 
      month: 'short' 
    })
  }

  const handleJob = (job: typeof jobs[0]) => {
    console.log('OBJ : ',job)
  useJobStore.getState().setJob(job) // ✅ เก็บไว้ใน global state
  router.push('/job')
}

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {jobs.map((job, index) => {
          const statusConfig = getStatusConfig("null")
          return (
            <Card 
              key={job.Id_load}
              className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1  rounded-xl border-2 ${statusConfig.bgColor} group overflow-hidden`}
            >
              <CardContent className="p-0">
                {/* Header with gradient */}
                <div className="p-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 transform -skew-y-1 translate-y-8"></div>
                  <div className="relative flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-dark mb-1">📦{job.Id_load}</h3>
                      <p className="text-dark/90 text-xs font-medium">
                        {job.H_plate} • {job.T_plate}
                      </p>
                    </div>
                    <Badge className={`${getStatusConfig(job.Status).color} border-white/30 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm`}>
                      {job.Status}
                    </Badge>
                  </div>
                </div>

                <div className="p-2 space-y-3">
                  {/* Route in single row - more compact */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1 flex-1 min-w-0">
                      <MapPin className={`h-3 w-3 ${statusConfig.iconColor} flex-shrink-0`} />
                      <span className="font-medium text-gray-900 truncate">{job.Ori_locat}</span>
                    </div>
                    <ArrowRight className={`h-3 w-3 ${statusConfig.iconColor} mx-2 flex-shrink-0`} />
                    <div className="flex items-center space-x-1 flex-1 min-w-0">
                      <span className="font-medium text-gray-900 truncate">{job.Des_locat}</span>
                    </div>
                  </div>

                  {/* Dates in compact grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm">
                      <div className="flex items-center space-x-1 mb-0.5">
                        <Clock className="h-2.5 w-2.5 text-green-600" />
                        <p className="text-xs text-gray-500 uppercase tracking-wide">รับ</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900">{formatDate(job.Recv_date)}</p>
                      <p className="text-xs text-gray-600">{job.Recv_time}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm">
                      <div className="flex items-center space-x-1 mb-0.5">
                        <Clock className="h-2.5 w-2.5 text-red-600" />
                        <p className="text-xs text-gray-500 uppercase tracking-wide">ส่ง</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900">{formatDate(job.unload_date)}</p>
                      <p className="text-xs text-gray-600">{job.unload_time}</p>
                    </div>
                  </div>

                  {/* Compact action button */}
                  <button onClick={() => handleJob(job)} className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-200 hover:shadow-md active:scale-98 ${getStatusConfig(job.Status).btn} group-hover:shadow-lg`}>
                    <span className="flex items-center justify-center space-x-1">
                      <span>ดูรายละเอียด</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
