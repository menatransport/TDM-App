"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowRight, Truck } from "lucide-react";

interface JobcardsProps {
  filterStatus: string;
  datajobs: any;
}

// ─── Helpers (outside component for performance) ─────────────────────
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr || typeof dateStr !== "string") return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
};

const formatTime = (dateStr: string | undefined): string => {
  if (!dateStr || typeof dateStr !== "string") return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "พร้อมรับงาน":
      return { badge: "bg-emerald-100 text-emerald-800", accent: "from-emerald-400 to-green-500" };
    case "จัดส่งแล้ว (POD)":
      return { badge: "bg-green-100 text-green-800", accent: "from-green-400 to-emerald-500" };
    case "รับงาน":
    case "ถึงต้นทาง":
    case "เริ่มขึ้นสินค้า":
    case "ขึ้นสินค้าเสร็จ":
      return { badge: "bg-blue-100 text-blue-800", accent: "from-blue-400 to-blue-500" };
    case "เริ่มขนส่ง":
      return { badge: "bg-orange-100 text-orange-800", accent: "from-orange-400 to-orange-500" };
    case "ถึงปลายทาง":
    case "เริ่มลงสินค้า":
    case "ลงสินค้าเสร็จ":
      return { badge: "bg-purple-100 text-purple-800", accent: "from-purple-400 to-purple-500" };
    default:
      return { badge: "bg-gray-100 text-gray-700", accent: "from-gray-400 to-gray-500" };
  }
};

export const Jobcards = ({ filterStatus, datajobs }: JobcardsProps) => {
  const router = useRouter();

  // โหลดโค้ดหน้า ticket ไว้ล่วงหน้า กดการ์ดแล้วเปิดได้ทันที
  useEffect(() => {
    router.prefetch("/ticket");
  }, [router]);

  const filteredJobs = datajobs.filter((job: any) => {
    if (filterStatus === "ทั้งหมด") return true;
    if (filterStatus === "รอดำเนินงาน") return job.status !== "จัดส่งแล้ว (POD)";
    return job.status === filterStatus;
  });

  const handleJob = (loadId: string) => {
    router.push(`/ticket?id=${loadId}`);
  };

  return (
    <div className="w-full space-y-2 px-2 py-1">
      {filteredJobs.map((job: any) => {
        const style = getStatusStyle(job.status);

        return (
          <Card
            key={job.load_id}
            onClick={() => handleJob(job.load_id)}
            className="border-0 shadow-sm rounded-xl overflow-hidden bg-white transition-transform duration-150 active:scale-[0.98] cursor-pointer [content-visibility:auto] [contain-intrinsic-size:auto_110px]"
          >
            <CardContent className="p-0">
            

              <div className="px-4 py-1.5 space-y-2.5">
                {/* ── Row 1: ID + Status + Vehicle ── */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{job.load_id}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                      <Truck className="w-4 h-4" />
                      <span>{job.h_plate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {job.job_type ? (
                      <Badge
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 ${
                          job.job_type === "ดรอป"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {job.job_type}
                      </Badge>
                    ) : null}
                    <Badge className={`${style.badge} text-xs px-2.5 py-0.5 rounded-full font-semibold border-0`}>
                      {job.status}
                    </Badge>
                  </div>
                </div>

                {/* ── Row 2: Route (inline) ── */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-800 font-medium ">🏠 {job.locat_recive}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-800 font-medium ">🏁 {job.locat_deliver}</span>
                </div>

                {/* ── Row 3: Dates (inline) ── */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>รับ {formatDate(job.date_recive)} {formatTime(job.date_recive)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>ส่ง {formatDate(job.date_deliver)} {formatTime(job.date_deliver)}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
