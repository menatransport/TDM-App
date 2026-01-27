"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  Calendar,
  Truck,
  CheckCircle,
  TrendingUp,
  Package,
  X,
  Loader2,
} from "lucide-react";

// =============== TYPES ===============
interface Job {
  load_id: string;
  status: string;
  date_plan?: string;
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
const getDateFromJob = (job: Job): Date | null => {
  // ใช้ end_unload_datetime ก่อน ถ้าไม่มีใช้ date_plan
  const dateString = job.ticket_info?.end_unload_datetime || job.date_plan;
  if (!dateString) return null;

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

const isInDateRange = (date: Date, filter: DateFilter): boolean => {
  const jobMonth = date.getMonth();
  const jobYear = date.getFullYear();
  const jobDay = date.getDate();

  if (jobMonth !== filter.month || jobYear !== filter.year) return false;

  if (filter.period === "first") return jobDay >= 1 && jobDay <= 15;
  if (filter.period === "second") return jobDay >= 16;
  return true; // "all"
};

const getYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1];
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

    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const access_token = localStorage.getItem("access_token");
        const res = await fetch("/api/jobs", {
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
        setError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setIsLoading(false);
      }
    };

  // กรองเฉพาะงานที่จัดส่งแล้ว
  const completedJobs = useMemo(() => {
    return jobs.filter((job) => job.status === "จัดส่งแล้ว (POD)");
  }, [jobs]);

  // กรองตามวันที่ที่เลือก
  const filteredJobs = useMemo(() => {
    return completedJobs.filter((job) => {
      const date = getDateFromJob(job);
      if (!date) return false;
      return isInDateRange(date, filter);
    });
  }, [completedJobs, filter]);

  // คำนวณสถิติ
  const stats = useMemo(() => {
    const total = filteredJobs.length;

    // นับตามวันในช่วงที่เลือก
    const dailyCount: Record<number, number> = {};
    filteredJobs.forEach((job) => {
      const date = getDateFromJob(job);
      if (date) {
        const day = date.getDate();
        dailyCount[day] = (dailyCount[day] || 0) + 1;
      }
    });

    const daysWithDelivery = Object.keys(dailyCount).length;
    const avgPerDay = daysWithDelivery > 0 ? total / daysWithDelivery : 0;
    const maxDay = Object.entries(dailyCount).reduce(
      (max, [day, count]) =>
        count > max.count ? { day: Number(day), count } : max,
      { day: 0, count: 0 }
    );

    return {
      total,
      daysWithDelivery,
      avgPerDay: avgPerDay.toFixed(1),
      maxDay,
      dailyCount,
    };
  }, [filteredJobs]);

  const handleFilterChange = (key: keyof DateFilter, value: number | string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  const getPeriodLabel = () => {
    const monthName = MONTHS[filter.month].label;
    const periodText = PERIODS.find((p) => p.value === filter.period)?.label;
    return `${monthName} ${filter.year + 543} (${periodText})`;
  };

  // ไม่แสดงอะไรถ้า Modal ปิดอยู่
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">สถิติการจัดส่ง</h3>
                <p className="text-emerald-100 text-xs">{getPeriodLabel()}</p>
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
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 w-full bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-all text-sm text-gray-700"
          >
            <Calendar className="w-4 h-4" />
            <span>เลือกช่วงเวลา</span>
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>
          
        </div>

        {/* Filter Section */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showFilters ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Year */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ปี
                </label>
                <select
                  value={filter.year}
                  onChange={(e) =>
                    handleFilterChange("year", Number(e.target.value))
                  }
                  className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {getYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year + 543}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  เดือน
                </label>
                <select
                  value={filter.month}
                  onChange={(e) =>
                    handleFilterChange("month", Number(e.target.value))
                  }
                  className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ช่วงวัน
                </label>
                <select
                  value={filter.period}
                  onChange={(e) =>
                    handleFilterChange("period", e.target.value)
                  }
                  className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {PERIODS.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
    
        <div className="px-4">    
            <button onClick={fetchJobs} className="mt-2.5 p-2.5 w-full bg-gray-600 hover:bg-gray-900 text-white rounded-lg transition-all">
                ค้นหาข้อมูล
            </button>
        </div>     

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
              <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Stats Content */}
          {!isLoading && !error && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total Deliveries */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-gray-600">จำนวนเที่ยว</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">เที่ยว</p>
                </div>

                {/* Days with Delivery */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600">จำนวนวันที่ส่ง</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.daysWithDelivery}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">วัน</p>
                </div>

                {/* Average per Day */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-gray-600">เฉลี่ยต่อวัน</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {stats.avgPerDay}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">เที่ยว/วัน</p>
                </div>

                {/* Best Day */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-gray-600">วันที่ส่งมากสุด</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {stats.maxDay.count > 0 ? `วันที่ ${stats.maxDay.day}` : "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.maxDay.count > 0 ? `${stats.maxDay.count} เที่ยว` : "ไม่มีข้อมูล"}
                  </p>
                </div>
              </div>

              {/* Daily Breakdown - Mini Chart */}
              {stats.total > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      รายละเอียดรายวัน
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(stats.dailyCount)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([day, count]) => (
                        <div
                          key={day}
                          className="flex flex-col items-center px-2 py-1 bg-emerald-50 rounded-lg min-w-[40px]"
                          title={`วันที่ ${day}: ${count} เที่ยว`}
                        >
                          <span className="text-xs text-gray-500">{day}</span>
                          <span className="text-sm font-semibold text-emerald-700">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {stats.total === 0 && (
                <div className="mt-4 text-center py-6 bg-gray-50 rounded-xl">
                  <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryStats;
