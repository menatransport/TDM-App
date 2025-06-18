'use client'
import React from 'react'
import { Navbars } from '@/components/Navbars';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge';
import {  getStatusSteps } from '@/backend/transort-data';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import { useJobStore } from '@/store/useStore';
import { useRouter } from 'next/navigation'
import TimelineStep from '@/components/Timeline';

const Jobs = () => {
    
    const job = useJobStore((state) => state.selectedJob)
    
    console.log('Job ที่รับมาจาก store : ', job)
    const router = useRouter();

       if (!job || !job.DO || job.DO.length === 0) {
        return (
            <div className="p-4">
                <Navbars />
                <div className="text-center mt-10 text-red-500">
                    🚫 ไม่พบข้อมูลการขนส่ง กรุณากลับไปเลือกงานอีกครั้ง
                </div>
                <div className="flex justify-center mt-4">
                    <Button onClick={() => router.push('/home')}>
                        <ArrowLeft className="mr-2" size={16} /> กลับหน้าหลัก
                    </Button>
                </div>
            </div>
        )
    }



    const formatDate = (date: string) => {
        const d = new Date(date)
        return d.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: 'short'
        })
    }

    const statusSteps = getStatusSteps();
    console.log ('job job:', job.DO[0]);
    // ตรวจสอบว่า job มีข้อมูลหรือไม่ 
    const timestamps = job.DO[0] || {};

    // หา step ปัจจุบันที่กำลังดำเนินการ
    const getCurrentStep = () => {
        const stepKeys = statusSteps.map(step => step.key);
        let currentStepIndex = -1;

        for (let i = 0; i < stepKeys.length; i++) {
            if (timestamps[stepKeys[i] as keyof typeof timestamps]) {
                currentStepIndex = i;
            } else {
                break;
            }
        }

        return currentStepIndex;
    };

    const currentStepIndex = getCurrentStep();
    const palletInfo = job.DO[1] || {};
    const attachmentInfo = job.DO[2] || {};


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
            case 'รับงานแล้ว':
            case 'ถึงต้นทาง':
            case 'เริ่มขึ้นสินค้า':
            case 'ขึ้นสินค้าเสร็จ':
                return {
                    color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
                    bgColor: 'bg-blue-50 border-blue-200',
                    iconColor: 'text-blue-600',
                    btn: 'bg-blue-200 '
                }
            case 'ถึงปลายทาง':
            case 'เริ่มลงสินค้า':
            case 'ลงสินค้าเสร็จ':
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
                    iconColor: 'text-orange-600'
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

    return (
        <>
            <Navbars />

            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex justify-center p-10 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200 bg-opacity-30 rounded-full animate-pulse"></div>
                    <div className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200 bg-opacity-20 rounded-full "></div>
                    <div className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300 bg-opacity-25 rounded-full "></div>
                    <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300 bg-opacity-30 rounded-full "></div>
                </div>

                <div className='flex flex-col z-1 w-full space-y-2 mt-1.5'>
                    {/* Buttton to home */}
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/home')}
                            className="flex items-center bg-white space-x-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>กลับ</span>
                        </Button>
                    </div>
                    {/* Header Info */}
                    <Card className="mb-4 bg-gray-50 shadow-md hover:shadow-lg transition-all duration-300 border-0 ring-1 ring-gray-200/50 hover:ring-gray-300/50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold">{job.Id_load}</CardTitle>
                                <Badge className={`${getStatusConfig(job.Status).color} border-white/30 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm`}>
                                    {job.Status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="p-2 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-1 flex-1 min-w-0">
                                        <MapPin className={`h-3 w-3 ${getStatusConfig(job.Status).iconColor} flex-shrink-0`} />
                                        <span className="font-medium text-gray-900 truncate">{job.Ori_locat}</span>
                                    </div>
                                    <ArrowRight className={`h-3 w-3 ${getStatusConfig(job.Status).iconColor} mx-2 flex-shrink-0`} />
                                    <div className="flex items-center space-x-1 flex-1 min-w-0">
                                        <span className="font-medium text-gray-900 truncate">{job.Des_locat}</span>
                                    </div>
                                </div>

                                {/* Dates in compact grid */}
                                <div className="grid grid-cols-2 gap-2 ">
                                    <div className="bg-white rounded-lg p-2 shadow-xs">
                                        <div className="flex items-center space-x-1 mb-0.5">
                                            <Clock className="h-2.5 w-2.5 text-green-600" />
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">รับ</p>
                                        </div>
                                        <div className='flex flex-row gap-2'>
                                        <p className="text-xs font-bold text-gray-900">{formatDate(job.Recv_date)}</p>
                                        <p className="text-xs text-gray-600">{job.Recv_time}</p>
                                        </div>
                                    </div>

                                   <div className="bg-white rounded-lg p-2 shadow-sm">
                                        <div className="flex items-center space-x-1 mb-0.5">
                                            <Clock className="h-2.5 w-2.5 text-red-600" />
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">ส่ง</p>
                                        </div>
                                        <div className='flex flex-row gap-2'>
                                            <p className="text-xs font-bold text-gray-900">{formatDate(job.unload_date)}</p>
                                            <p className="text-xs text-gray-600">{job.unload_time}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white rounded-lg p-2 shadow-sm">
                                        <div className="flex items-center space-x-1 mb-0.5">
                                            
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">ค่าลงสินค้า</p>
                                        </div>
                                        <p className="text-xs font-bold text-center text-gray-900">{job.Cost_pd}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-2 shadow-sm">
                                        <div className="flex items-center space-x-1 mb-0.5">
                                           
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">แผนพาเลท</p>
                                        </div>
                                        <p className="text-xs font-bold text-center text-gray-900">{job.Pallet_pl} {job.Pallet_act}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols gap-2">
                                    <div className="bg-white rounded-lg p-2 shadow-sm">
                                        <div className="flex items-center space-x-1 mb-0.5">
                                           
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">หมายเหตุ</p>
                                        </div>
                                        <p className="text-xs font-bold text-center text-gray-900">{job.Rmk_job}</p>
                                    </div>

                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline สถานะ */}
                    <Card className="mb-4 bg-gray-50 shadow-md hover:shadow-lg transition-all duration-300 border-0 ring-1 ring-gray-200/50 hover:ring-gray-300/50">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Clock className="h-5 w-5" />
                                <span>ติดตามสถานะ</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {statusSteps.map((step, index) => {
                                    const timestamp = timestamps[step.key as keyof typeof timestamps];
                                    const isCompleted = timestamp && timestamp.trim() !== '';
                                    const isActive = index === currentStepIndex + 1;

                                    return (
                                        <TimelineStep
                                            key={step.key}
                                            title={step.label}
                                            timestamp={timestamp}
                                            isCompleted={isCompleted}
                                            isActive={isActive}
                                            icon={step.icon}
                                        />
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* เอกสาร แนบรูป*/}
                    <Card className="mb-4 bg-gray-50 shadow-md hover:shadow-lg transition-all duration-300 border-0 ring-1 ring-gray-200/50 hover:ring-gray-300/50">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Clock className="h-5 w-5" />
                                <span>เอกสารรูปภาพ</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>



                        </CardContent>
                    </Card>

                </div>
            </div>

        </>
    );
};

export default Jobs;
