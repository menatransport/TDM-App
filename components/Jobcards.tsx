"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowRight } from "lucide-react";

interface JobcardsProps {
  filterStatus: string;
  datajobs: any;
}

export const Jobcards = ({ filterStatus, datajobs }: JobcardsProps) => {
  const jobs = datajobs;
  const filteredJobs = jobs.filter((job: any) => {
    if (filterStatus === "ทั้งหมด") {
      return true;
    }
    if (filterStatus === "รอดำเนินงาน") {
      return job.status !== "จัดส่งแล้ว (POD)";
    }
    return job.status === filterStatus;
  });

  const router = useRouter();

  const getStatusConfig = (job: any) => {
    switch (job.status) {
      case "พร้อมรับงาน":
      case "จัดส่งแล้ว (POD)":
        return {
          color: "bg-gradient-to-r from-green-500 to-green-600 text-white",
          bgColor: "bg-green-50 border-green-200",
          iconColor: "text-green-600",
          btn: "bg-green-200 ",
        };
      case "รับงาน":
      case "ถึงต้นทาง":
      case "เริ่มขึ้นสินค้า":
      case "ขึ้นสินค้าเสร็จ":
        return {
          color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
          bgColor: "bg-blue-50 border-blue-200",
          iconColor: "text-blue-600",
          btn: "bg-blue-200 ",
        };
      case "ถึงปลายทาง":
      case "เริ่มลงสินค้า":
      case "ลงสินค้าเสร็จ":
        return {
          color: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
          bgColor: "bg-purple-50 border-purple-200",
          iconColor: "text-purple-600",
          btn: "bg-purple-200 ",
        };
      case "เริ่มขนส่ง":
        return {
          color: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
          bgColor: "bg-orange-50 border-orange-200",
          iconColor: "text-orange-600",
          btn: "bg-orange-200",
        };
      default:
        return {
          color: "bg-gray-600 text-white",
          bgColor: "bg-gray-50 border-gray-200",
          iconColor: "text-gray-600",
          btn: "bg-gray-200 ",
        };
    }
  };

  const getEstimateTime = (estimateTime: string) => {
   console.log('estimateTime : ',estimateTime);
   let now = new Date();
   let estimateDate = new Date(estimateTime);
   let diff = estimateDate.getTime() - now.getTime();
   let hours = Math.floor(diff / (1000 * 60 * 60));
   let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
   if (hours < 0) return "กำลังสาย";
   if (hours < -1) return "สาย";
   return `เหลือเวลา ${hours} ชม. ${minutes} น.`;
  };

  const estimateTimeClass = (date: string,status: string) => {
    console.log('date : ',date);
    if(status == "พร้อมรับงาน" || status == "รับงาน") {
      const estimateTime = getEstimateTime(date);
      return estimateTime ? "flex" : "hidden";
    }
    return "hidden";
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr || typeof dateStr !== "string") return "-";
    // Accepts ISO 8601 format: '2025-12-08T13:00:00'
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (dateStr: string | undefined) => {
    // Accepts ISO 8601 format: '2025-12-08T13:00:00'
    if (!dateStr || typeof dateStr !== "string") return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleJob = (idjob: (typeof jobs)[0]) => {
    router.push(`/ticket?id=${idjob}`);
  };

  return (
    <div className="w-full mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredJobs.map((job: any) => {
          const statusConfig = getStatusConfig(job);
          return (
            <Card
              key={job.load_id}
              className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1  rounded-xl border-2 bg-white border-gray-300 group overflow-hidden`}
            >
              <CardContent className="p-0">
                {/* Header with gradient */}
                <div className="p-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 transform -skew-y-1 translate-y-8"></div>
                  <div className="relative flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-dark mb-1">
                        📦{job.load_id}
                      </h3>
                      <p className="text-dark/90 text-xs font-medium">
                        {job.h_plate} • {job.t_plate}
                      </p>
                    </div>
                    <div className="flex flex-col items-end  space-x-2 space-y-2">
                      <Badge
                        className={`${statusConfig.color} border-white/30 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm`}
                      >
                        {job.status}
                      </Badge>
                      <Badge
                        className={` ${job.job_type ? "" : "hidden"} ${
                          job.job_type == "ดรอป"
                            ? "bg-purple-200 text-purple-900"
                            : "bg-orange-200 text-orange-900"
                        } border-white/30 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm`}
                      >
                        ประเภทงาน: {job.job_type}
                      </Badge>
                      {/* <Badge
                        className={`${estimateTimeClass(job.date_recive,job.status)} bg-red-200 text-red-900 border-white/30 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm`}
                      >
                       {getEstimateTime(job.date_recive)}
                      </Badge> */}
                    </div>
                  </div>
                </div>

                <div className="p-1 space-y-1">
                  <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex flex-col items-center space-x-1 flex-1 min-w-0">
                        <p className="text-sm font-semibold">ต้นทาง</p>
                        <div className="flex flex-row">
                          <MapPin
                            className={`h-3 w-3 ${statusConfig.iconColor} flex-shrink-0 mr-2`}
                          />
                          <span className="font-medium text-gray-900">
                            {job.locat_recive}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-x-1 flex-1 min-w-0">
                        <div className="flex flex-col items-center space-x-1 flex-1 min-w-0">
                          <p className="text-sm font-semibold">ปลายทาง</p>
                          <div className="flex flex-row">
                            <ArrowRight
                              className={`h-3 w-3 ${statusConfig.iconColor} flex-shrink-0 mr-2`}
                            />
                            <span className="font-medium text-gray-900">
                              {job.locat_deliver}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates in compact grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm">
                      <div className="flex items-center space-x-1 mb-0.5">
                        <Clock className="h-2.5 w-2.5 text-green-600" />
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          รับ
                        </p>
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        {formatDate(job.date_recive)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatTime(job.date_recive)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-2 border border-gray-100 shadow-sm">
                      <div className="flex items-center space-x-1 mb-0.5">
                        <Clock className="h-2.5 w-2.5 text-red-600" />
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          ส่ง
                        </p>
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        {formatDate(job.date_deliver)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatTime(job.date_deliver)}
                      </p>
                    </div>
                  </div>

                  {/* Compact action button */}
                  <button
                    onClick={() => handleJob(job.load_id)}
                    className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-200 hover:shadow-md active:scale-98 
                     bg-blue-200
                    } group-hover:shadow-lg`}
                  >
                    <span className="flex items-center justify-center space-x-1">
                      <span>ติดตามสถานะ</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
