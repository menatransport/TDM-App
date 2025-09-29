"use client";
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Truck,
  Package,
  Home,
  Check,
  Clock,
  FileInput,
  FileOutput,
  ArrowRight,
  X,
  Stamp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { stat } from "fs";
import Swal from "sweetalert2";

interface Typedata {
  load_id: string;
  start_recive_datetime: string;
  intransit_datetime: string;
  start_unload_datetime: string;
  complete_datetime: string;
  end_recive_datetime: string;
  docs_submitted_datetime: string;
  start_datetime: string;
  origin_datetime: string;
  desination_datetime: string;
  docs_returned_datetime: string;
  end_unload_datetime: string;

  start_recive_latlng: string;
  intransit_latlng: string;
  start_unload_latlng: string;
  complete_latlng: string;
  end_recive_latlng: string;
  docs_submitted_latlng: string;
  start_latlng: string;
  origin_latlng: string;
  desination_latlng: string;
  docs_returned_latlng: string;
  end_unload_latlng: string;
}

export const TimelineStep = ({
  db,
  onTimeChange,
  locatRecive,
  onSaveComplete,
}: {
  db: Typedata;
  onTimeChange: any;
  locatRecive?: string;
  onSaveComplete?: () => void;
}) => {
  const [selectedStatus, setSelectedStatus] = useState<StatusItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [imageStatus, setImagesStatus] = useState<File[]>([]);
  const [stamptime, setStamptime] = useState<string>("");
  const [isStamping, setIsStamping] = useState<boolean>(false);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [gpsTimeout, setGpsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  type StatusItem = {
    key: keyof Typedata;
    latlng: keyof Typedata;
    title: string;
    icon: React.ElementType;
    description: string;
    color: string;
  };
  const router = useRouter();

  // อัปเดตเวลาปัจจุบันทุกนาที
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    };

    const interval = setInterval(updateCurrentTime, 1000); // อัปเดตทุก 1 วินาที
    return () => clearInterval(interval);
  }, []);

  // Effect เพื่อ reset stamp เมื่อ save เสร็จ
  useEffect(() => {
    if (onSaveComplete && typeof window !== 'undefined') {
      const resetStamp = () => {
        setStamptime("");
        setIsStamping(false);
        if (gpsTimeout) {
          clearTimeout(gpsTimeout);
          setGpsTimeout(null);
        }
      };

      // เรียก resetStamp เมื่อมีการ save สำเร็จ
      window.addEventListener("timeline-reset", resetStamp);

      return () => {
        window.removeEventListener("timeline-reset", resetStamp);
        // ทำความสะอาด timeout เมื่อ component unmount
        if (gpsTimeout) {
          clearTimeout(gpsTimeout);
        }
      };
    }
  }, [onSaveComplete, gpsTimeout]);

  const statusConfig: StatusItem[] = [
    {
      key: "start_datetime",
      latlng: "start_latlng",
      title: "รับงาน",
      icon: MapPin,
      description: "กดรับงานขนส่ง",
      color: "bg-indigo-500",
    },
    {
      key: "origin_datetime",
      latlng: "origin_latlng",
      title: "ถึงต้นทาง",
      icon: Truck,
      description: "ถึงสถานที่ขึ้นสินค้า",
      color: "bg-orange-600",
    },
    {
      key: "start_recive_datetime",
      latlng: "start_recive_latlng",
      title: "เริ่มขึ้นสินค้า",
      icon: Package,
      description: "เริ่มขึ้นสินค้าจากต้นทาง",
      color: "bg-blue-500",
    },
    {
      key: "end_recive_datetime",
      latlng: "end_recive_latlng",
      title: "ขึ้นสินค้าเสร็จ",
      icon: Truck,
      description: "ขึ้นสินค้าจากต้นทางสำเร็จ",
      color: "bg-yellow-500",
    },
    {
      key: "intransit_datetime",
      latlng: "intransit_latlng",
      title: "เริ่มขนส่ง",
      icon: Package,
      description: "เริ่มขนส่งสินค้า",
      color: "bg-purple-500",
    },
    {
      key: "desination_datetime",
      latlng: "desination_latlng",
      title: "ถึงปลายทาง",
      icon: Truck,
      description: "ถึงสถานที่ลงสินค้า",
      color: "bg-red-500",
    },

    ...(locatRecive === "บริษัท นีโอ แฟคทอรี่ จำกัด"
      ? [
          {
            key: "docs_submitted_datetime" as keyof Typedata,
            latlng: "docs_submitted_latlng" as keyof Typedata,
            title: "ยื่นเอกสาร",
            icon: FileInput,
            description: "ยื่นเอกสารที่ปลายทาง",
            color: "bg-indigo-500",
          },
        ]
      : []),
    {
      key: "start_unload_datetime",
      latlng: "start_unload_latlng",
      title: "เริ่มลงสินค้า",
      icon: Package,
      description: "เริ่มลงสินค้าจากปลายทาง",
      color: "bg-orange-500",
    },
    {
      key: "end_unload_datetime",
      latlng: "end_unload_latlng",
      title: "ลงสินค้าเสร็จ",
      icon: Home,
      description: "ลงสินค้าจากปลายทางสำเร็จ",
      color: "bg-green-500",
    },

    ...(locatRecive === "บริษัท นีโอ แฟคทอรี่ จำกัด"
      ? [
          {
            key: "docs_returned_datetime" as keyof Typedata,
            latlng: "docs_returned_latlng" as keyof Typedata,
            title: "ได้รับเอกสารคืน",
            icon: FileOutput,
            description: "ได้รับเอกสารคืนจากปลายทาง",
            color: "bg-teal-500",
          },
        ]
      : []),
    {
      key: "complete_datetime",
      latlng: "complete_latlng",
      title: "จัดส่งแล้ว (POD)",
      icon: Truck,
      description: "จัดการขนส่งสำเร็จ (POD)",
      color: "bg-blue-600",
    },
  ];

  const openModal = (status: any) => {
    // console.log('status :timeline: ',status)
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStatus(null);
  };

  const formatDateTime = (dateTimeString: any) => {
    if (!dateTimeString) return "ยังไม่มีข้อมูล";

    // console.log('formatDateTime : ', dateTimeString);

    try {
      // รองรับ "22/7/2025, 8:00:00" หรือ "22/7/2025 8:00:00"
      const match = dateTimeString
        .trim()
        .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ ,]+(\d{1,2}):(\d{2}):(\d{2})$/);

      if (!match) return "รูปแบบข้อมูลไม่ถูกต้อง";

      const [, day, month, year, hour, minute, second] = match;
      const date = new Date(
        Number(year),
        Number(month) - 1, // JavaScript month เริ่มที่ 0
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );

      if (isNaN(date.getTime())) return "ข้อมูลไม่ถูกต้อง";

      return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.log("Error : ", error);
      return "รูปแบบข้อมูลไม่ถูกต้อง";
    }
  };

  const isStatusCompleted = (statusKey: keyof Typedata): boolean => {
    return db[statusKey] !== null && db[statusKey] !== "";
  };

  const formatOnsend = (date: string) => {
    if (!date) return "";

    const d = new Date(date);

    if (isNaN(d.getTime())) return "รูปแบบวันที่ไม่ถูกต้อง";

    const day = d.getDate();
    const month = d.getMonth() + 1; // JavaScript เดือนเริ่มที่ 0
    const year = d.getFullYear();
    const hour = d.getHours();
    const minute = d.getMinutes();
    const second = d.getSeconds();

    // เพิ่ม padding ด้วย .toString().padStart(2, "0")
    const formatted = `${day}/${month}/${year}, ${hour
      .toString()
      .padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second
      .toString()
      .padStart(2, "0")}`;

    return formatted;
  };

  const fetchImages = async (id: string) => {
    const res = await fetch("/api/upload", {
      method: "GET",
      headers: {
        id: id ?? "",
      },
    });
    const getimages = await res.json();
    // console.log("getimages : ", getimages.images);
    return getimages.images;
  };

  const formchange = async (id: string, key: string, date: string, latlng: string, latlngStamp: string) => {
    try {
      const images = await fetchImages(id);
      
      if (
        statusConfig.find((status) => status.key === key)?.title ==
        "ขึ้นสินค้าเสร็จ"
      ) {
        const hasOriginImages = images.some(
          (img: any) => img.category === "origin"
        );
        if (!hasOriginImages) {
          alert("โปรดแนบรูปภาพต้นทาง อย่างน้อย 1 รูปภาพ");
          setIsStamping(false);
          router.push(
            `/picture?id=${id}&status=${
              statusConfig.find((status) => status.key === key)?.title
            }`
          );
          return;
        }
      } else if (
        statusConfig.find((status) => status.key === key)?.title ==
        "ลงสินค้าเสร็จ"
      ) {
        const hasDestinationImages = images.some(
          (img: any) => img.category === "destination"
        );
        if (!hasDestinationImages) {
          alert("โปรดแนบรูปภาพปลายทาง อย่างน้อย 1 รูปภาพ");
          setIsStamping(false);
          router.push(
            `/picture?id=${id}&status=${
              statusConfig.find((status) => status.key === key)?.title
            }`
          );
          return;
        }
      }

      // บันทึกทันทีไม่ต้อง setTimeout
      setStamptime(date);
      onTimeChange({
        load_id: id,
        [key]: date,
        [latlng]: latlngStamp,
      });
      setIsStamping(false);
      
    } catch (error) {
      console.error("Error in formchange:", error);
      setIsStamping(false);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่");
    }
  };

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
            height:
              nextStatusIndex >= 0
                ? `${
                    (nextStatusIndex /
                      statusConfig.filter((_, i) => i <= nextStatusIndex)
                        .length) *
                    100
                  }%`
                : currentStatusIndex >= 0
                ? "100%"
                : "0%",
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
            <div
              key={status.key}
              className="relative flex flex-col items-start mb-6 last:mb-0 space-y-3 "
            >
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
                    isCompleted || isNext
                      ? "hover:scale-110 cursor-pointer"
                      : "cursor-not-allowed"
                  } ${
                    isCompleted
                      ? "bg-green-500 text-white shadow-lg"
                      : isNext
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-400"
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
                  <h3
                    className={`font-semibold truncate ${
                      isCompleted
                        ? "text-gray-800"
                        : isNext
                        ? "text-orange-600"
                        : "text-gray-400"
                    }`}
                  >
                    {status.title}
                  </h3>
                  <p
                    className={`text-xs md:text-sm ${
                      isCompleted
                        ? "text-gray-600"
                        : isNext
                        ? "text-orange-500"
                        : "text-gray-400"
                    }`}
                  >
                    {isCompleted
                      ? formatDateTime(db[status.key])
                      : "รอดำเนินการ"}
                  </p>
                </div>

                {/* ไอคอนสถานะถัดไป */}
                {isNext && (
                  <div className="ml-2 shrink-0">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* การบันทึกเวลาด้วย Stamp */}
              {isNext && (
                <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="mb-3 flex items-center space-x-2 text-gray-700">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">บันทึกเวลา</span>
                  </div>

                  <div className="flex items-center justify-center space-x-4">
                    {/* Stamp Time Button - แสดงเฉพาะเมื่อยังไม่มีเวลา */}
                    {!stamptime && (
                      <button
                        onClick={() => {
                          // ป้องกันการกดซ้ำ
                          const now = Date.now();
                          if (now - lastClickTime < 1000) return; // ป้องกันกดซ้ำภายใน 1 วินาที
                          setLastClickTime(now);
                          
                          if (isStamping || typeof window === 'undefined' || typeof navigator === 'undefined') return;
                          
                          setIsStamping(true);
                          
                          const currentTime = new Date();
                          const formattedTime = formatOnsend(currentTime.toISOString());
                          
                          if (!navigator.geolocation) {
                            alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
                            setIsStamping(false);
                            return;
                          }

                          // เพิ่ม timeout สำหรับ GPS
                          const timeoutId = setTimeout(() => {
                            setIsStamping(false);
                            alert("การขอตำแหน่ง GPS ใช้เวลานานเกินไป กรุณาลองใหม่");
                          }, 15000); // 15 วินาที
                          
                          setGpsTimeout(timeoutId);

                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              if (gpsTimeout) clearTimeout(timeoutId);
                              const latlngStamp = `${position.coords.latitude},${position.coords.longitude}`;
                              formchange(db.load_id, status.key, formattedTime, status.latlng, latlngStamp);
                            }, 
                            (error) => {
                              if (gpsTimeout) clearTimeout(timeoutId);
                              setIsStamping(false);
                              
                              console.error("Error getting location:", error);
                              
                              let errorMessage = "ไม่สามารถระบุตำแหน่งปัจจุบันได้ ";
                              switch (error.code) {
                                case error.PERMISSION_DENIED:
                                  errorMessage += "กรุณาอนุญาตการใช้ตำแหน่งในเบราว์เซอร์";
                                  break;
                                case error.POSITION_UNAVAILABLE:
                                  errorMessage += "กรุณาตรวจสอบการเชื่อมต่อ GPS";
                                  break;
                                case error.TIMEOUT:
                                  errorMessage += "การขอตำแหน่งใช้เวลานานเกินไป กรุณาลองใหม่";
                                  break;
                                default:
                                  errorMessage += error.message;
                              }
                              
                              alert(errorMessage);
                            }, 
                            {
                              enableHighAccuracy: true,
                              timeout: 12000, // ลด timeout เหลือ 12 วินาที
                              maximumAge: 30000 // ลด cache เหลือ 30 วินาที
                            }
                          );
                        }}
                        disabled={isStamping}
                        className={`group flex flex-col items-center justify-center w-24 h-24 rounded-2xl shadow-lg transition-all duration-200 ${
                          isStamping
                            ? "bg-gradient-to-br from-gray-400 to-gray-500 cursor-not-allowed transform scale-95 opacity-75"
                            : "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:shadow-xl hover:-translate-y-1 active:transform active:scale-95 active:translate-y-0"
                        }`}
                      >
                        {isStamping ? (
                          <>
                            <div className="w-8 h-8 mb-2 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-medium text-white text-center leading-tight">
                              รอสักครู่...
                            </span>
                          </>
                        ) : (
                          <>
                            <Stamp className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform text-white" />
                            <span className="text-sm font-medium text-white">
                              แสตมป์เวลา
                            </span>
                          </>
                        )}
                      </button>
                    )}

                  </div>

                  {/* แสดงเวลาที่บันทึก - แสดงเฉพาะเมื่อมีเวลา */}
                  {stamptime && (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formatDateTime(stamptime)}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 font-medium cursor-not-allowed focus:outline-none"
                        />
                      </div>
                      <div className="ml-3">
                        <button
                          onClick={() => {
                            const shouldCancel = confirm(
                              "ต้องการป้อนเวลาปัจจุบันใหม่หรือไม่?"
                            );
                            if (shouldCancel) {
                              setStamptime("");
                              onTimeChange({
                                load_id: db.load_id,
                                [status.key]: "",
                              });
                            }
                          }}
                          className="inline-flex items-center bg-red-600 px-1 py-1 text-xs rounded-full font-medium hover:bg-red-700 hover:text-red-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          <X className="w-4 h-4 text-white font-semibold" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ประกาศแสดงเฉพาะเมื่อยังไม่บันทึกเวลา */}
                  {/* {!stamptime && (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-700 text-center">
                        🎯 เพื่อความแม่นยำของข้อมูล <br />
                        ระบบจะใช้เวลาบันทึกปัจจุบัน และตำแหน่งปัจจุบัน
                      </p>
                    </div>
                  )} */}

                  {/* แจ้งเตือนเกี่ยวกับการแก้ไข */}
                  <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-700 text-center">
                      หากเวลาไม่ถูกต้อง และต้องการแก้ไขเวลา กรุณา
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            navigator.clipboard.writeText(db.load_id);
                            Swal.fire({
                              icon: 'success',
                              title: 'คัดลอก Load ID '+ db.load_id +' สำเร็จ',
                              text: 'โปรดนำไปวางในกลุ่มและแจ้งปัญหาที่เกิดขึ้น',
                              confirmButtonText: 'ตกลง'
                            }).then(() => {
                              window.open(
                                "https://line.me/ti/g/rmCAQxMY_U",
                                "_blank",
                                "noopener,noreferrer"
                              );
                            });                            
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 underline mx-1"
                      >
                        แจ้งกลุ่ม Line ระบบ
                      </button>
                    </p>
                  </div>
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
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${selectedStatus.color} text-white mb-4`}
              >
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
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isStatusCompleted(selectedStatus.key)
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isStatusCompleted(selectedStatus.key) ? (
                  <>
                    <Check className="w-4 h-4 mr-1" onClick={closeModal} />
                    เสร็จสิ้น
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-1" onClick={closeModal} />
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
