"use client";
import { useState, useEffect, useCallback } from "react";
import { Jobcards } from "@/components/Jobcards";
import dynamic from "next/dynamic";
import {
  Inbox,
  ChevronDown,
  Check,
  Truck,
  RefreshCw,
  Navigation,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

// โหลดหน้าสถิติเฉพาะตอนกดเปิดครั้งแรก
const DeliveryStats = dynamic(
  () => import("@/components/DeliveryStats").then((m) => m.DeliveryStats),
  { ssr: false }
);

// เก็บรายการงานล่าสุดไว้ในเครื่อง: เปิดหน้าแล้วแสดงทันที ไม่ต้องรอเน็ต
// ผูกกับ access_token ของ login ครั้งนั้น เพื่อไม่ให้คนขับที่ใช้เครื่องร่วมกันเห็นงานของกันและกัน
const JOBS_CACHE_PREFIX = "jobs-cache:";

const jobsCacheKey = () => {
  const token = localStorage.getItem("access_token");
  return token ? JOBS_CACHE_PREFIX + token.slice(-24) : null;
};

const readJobsCache = (): any[] | null => {
  try {
    const key = jobsCacheKey();
    const raw = key ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJobsCache = (jobs: any[]) => {
  try {
    const key = jobsCacheKey();
    if (!key) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(JOBS_CACHE_PREFIX) && k !== key)
      .forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(key, JSON.stringify(jobs));
  } catch {
    // พื้นที่เต็มหรือถูกบล็อก: ข้ามไป
  }
};

type TicketProps = {
  onLoadingChange: (loading: boolean) => void;
};

export const Jobcomponent = ({ onLoadingChange }: TicketProps) => {
  const [datajobs, setDatajobs] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [finished_status, setFinished_status] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsMounted, setStatsMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const applyJobs = useCallback((jobs: any[]) => {
    const filtered = jobs.filter(
      (job: any) =>
        job.status !== "ตกคิว" &&
        job.status !== "อบรมที่บริษัท" &&
        job.status !== "ยกเลิก" &&
        job.status !== "ซ่อม"
    );
    setDatajobs(filtered);
    setPending(filtered.filter((job: any) => job.status !== "จัดส่งแล้ว (POD)"));
    setFinished_status(filtered.filter((job: any) => job.status === "จัดส่งแล้ว (POD)"));
  }, []);

  const fetchData = useCallback(async () => {
    const user = localStorage.getItem("user") || "";
    try {
      const access_token = localStorage.getItem("access_token");
      setUsername(user);

      const res_data = await fetch("/api/jobs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      });
      const data = await res_data.json();
      if (!Array.isArray(data?.jobs)) throw new Error("Invalid jobs response");
      applyJobs(data.jobs);
      writeJobsCache(data.jobs);
      setHasError(false);
      onLoadingChange(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setHasError(true);
      onLoadingChange(false);
    }
  }, [onLoadingChange, applyJobs]);

  useEffect(() => {
    const cached = readJobsCache();
    if (cached) {
      applyJobs(cached);
      onLoadingChange(false);
    }
    fetchData();
  }, [fetchData, applyJobs, onLoadingChange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const pendingCount = pending.length;
  const completedCount = finished_status.length;
  const totalCount = datajobs.length;

  return (
    <div className="min-h-screen from-green-100 to-emerald-200 bg-gradient-to-br pb-28 pt-6">

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-4">

        {/* ─── Quick Actions ─── */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://mena-go-srb.menatransport.co.th/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all active:scale-[0.98] group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">MENA-GO</p>
              <p className="text-xs text-gray-500">ระบบตรวจรถ</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 group-hover:text-blue-400 transition-colors" />
          </a>

          <button
            onClick={() => {
              setStatsMounted(true);
              setShowStatsModal(true);
            }}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all active:scale-[0.98] group text-left"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">สถิติ</p>
              <p className="text-xs text-gray-500">รายงานจัดส่ง</p>
            </div>
          </button>
        </div>

        {/* ─── Tab Switcher ─── */}
        <div className="bg-gray-100 rounded-2xl p-1.5 flex gap-1">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
              activeTab === "pending"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Truck className="w-5 h-5" />
            <span>รอดำเนินการ</span>
            {pendingCount > 0 && (
              <span className={`text-sm px-2 py-0.5 rounded-full font-bold ${
                activeTab === "pending"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
              activeTab === "completed"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Check className="w-5 h-5" />
            <span>เสร็จสิ้น</span>
            {completedCount > 0 && (
              <span className={`text-sm px-2 py-0.5 rounded-full font-bold ${
                activeTab === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {completedCount}
              </span>
            )}
          </button>
        </div>

        {/* ─── Offline / Stale Banner ─── */}
        {hasError && datajobs.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>เชื่อมต่อไม่ได้ แสดงข้อมูลล่าสุด</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-sm font-semibold text-amber-800 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              ลองใหม่
            </button>
          </div>
        )}

        {/* ─── Error State ─── */}
        {hasError && datajobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">โหลดข้อมูลไม่สำเร็จ</p>
              <p className="text-sm text-gray-500 mt-1">กรุณาลองใหม่อีกครั้ง</p>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              ลองใหม่
            </button>
          </div>
        ) : datajobs.length === 0 ? (
          /* ─── Empty State ─── */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center">
              <Inbox className="w-8 h-8 text-gray-300" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">ยังไม่มีงานขนส่ง</p>
              <p className="text-sm text-gray-500 mt-1">เมื่อมีงานใหม่จะแสดงที่นี่</p>
            </div>
          </div>
        ) : (
          /* ─── Job Cards ─── */
          <div className="transition-all duration-300 ease-in-out">
            {activeTab === "pending" ? (
              pendingCount > 0 ? (
                <Jobcards filterStatus="รอดำเนินงาน" datajobs={datajobs} />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                    <Check className="w-7 h-7 text-green-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">งานเสร็จหมดแล้ว</p>
                    <p className="text-sm text-gray-500 mt-1">ไม่มีงานรอดำเนินการ</p>
                  </div>
                </div>
              )
            ) : completedCount > 0 ? (
              <Jobcards filterStatus="จัดส่งแล้ว (POD)" datajobs={datajobs} />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-3">
                <div className="w-14 h-14 mx-auto bg-gray-50 rounded-full flex items-center justify-center">
                  <Inbox className="w-7 h-7 text-gray-300" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">ยังไม่มีงานเสร็จสิ้น</p>
                  <p className="text-sm text-gray-500 mt-1">งานที่จัดส่งแล้วจะแสดงที่นี่</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Delivery Stats Modal ─── */}
      {statsMounted && (
        <DeliveryStats
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
        />
      )}
    </div>
  );
};
