"use client";
import React, { useState } from 'react'
import { MapPin, Truck, Package, Home, Check, Clock, ArrowRight, X } from 'lucide-react';


interface Typedata {
  load_id: string,
  start_recive_datetime: string,
  intransit_datetime: string,
  start_unload_datetime: string,
  complete_datetime: string,
  end_recive_datetime: string,
  start_datetime: string,
  origin_datetime: string,
  desination_datetime: string,
  end_unload_datetime: string
}

export const TimelineStep = ({db,onTimeChange }: {db: Typedata;onTimeChange : any}) => {

console.log('db : ',db)
const [selectedStatus, setSelectedStatus] = useState<StatusItem | null>(null);
const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
const [imageStatus, setImagesStatus] = useState<File[]>([]);
  type StatusItem = {
  key: keyof Typedata;
  title: string;
  icon: React.ElementType;
  description: string;
  color: string;
  };

   const statusConfig: StatusItem[] = [
    {
      key: 'start_datetime',
      title: 'รับงาน',
      icon: MapPin,
      description: 'กดรับงานขนส่ง',
      color: 'bg-indigo-500'
    },
    {
      key: 'origin_datetime',
      title: 'ถึงต้นทาง',
      icon: Truck,
      description: 'ถึงสถานที่ขึ้นสินค้า',
      color: 'bg-orange-600'
    },
    {
      key: 'start_recive_datetime',
      title: 'เริ่มขึ้นสินค้า',
      icon: Package,
      description: 'เริ่มขึ้นสินค้าจากต้นทาง',
      color: 'bg-blue-500'
    },
     {
      key: 'end_recive_datetime',
      title: 'ขึ้นสินค้าเสร็จ',
      icon: Truck,
      description: 'ขึ้นสินค้าจากต้นทางสำเร็จ',
      color: 'bg-yellow-500'
    },
    {
      key: 'intransit_datetime', 
      title: 'เริ่มขนส่ง',
      icon: Package,
      description: 'เริ่มขนส่งสินค้า',
      color: 'bg-purple-500'
    },
    {
      key: 'desination_datetime',
      title: 'ถึงปลายทาง',
      icon: Truck,
      description: 'ถึงสถานที่ลงสินค้า',
      color: 'bg-red-500'
    },
    {
      key: 'start_unload_datetime',
      title: 'เริ่มลงสินค้า',
      icon: Package,
      description: 'เริ่มลงสินค้าจากปลายทาง',
      color: 'bg-orange-500'
    },
      {
      key: 'end_unload_datetime',
      title: 'ลงสินค้าเสร็จ',
      icon: Home,
      description: 'ลงสินค้าจากปลายทางสำเร็จ',
      color: 'bg-green-500'
    },
    {
      key: 'complete_datetime',
      title: 'จัดส่งแล้ว (POD)',
      icon: Truck,
      description: 'จัดการขนส่งสำเร็จ (POD)',
      color: 'bg-blue-600'
    }
  
  ];


   const openModal = (status: any) => {
    console.log('status :timeline: ',status)
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStatus(null);
  };

const formatDateTime = (dateTimeString: any) => {
  if (!dateTimeString) return 'ยังไม่มีข้อมูล';

  console.log('formatDateTime : ', dateTimeString);

  try {
    // รองรับ "22/7/2025, 8:00:00" หรือ "22/7/2025 8:00:00"
    const match = dateTimeString.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ ,]+(\d{1,2}):(\d{2}):(\d{2})$/);

    if (!match) return 'รูปแบบข้อมูลไม่ถูกต้อง';

    const [, day, month, year, hour, minute, second] = match;
    const date = new Date(
      Number(year),
      Number(month) - 1, // JavaScript month เริ่มที่ 0
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );

    if (isNaN(date.getTime())) return 'ข้อมูลไม่ถูกต้อง';

    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.log('Error : ', error);
    return 'รูปแบบข้อมูลไม่ถูกต้อง';
  }
};


   const isStatusCompleted = (statusKey: keyof Typedata): boolean => {
  return db[statusKey] !== null && db[statusKey] !== '';
};

const formatOnsend = (date: string) => {
  if (!date) return '';

  const d = new Date(date);

  if (isNaN(d.getTime())) return 'รูปแบบวันที่ไม่ถูกต้อง';

  const day = d.getDate();
  const month = d.getMonth() + 1; // JavaScript เดือนเริ่มที่ 0
  const year = d.getFullYear();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();

  // เพิ่ม padding ด้วย .toString().padStart(2, "0")
  const formatted = `${day}/${month}/${year}, ${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}:${second.toString().padStart(2, '0')}`;

  return formatted;

};

