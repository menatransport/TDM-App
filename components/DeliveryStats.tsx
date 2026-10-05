"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  Calendar,
  Truck,
  CheckCircle,
  TrendingUp,
  Package,
  X,
  Loader2,
  Clock,
  ArrowRight,
  MapPin,
  PiggyBank
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// =============== TYPES ===============
interface Job {
  load_id: string;
  status: string;
  date_plan?: string;
  h_plate?: string;
  t_plate?: string;
  locat_recive?: string;
  locat_deliver?: string;
  date_recive?: string;
  date_deliver?: string;
  job_type?: string;
  ticket_info?: {
    end_unload_datetime?: string;
  };
  [key: string]: any;
}

interface DeliveryStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DateFilter {
  month: number;
  year: number;
  period: "first" | "second" | "all";
}

// =============== CONSTANTS ===============
const MONTHS = [
  { value: 0, label: "มกราคม" },
  { value: 1, label: "กุมภาพันธ์" },
  { value: 2, label: "มีนาคม" },
  { value: 3, label: "เมษายน" },
  { value: 4, label: "พฤษภาคม" },
  { value: 5, label: "มิถุนายน" },
  { value: 6, label: "กรกฎาคม" },
  { value: 7, label: "สิงหาคม" },
  { value: 8, label: "กันยายน" },
  { value: 9, label: "ตุลาคม" },
  { value: 10, label: "พฤศจิกายน" },
  { value: 11, label: "ธันวาคม" },
];

const PERIODS = [
  { value: "all" as const, label: "ทั้งเดือน" },
  { value: "first" as const, label: "วันที่ 1-15" },
  { value: "second" as const, label: "วันที่ 16-31" },
];

// =============== HELPER FUNCTIONS ===============
const getYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1];
};

const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const buildDateRange = (filter: DateFilter): { start: string; end: string } => {
  const { year, month, period } = filter;
  const lastDay = getLastDayOfMonth(year, month);
  const mm = String(month + 1).padStart(2, "0");

  let startDay = "01";
  let endDay = String(lastDay).padStart(2, "0");

  if (period === "first") {
    endDay = "15";
  } else if (period === "second") {
    startDay = "16";
  }

  return {
    start: `${year}-${mm}-${startDay}`,
    end: `${year}-${mm}-${endDay}`,
  };
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr || typeof dateStr !== "string") return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
};

const formatTime = (dateStr?: string): string => {
  if (!dateStr || typeof dateStr !== "string") return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "จัดส่งแล้ว (POD)":
      return { badge: "bg-green-100 text-green-800", accent: "from-green-400 to-emerald-500" };
    case "พร้อมรับงาน":
      return { badge: "bg-emerald-100 text-emerald-800", accent: "from-emerald-400 to-green-500" };
    case "รับงาน":
    case "ถึงต้นทาง":
    case "เริ่มขึ้นสินค้า":
    case "ขึ้นสินค้าเสร็จ":
      return { badge: "bg-blue-100 text-blue-800", accent: "from-blue-400 to-blue-500" };
    case "เริ่มขนส่ง":
      return { badge: "bg-orange-100 text-orange-800", accent: "from-orange-400 to-orange-500" };
    default:
      return { badge: "bg-gray-100 text-gray-700", accent: "from-gray-400 to-gray-500" };
  }
};