const formchange = (id : string ,key : string ,date : string) => {
//  let value = {
//     'load_id':id,
//     [key]:date
//   }
 
 onTimeChange({
    'load_id':id,
     [key]:date
  })

  // console.log('value_sending : ',value)

}

  const getNextStatus = () => {
    for (let i = 0; i < statusConfig.length; i++) {
      if (!isStatusCompleted(statusConfig[i].key)) {
        return i;
      }
    }
    return -1; // ทุกสถานะเสร็จหมดแล้ว
  };

  const getCurrentStatus = () => {
    for (let i = statusConfig.length - 1; i >= 0; i--) {
      if (isStatusCompleted(statusConfig[i].key)) {
        return i;
      }
    }
    return -1;
  };

  const currentStatusIndex = getCurrentStatus();
  const nextStatusIndex = getNextStatus();

return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">

      <div className="relative">
        {/* เส้นเชื่อมต่อแนวตั้ง - เส้นประ */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5">
          <div className="h-full bg-gray-200 border-l-2 border-dashed border-gray-300"></div>
        </div>
        <div 
          className="absolute left-6 top-0 w-0.5 transition-all duration-500"
          style={{ 
            height: nextStatusIndex >= 0 ? `${((nextStatusIndex) / statusConfig.filter((_, i) => i <= nextStatusIndex).length) * 100}%` : currentStatusIndex >= 0 ? '100%' : '0%'
          }}
        >
          <div className="h-full bg-gray-100 border-l-2 border-dashed"></div>
        </div>

        {statusConfig.map((status, index) => {
          const isCompleted = isStatusCompleted(status.key);
          const isCurrent = index === currentStatusIndex;
          const isNext = index === nextStatusIndex;
          const IconComponent = status.icon;

          // ซ่อนสถานะที่ยังไม่ถึงเลย (เกินสถานะถัดไป)
          if (!isCompleted && !isNext) {
            return null;
          }

          return (
            
            <div key={status.key} className="relative flex flex-col items-start mb-6 last:mb-0 space-y-3 ">
              
              <div className="flex items-center flex-1 min-w-0">
                
                {/* วงกลมสถานะ */}
                <button
                  onClick={() => {
                    if (isCompleted || isNext) {
                      openModal(status);  
                    }
                  }}
                  disabled={!isCompleted && !isNext}
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                    isCompleted || isNext ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'
                  } ${
                    isCompleted
                      ? 'bg-green-500 text-white shadow-lg'
                      : isNext
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <IconComponent className="w-6 h-6" />
                  )}
                </button>

                {/* ข้อมูลสถานะ */}
                <div className="ml-4 flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${isCompleted ? 'text-gray-800' : isNext ? 'text-orange-600' : 'text-gray-400'}`}>
                    {status.title}
                  </h3>
                  <p className={`text-xs md:text-sm ${isCompleted ? 'text-gray-600' : isNext ? 'text-orange-500' : 'text-gray-400'}`}>
                    {isCompleted ? formatDateTime(db[status.key]) : 'รอดำเนินการ'}
                  </p>
                </div>

                {/* ไอคอนสถานะถัดไป */}
                {isNext && (
                  <div className="ml-2 shrink-0">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Input สำหรับใส่เวลา */}
{isNext && (
   <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm hover:shadow-md transition-all duration-300">
  <div className="mb-2 flex items-center space-x-2 text-gray-700">
    <Clock className="h-5 w-5 text-orange-500" />
    <span className="font-medium">บันทึกเวลา</span>
  </div>
  <input
    type="datetime-local"
    id={status.key}
    onChange={(e) => {
      const formatted = formatOnsend(e.target.value);
      formchange(db.load_id, status.key, formatted);
    }}
    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-inner focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
  />
</div>
            
              )}
             
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && selectedStatus && (
         <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
         <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border-1 border-gray-600">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${selectedStatus.color} text-white mb-4`}>
                <selectedStatus.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {selectedStatus.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {selectedStatus.description}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">วันที่-เวลา:</span>
                <span className="font-semibold text-gray-800">
                  {formatDateTime(db[selectedStatus.key])}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isStatusCompleted(selectedStatus.key)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isStatusCompleted(selectedStatus.key) ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    เสร็จสิ้น
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-1" />
                    รอดำเนินการ
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