// =============== COMPONENT ===============
export const DeliveryStats = ({ isOpen, onClose }: DeliveryStatsProps) => {
  const currentDate = new Date();

  const [filter, setFilter] = useState<DateFilter>({
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
    period: "all",
  });

  const [showFilters, setShowFilters] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    setHasFetched(true);

    try {
      const access_token = localStorage.getItem("access_token");
      const driver_name = localStorage.getItem("user") || "";

      const { start, end } = buildDateRange(filter);
      const params = new URLSearchParams({
        driver_name,
        date_plan_start: start,
        date_plan_end: end,
      });

      const res = await fetch(`/api/history_driver?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch jobs");

      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  // กรองเฉพาะงานจัดส่งแล้ว
  const completedJobs = useMemo(() => {
    return jobs.filter((job) => job.status === "จัดส่งแล้ว (POD)");
  }, [jobs]);

  // สถิติรายวัน
  const stats = useMemo(() => {
    const total = completedJobs.length;
    const dailyCount: Record<number, number> = {};

    completedJobs.forEach((job) => {
      const dateStr = job.ticket_info?.end_unload_datetime || job.date_plan;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        dailyCount[day] = (dailyCount[day] || 0) + 1;
      }
    });

    const daysWithDelivery = Object.keys(dailyCount).length;
    const avgPerDay = daysWithDelivery > 0 ? (total / daysWithDelivery).toFixed(1) : "0";

    return { total, daysWithDelivery, avgPerDay, dailyCount };
  }, [completedJobs]);

  const handleFilterChange = (key: keyof DateFilter, value: number | string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  const getPeriodLabel = () => {
    const monthName = MONTHS[filter.month].label;
    const periodText = PERIODS.find((p) => p.value === filter.period)?.label;
    return `${monthName} ${filter.year + 543} (${periodText})`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">สถิติการจัดส่ง</h3>
                <p className="text-emerald-100 text-sm">{getPeriodLabel()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="px-4 pt-3">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 w-full bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all text-sm font-medium text-gray-700"
          >
            <Calendar className="w-4 h-4" />
            <span>เลือกช่วงเวลา</span>
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Filter Section */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="px-4 py-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ปี</label>
                <select
                  value={filter.year}
                  onChange={(e) => handleFilterChange("year", Number(e.target.value))}
                  className="w-full px-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {getYearOptions().map((year) => (
                    <option key={year} value={year}>{year + 543}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">เดือน</label>
                <select
                  value={filter.month}
                  onChange={(e) => handleFilterChange("month", Number(e.target.value))}
                  className="w-full px-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ช่วงวัน</label>
                <select
                  value={filter.period}
                  onChange={(e) => handleFilterChange("period", e.target.value)}
                  className="w-full px-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="px-2 pb-3">
          <button
            onClick={fetchJobs}
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 text-white text-base font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              null
            )}
            <span>{isLoading ? "กำลังค้นหา..." : "ค้นหาข้อมูล"}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[55vh] px-4 pb-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
              <p className="text-gray-500 text-base">กำลังโหลดข้อมูล...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <X className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-red-500 text-base font-medium">{error}</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && hasFetched && (
            <>
              {/* Daily Breakdown */}
              {stats.total > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-6 h-6 text-gray-500" />
                    <span className="text-lg font-semibold text-gray-700">จำนวนเที่ยว : {stats.total} เที่ยว</span>
                  </div>
                  {/* <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="w-6 h-6 text-gray-500" />
                    <span className="text-lg font-semibold text-gray-700">ค่าเที่ยว ≈ 5,000 บาท</span>
                  </div> */}
                </div>
              )}

              {/* Job Cards List */}
              {completedJobs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">รายการงานจัดส่งแล้ว</span>
                    </div>
                    <span className="text-xs text-gray-400">{completedJobs.length} รายการ</span>
                  </div>
                  <div className="space-y-2">
                    {completedJobs.map((job) => {
                      const style = getStatusStyle(job.status);
                      return (
                        <div
                          key={job.load_id}
                          className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                        >
                          <div className={`h-0.5 bg-gradient-to-r ${style.accent}`} />
                          <div className="px-3 py-2.5 space-y-1.5">
                            {/* ID + Status */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{job.load_id}</p>
                                {job.h_plate && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>{job.h_plate}</span>
                                  </div>
                                )}
                              </div>
                              <Badge className={`${style.badge} text-[11px] px-2 py-0 rounded-full font-semibold border-0`}>
                                {job.status}
                              </Badge>
                            </div>
                            {/* Route */}
                            {(job.locat_recive || job.locat_deliver) && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <span className="truncate max-w-[40%]">🏠 {job.locat_recive || "-"}</span>
                                <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                <span className="truncate max-w-[40%]">🏁 {job.locat_deliver || "-"}</span>
                              </div>
                            )}
                            {/* Dates */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span>รับ {formatDate(job.date_recive)} {formatTime(job.date_recive)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span>ส่ง {formatDate(job.date_deliver)} {formatTime(job.date_deliver)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {stats.total === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-base font-medium text-gray-500">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                  <p className="text-sm text-gray-400 mt-1">ลองเปลี่ยนเดือนหรือช่วงวันแล้วค้นหาใหม่</p>
                </div>
              )}
            </>
          )}

          {/* Initial State - before first search */}
          {!isLoading && !error && !hasFetched && (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-base font-medium text-gray-500">เลือกช่วงเวลาแล้วกดค้นหา</p>
              <p className="text-sm text-gray-400 mt-1">ระบบจะแสดงสถิติงานจัดส่งของคุณ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryStats;
