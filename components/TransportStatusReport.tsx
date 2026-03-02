"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { TransportItem } from "@/lib/type";
import Swal from "sweetalert2";

import {
  Truck,
  MapPin,
  Clock,
  Phone,
  Navigation,
  AlertCircle,
  CheckCircle,
  Timer,
  Route,
  RefreshCw,
  Grid3X3,
  BarChart3,
  List,
  Info,
  Eye,
  Search,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  FileSpreadsheet,
  Map,
  Camera,
  Check,
  CircleParking,
  Power,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { AdminMap } from "./AdminMap";
import { AdminView } from "./AdminView";

interface TransportStatusReportProps {
  transportData: TransportItem[];
  onRefreshData?: () => Promise<void>;
}

interface LocationDistance {
  distance: number;
  duration: number;
  estimatedArrival: Date;
}

const FilterDropdown = ({
  column,
  values,
  selectedValues,
  onFilterChange,
  onClearFilter,
  showDropdown,
  onToggleDropdown,
}: {
  column: string;
  values: string[];
  selectedValues: string[];
  onFilterChange: (column: string, value: string, checked: boolean) => void;
  onClearFilter: (column: string) => void;
  showDropdown: string | null;
  onToggleDropdown: (column: string | null) => void;
}) => {
  const isOpen = showDropdown === column;

  return (
    <div className="relative">
      <button
        onClick={() => onToggleDropdown(isOpen ? null : column)}
        className="flex items-center gap-1 px-[0.5em] py-[0.25em] text-[clamp(0.65rem,0.9vw,0.75rem)] font-light border border-gray-300 rounded bg-white hover:bg-gray-50 w-full justify-between cursor-pointer"
      >
        <span className="truncate">
          {selectedValues.length > 0
            ? `${selectedValues.length} เลือก`
            : "เลือกทั้งหมด"}
        </span>
        <ChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 z-150 ${column == "risk" ? "w-auto" : "min-w-[16em] max-w-[20em]"
            } mt-1 font-light bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto`}
        >
          <div className="p-[0.5em] border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[clamp(0.65rem,0.9vw,0.75rem)] font-light text-gray-700">
                เลือกข้อมูล ({selectedValues.length}/{values.length})
              </span>
              <button
                onClick={() => onClearFilter(column)}
                className="cursor-pointer text-[clamp(0.65rem,0.9vw,0.75rem)] text-red-600 hover:text-red-800"
              >
                ล้าง
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {values.map((value, index) => (
              <label
                key={index}
                className="flex items-left gap-2 px-[0.75em] py-[0.5em] hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={(e) =>
                    onFilterChange(column, value, e.target.checked)
                  }
                  className="w-[1em] h-[1em] text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span
                  className="text-[clamp(0.65rem,0.9vw,0.75rem)] font-light text-gray-700"
                  title={value}
                >
                  {value}
                </span>
                {selectedValues.includes(value) && (
                  <Check size={12} className="text-blue-600" />
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TransportStatusReport = ({
  transportData,
  onRefreshData,
}: TransportStatusReportProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [columnFilters, setColumnFilters] = useState<{
    [key: string]: string[];
  }>({
    load_id: [],
    driver_name: [],
    phone: [],
    status: [],
    origin: [],
    destination: [],
    distance: [],
    risk: [],
    delay: [],
  });

  const [showInfoTooltip, setShowInfoTooltip] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [selectedJobForMap, setSelectedJobForMap] =
    useState<TransportItem | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const [modalView, setModalView] = useState<{
    show: boolean;
    job: TransportItem | null;
  }>({
    show: false,
    job: null,
  });

  const handleOpenMap = (item: TransportItem) => {
    setSelectedJobForMap(item);
    setShowMapModal(true);
  };

  const handleCloseMap = () => {
    setShowMapModal(false);
    setSelectedJobForMap(null);
  };

  const handleView = (item: TransportItem) => {
    setModalView({ show: true, job: item });
  };

  const handleCloseView = () => {
    setModalView({ show: false, job: null });
  };

  // Adjust viewport for mobile devices
  useEffect(() => {
    const isMobile = window.innerWidth <= 640; // sm breakpoint
    handleRefresh();
    if (isMobile) {
      // Store original viewport
      const originalViewport = document.querySelector('meta[name="viewport"]');
      const originalContent = originalViewport?.getAttribute("content");

      // Set new viewport for dashboard
      if (originalViewport) {
        originalViewport.setAttribute(
          "content",
          "width=1024, initial-scale=0.5, maximum-scale=2, user-scalable=yes"
        );
      }

      // Restore original viewport on cleanup
      return () => {
        if (originalViewport && originalContent) {
          originalViewport.setAttribute("content", originalContent);
        }
      };
    }
  }, []);

  // กรองข้อมูลตามเงื่อนไข
  const filteredData = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return transportData.filter((item) => {
      // เช็ควันที่ (date_recive หรือ date_deliver == วันนี้)
      const receiveDate = item.date_recive
        ? item.date_recive.split("T")[0]
        : null;
      const deliverDate = item.date_deliver
        ? item.date_deliver.split("T")[0]
        : null;
      const isToday = receiveDate === today || deliverDate === today;

      // เช็คสถานะที่ไม่รวม
      const excludedStatuses = ["ยกเลิก", "ตกคิว", "ซ่อม", "อบรมที่บริษัท"];
      const isValidStatus = !excludedStatuses.includes(item.status);

      return isToday && isValidStatus;
    });
  }, [transportData]);

  const calculateDistanceFromLongdo = useCallback(async (
    plate: string,
    currentLat: number,
    currentLng: number,
    targetLat: number,
    targetLng: number,
    signal?: AbortSignal
  ): Promise<LocationDistance | null> => {
    try {
      // ใช้ query params แทน headers (RESTful best practice)
      const params = new URLSearchParams({
        plate,
        flat: String(currentLat),
        flon: String(currentLng),
        tlat: String(targetLat),
        tlon: String(targetLng),
        type: "16",
      });

      const res = await fetch(`/api/longdo?${params}`, {
        method: "GET",
        signal,
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const dbRes = await res.json();
      const dbResData = dbRes.data?.[0];

      if (dbResData) {
        const distanceKm = Math.round(dbResData.distance) / 1000;
        const duration = Math.round((distanceKm / 50) * 60); // นาที (ความเร็วเฉลี่ย 50 km/h)
        const estimatedArrival = new Date(Date.now() + duration * 60_000);
        return { distance: distanceKm, duration, estimatedArrival };
      }

      return null;
    } catch (error) {
      if ((error as Error).name === "AbortError") return null;
      console.error("Error fetching distance from Longdo API:", error);
      return null;
    }
  }, []);

  // กำหนดปลายทางตามสถานะ
  const getDestinationByStatus = (item: TransportItem) => {
    const destinationStatuses = [
      "ถึงต้นทาง",
      "เริ่มขึ้นสินค้า",
      "ขึ้นสินค้าเสร็จ",
      "เริ่มขนส่ง",
      "ถึงปลายทาง",
      "ยื่นเอกสาร",
      "ได้รับเอกสารคืน",
      "เริ่มลงสินค้า",
      "ลงสินค้าเสร็จ",
    ];

    if (destinationStatuses.includes(item.status)) {
      return {
        location: item.locat_deliver,
        latLng: item.latlng_deliver,
        plannedTime: item.date_deliver,
        type: "destination" as const,
      };
    } else {
      return {
        location: item.locat_recive,
        latLng: item.latlng_recive,
        plannedTime: item.date_recive,
        type: "origin" as const,
      };
    }
  };

  // ฟังก์ชันคำนวณความเสี่ยง
  const calculateRiskLevel = (slotTime: string, remainingMinutes: number) => {
    const slotDateTime = new Date(slotTime);
    const timeDifferenceMs = slotDateTime.getTime() - currentTime.getTime();
    const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);

    const oneHourInMinutes = 60;

    if (
      timeDifferenceMinutes > remainingMinutes + oneHourInMinutes ||
      remainingMinutes === 0
    ) {
      return {
        level: "low",
        label: "Low Risk",
        color: "bg-green-100 text-green-800",
        icon: "🟢",
      };
    } else if (
      timeDifferenceMinutes >= remainingMinutes &&
      timeDifferenceMinutes <= remainingMinutes + oneHourInMinutes
    ) {
      return {
        level: "moderate",
        label: "Moderate Risk",
        color: "bg-yellow-100 text-yellow-800",
        icon: "🟡",
      };
    } else {
      return {
        level: "high",
        label: "High Risk",
        color: "bg-red-100 text-red-800",
        icon: "🔴",
      };
    }
  };

  const [distanceData, setDistanceData] = useState<{
    [key: string]: LocationDistance;
  }>({});

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown size={10} className="text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={10} className="text-blue-600" />
    ) : (
      <ChevronDown size={10} className="text-blue-600" />
    );
  };

  const getUniqueValues = (column: string) => {
    const values = enrichedData
      .map((item) => {
        switch (column) {
          case "load_id":
            return item.load_id;
          case "driver_name":
            return item.driver_name;
          case "phone":
            return item.phone;
          case "status":
            return item.status;
          case "origin":
            return item.locat_recive;
          case "destination":
            return item.locat_deliver;
          case "risk":
            return item.riskAssessment
              ? item.riskAssessment.level === "low"
                ? "ต่ำ"
                : item.riskAssessment.level === "moderate"
                  ? "ปานกลาง"
                  : "สูง"
              : "-";
          default:
            return "";
        }
      })
      .filter(Boolean);

    return [...new Set(values)].sort();
  };

  const handleFilterChange = (
    column: string,
    value: string,
    checked: boolean
  ) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: checked
        ? [...prev[column], value]
        : prev[column].filter((v) => v !== value),
    }));
  };

  const clearFilter = (column: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: [],
    }));
  };

  // ฟังก์ชันสำหรับกรองและจัดเรียงข้อมูลตาม filters และ sorting
  const applyColumnFilters = (data: any[]) => {
    let filteredData = data.filter((item) => {
      // Load ID Filter - ถ้าไม่มีการเลือก หมายถึงแสดงทั้งหมด
      const matchLoadId =
        columnFilters.load_id.length === 0 ||
        columnFilters.load_id.includes(item.load_id);

      const matchDriver =
        columnFilters.driver_name.length === 0 ||
        columnFilters.driver_name.includes(item.driver_name);

      const matchPhone =
        columnFilters.phone.length === 0 ||
        columnFilters.phone.includes(item.phone);

      const matchStatus =
        columnFilters.status.length === 0 ||
        columnFilters.status.includes(item.status);

      const matchOrigin =
        columnFilters.origin.length === 0 ||
        columnFilters.origin.includes(item.locat_recive);

      const matchDestination =
        columnFilters.destination.length === 0 ||
        columnFilters.destination.includes(item.locat_deliver);

      // Risk filter
      const riskText = item.riskAssessment
        ? item.riskAssessment.level === "low"
          ? "ต่ำ"
          : item.riskAssessment.level === "moderate"
            ? "ปานกลาง"
            : "สูง"
        : "-";
      const matchRisk =
        columnFilters.risk.length === 0 ||
        columnFilters.risk.includes(riskText);

      // Distance และ Delay filters ยังคงใช้ string search เพราะเป็นข้อมูลที่คำนวณ
      const distanceText = item.distanceInfo
        ? `${item.distanceInfo.distance} กม. ${item.distanceInfo.duration} นาที`
        : "-";
      const matchDistance =
        columnFilters.distance.length === 0 ||
        columnFilters.distance.some((filter) =>
          distanceText.toLowerCase().includes(filter.toLowerCase())
        );

      // Delay filter
      const originStatuses = ["พร้อมรับงาน", "รับงาน"];
      const destinationStatuses = [
        "ถึงต้นทาง",
        "เริ่มขึ้นสินค้า",
        "ขึ้นสินค้าเสร็จ",
        "เริ่มขนส่ง",
        "ถึงปลายทาง",
        "ยื่นเอกสาร",
        "ได้รับเอกสารคืน",
        "เริ่มลงสินค้า",
        "ลงสินค้าเสร็จ",
      ];
      let delayText = "";

      if (originStatuses.includes(item.status)) {
        const delayStatus = getDelayStatus(item.date_recive, item.status);
        delayText = delayStatus.message;
      } else if (destinationStatuses.includes(item.status)) {
        const delayStatus = getDelayStatus(item.date_deliver, item.status);
        delayText = delayStatus.message;
      } else {
        delayText = item.status === "จัดส่งแล้ว (POD)" ? "เสร็จสิ้น" : "";
      }

      const matchDelay =
        columnFilters.delay.length === 0 ||
        columnFilters.delay.some((filter) =>
          delayText.toLowerCase().includes(filter.toLowerCase())
        );

      return (
        matchLoadId &&
        matchDriver &&
        matchPhone &&
        matchStatus &&
        matchOrigin &&
        matchDestination &&
        matchDistance &&
        matchRisk &&
        matchDelay
      );
    });

    // Apply sorting
    if (sortConfig) {
      filteredData.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortConfig!.key) {
          case "load_id":
            aValue = a.load_id;
            bValue = b.load_id;
            break;
          case "driver_name":
            aValue = a.driver_name;
            bValue = b.driver_name;
            break;
          case "phone":
            aValue = a.phone;
            bValue = b.phone;
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          case "origin":
            aValue = a.locat_recive;
            bValue = b.locat_recive;
            break;
          case "destination":
            aValue = a.locat_deliver;
            bValue = b.locat_deliver;
            break;
          case "date_recive":
            aValue = new Date(a.date_recive);
            bValue = new Date(b.date_recive);
            break;
          case "date_deliver":
            aValue = new Date(a.date_deliver);
            bValue = new Date(b.date_deliver);
            break;
          case "distance":
            aValue = a.distanceInfo?.distance || 0;
            bValue = b.distanceInfo?.distance || 0;
            break;
          case "risk":
            const riskOrder = {
              "High Risk": 3,
              "Moderate Risk": 2,
              "Low Risk": 1,
            };
            aValue = a.riskAssessment
              ? riskOrder[a.riskAssessment.label as keyof typeof riskOrder] || 0
              : 0;
            bValue = b.riskAssessment
              ? riskOrder[b.riskAssessment.label as keyof typeof riskOrder] || 0
              : 0;
            break;
          default:
            aValue = "";
            bValue = "";
        }

        if (aValue < bValue) {
          return sortConfig!.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig!.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  };

  // Toolip
  const getInfoTooltipContent = (column: string) => {
    switch (column) {
      case "distance":
        return {
          title: "ระยะทางที่เหลือและเวลาที่ใช้",
          content: `คำนวณจาก Map ระหว่างตำแหน่งปัจจุบันของรถกับจุดหมาย
• หากสถานะเป็น พร้อมรับงาน,รับงานแล้ว จะใช้พิกัด ต้นทาง  (🏠)
• หากสถานะเป็น ถึงต้นทาง -> เริ่มขนส่ง จะใช้พิกัด ปลายทาง (🏁)`,
        };
      case "risk":
        return {
          title: "ความเสี่ยง",
          content: `🔢 สูตรการคำนวณ:
เวลาที่เหลือ = เวลา Slot - เวลาปัจจุบัน
เวลาคาดการณ์ = ระยะทาง ÷ อัตราเร็ว (50 km/h)

🟢 ต่ำ:
logic: เวลาที่เหลือ > เวลาคาดการณ์ + 1 ชั่วโมง
• ตัวอย่าง: นัด 15:00, ตอนนี้ 10:00 
เวลาที่เหลือ 5 ชม.
เวลาคาดการณ์ 3 ชม.
ดังนั้น 5 > 3+1

🟡 ปานกลาง:
logic: เวลาคาดการณ์ ≤ เวลาที่เหลือ ≤ เวลาคาดการณ์ + 1 ชั่วโมง  
• ตัวอย่าง: นัด 15:00, ตอนนี้ 12:00
เวลาที่เหลือ 3 ชม. 
เวลาคาดการณ์ 2.5 ชม.
ดังนั้น 2.5 ≤ 3 ≤ 2.5+1

🔴 สูง:
logic: เวลาที่เหลือ < เวลาคาดการณ์
• ตัวอย่าง: นัด 15:00, ตอนนี้ 13:00
เวลาที่เหลือ 2 ชม.
เวลาคาดการณ์ 3 ชม.
ดังนั้น 2 < 3

`,
        };
      case "delay":
        return {
          title: "สถานะเวลา",
          content: `• ตรงเวลา: เวลาปัจจุบัน <= เวลาที่กำหนด
• ล่าช้า: เวลาปัจจุบัน > เวลาที่กำหนด (แสดงชั่วโมง:นาที)
• เสร็จสิ้น: สถานะ "จัดส่งแล้ว (POD)"
• Origin Status: เปรียบเทียบกับ date_recive
• Destination Status: เปรียบเทียบกับ date_deliver`,
        };
      default:
        return null;
    }
  };

  const enrichedData = useMemo(() => {
    return filteredData.map((item) => {
      const destination = getDestinationByStatus(item);

      let distanceInfo = null;
      let riskAssessment = null;

      if (item.status !== "จัดส่งแล้ว (POD)") {
        distanceInfo = distanceData[item.load_id] || null;

        if (distanceInfo) {
          riskAssessment = calculateRiskLevel(
            destination.plannedTime,
            distanceInfo.duration
          );
        }
      }

      return {
        ...item,
        destination,
        distanceInfo,
        riskAssessment,
      };
    });
  }, [filteredData, currentTime, distanceData]);

  // Guards: ป้องกันเรียก API ซ้ำ และเช็คว่า data เปลี่ยนจริง
  const isCalculatingRef = useRef(false);
  const lastFingerprintRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateDistanceForAllItems = useCallback(async () => {
    if (filteredData.length === 0 || isCalculatingRef.current) return;

    // สร้าง fingerprint เช็คว่า data เปลี่ยนจริงหรือไม่ (รวมพิกัดปลายทางด้วย)
    const fingerprint = filteredData
      .map((i) =>
        `${i.load_id}:${i.status}:${i.vehicle_info.current_latlng}:${i.latlng_recive}:${i.latlng_deliver}`
      )
      .join("|");
    if (fingerprint === lastFingerprintRef.current) return;

    // ยกเลิก request เก่าที่ยังค้างอยู่
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    isCalculatingRef.current = true;
    lastFingerprintRef.current = fingerprint;

    try {
      const itemsToCalculate = filteredData.filter((item) => {
        if (item.status === "จัดส่งแล้ว (POD)") return false;
        const currentLatLng = item.vehicle_info.current_latlng;
        const destination = getDestinationByStatus(item);
        return currentLatLng && destination.latLng;
      });

      if (itemsToCalculate.length === 0) return;

      // กรองทะเบียนซ้ำ — เรียก API ต่อ plate+destination type เพียงครั้งเดียว
      const plateMap: Record<string, TransportItem[]> = {};
      for (const item of itemsToCalculate) {
        const key = `${item.h_plate}:${getDestinationByStatus(item).type}`;
        if (!plateMap[key]) plateMap[key] = [];
        plateMap[key].push(item);
      }

      const newDistanceData: Record<string, LocationDistance> = {};
      const CONCURRENCY = 5; // จำนวน request พร้อมกันสูงสุด
      const MAX_RETRIES = 2;
      const keys = Object.keys(plateMap);

      // Batch processing with concurrency control (async-parallel best practice)
      for (let i = 0; i < keys.length; i += CONCURRENCY) {
        if (abortController.signal.aborted) break;

        const batch = keys.slice(i, i + CONCURRENCY);

        const results = await Promise.allSettled(
          batch.map(async (key) => {
            const items = plateMap[key];
            const item = items[0];

            const [currentLat, currentLng] = item.vehicle_info.current_latlng
              .split(",")
              .map(Number);
            const [targetLat, targetLng] = getDestinationByStatus(item)
              .latLng.split(",")
              .map(Number);

            if ([currentLat, currentLng, targetLat, targetLng].some(isNaN)) {
              return null;
            }

            // Retry logic
            let lastError: Error | null = null;
            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
              try {
                const distanceInfo = await calculateDistanceFromLongdo(
                  item.h_plate,
                  currentLat,
                  currentLng,
                  targetLat,
                  targetLng,
                  abortController.signal
                );

                if (distanceInfo) {
                  // ใส่ผลลัพธ์ให้ทุก load_id ที่ใช้ทะเบียนเดียวกัน
                  for (const it of items) {
                    newDistanceData[it.load_id] = distanceInfo;
                  }
                }
                return distanceInfo;
              } catch (err) {
                lastError = err as Error;
                if (attempt < MAX_RETRIES) {
                  await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
                }
              }
            }

            console.error(
              `Failed after ${MAX_RETRIES + 1} attempts for plate:`,
              item.h_plate,
              lastError
            );
            return null;
          })
        );

        // Log errors from rejected promises
        results.forEach((result, idx) => {
          if (result.status === "rejected") {
            console.error(`Batch item ${batch[idx]} rejected:`, result.reason);
          }
        });

        // Delay ระหว่าง batch เพื่อไม่ให้ API overload
        if (i + CONCURRENCY < keys.length) {
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      // Merge กับข้อมูลเดิม (ไม่ overwrite ทั้งหมด)
      if (!abortController.signal.aborted) {
        setDistanceData((prev) => ({ ...prev, ...newDistanceData }));
      }
    } finally {
      isCalculatingRef.current = false;
    }
  }, [filteredData, calculateDistanceFromLongdo]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (filteredData.length > 0) {
      calculateDistanceForAllItems();
    }
  }, [filteredData, calculateDistanceForAllItems]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "พร้อมรับงาน":
      case "รับงาน":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ถึงต้นทาง":
      case "เริ่มขึ้นสินค้า":
      case "ขึ้นสินค้าเสร็จ":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "เริ่มขนส่ง":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "ถึงปลายทาง":
      case "เริ่มลงสินค้า":
      case "ลงสินค้าเสร็จ":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "จัดส่งแล้ว (POD)":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDelayStatus = (plannedTime: string, currentStatus: string) => {
    const planned = new Date(plannedTime);
    const now = currentTime;
    if (currentStatus !== "จัดส่งแล้ว (POD)") {
      if (now > planned) {
        const delayMinutes = Math.floor(
          (now.getTime() - planned.getTime()) / (1000 * 60)
        );
        return {
          isDelayed: true,
          delayTime: delayMinutes,
          message: `ล่าช้า ${Math.floor(delayMinutes / 60)} ชม. ${delayMinutes % 60
            } น.`,
        };
      } else {
        return {
          isDelayed: false,
          delayTime: 0,
          message: "ตรงเวลา",
        };
      }
    } else {
      return {
        isDelayed: false,
        delayTime: 0,
        message: "เสร็จสิ้น",
      };
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "d/M/yy, HH:mm");
    } catch {
      return dateString;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      // ยกเลิก request เก่าที่ยังค้างอยู่
      abortControllerRef.current?.abort();

      // ล้างข้อมูลเก่า + reset fingerprint เพื่อให้คำนวณใหม่ได้
      setDistanceData({});
      lastFingerprintRef.current = "";
      isCalculatingRef.current = false;

      if (onRefreshData) {
        await onRefreshData();
      }

      setLastUpdated(new Date());
      setCurrentTime(new Date());

      await new Promise((resolve) => setTimeout(resolve, 300));

      await calculateDistanceForAllItems();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  };

  const exportToExcel = () => {
    try {
      const dataToExport = applyColumnFilters(enrichedData);

      const now = new Date();
      const fileName = `${format(now, "yyyy-MM-dd_HH-mm")}_updatestatus.csv`;

      const headers = [
        "รหัสงาน",
        "พนักงานขับรถ",
        "ทะเบียนรถ",
        "เบอร์โทร",
        "สถานะ",
        "สถานะจีพีเอสรถ",
        "ต้นทาง",
        "เวลาขึ้นสินค้า",
        "ปลายทาง",
        "เวลาส่งสินค้า",
        "ระยะทาง (กม.)",
        "เวลาที่ใช้ (นาที)",
        "ความเสี่ยง",
      ];

      const csvData = dataToExport.map((item) => {
        let delayStatus;
        const originStatuses = ["พร้อมรับงาน", "รับงาน"];
        const destinationStatuses = [
          "ถึงต้นทาง",
          "เริ่มขึ้นสินค้า",
          "ขึ้นสินค้าเสร็จ",
          "เริ่มขนส่ง",
          "ถึงปลายทาง",
          "ยื่นเอกสาร",
          "เริ่มลงสินค้า",
          "ลงสินค้าเสร็จ",
          "ได้รับเอกสารคืน",
        ];

        if (originStatuses.includes(item.status)) {
          delayStatus = getDelayStatus(item.date_recive, item.status);
        } else if (destinationStatuses.includes(item.status)) {
          delayStatus = getDelayStatus(item.date_deliver, item.status);
        } else {
          delayStatus = {
            isDelayed: false,
            delayTime: 0,
            message: item.status === "จัดส่งแล้ว (POD)" ? "เสร็จสิ้น" : "",
          };
        }

        return [
          item.load_id,
          item.driver_name,
          item.h_plate,
          item.phone,
          item.status,
          item.vehicle_info.status || "-",
          item.locat_recive,
          formatDateTime(item.date_recive),
          item.locat_deliver,
          formatDateTime(item.date_deliver),
          item.distanceInfo?.distance || "0",
          item.distanceInfo?.duration || "0",
          item.riskAssessment
            ? item.riskAssessment.level === "low"
              ? "ต่ำ"
              : item.riskAssessment.level === "moderate"
                ? "ปานกลาง"
                : "สูง"
            : "-",
        ];
      });

      const csvContent = [headers, ...csvData]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(
        `✅ ส่งออกข้อมูล ${dataToExport.length} รายการสำเร็จ: ${fileName}`
      );
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการส่งออกข้อมูล:", error);
      alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล กรุณาลองใหม่อีกครั้ง");
    }
  };

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-12">
        <Truck size={64} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          ไม่พบรายงานสถานะขนส่งวันนี้
        </h3>
        <p className="text-gray-500">ไม่มีงานขนส่งที่กำหนดไว้สำหรับวันนี้</p>
      </div>
    );
  }

  return (
    // Datatable Main
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-[clamp(1rem,1.8vw,1.25rem)] font-bold text-gray-800 flex items-center gap-2">
            <Truck size={24} className="text-blue-600" />
            รายงานสถานะขนส่ง
          </h2>
          <p className="text-gray-600 text-[clamp(0.75rem,1vw,0.875rem)] mt-1">
            งานขนส่งวันนี้ • พบ {enrichedData.length} รายการ
          </p>
        </div>
      </div>

      <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${showDropdown ? "min-h-screen" : "max-h-[98vh]"} flex flex-col`}>
        {/* Header */}
        <div className="p-[0.55rem] bg-gradient-to-r from-gray-800 to-gray-700 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[clamp(0.9rem,1.5vw,1.125rem)] flex items-center gap-2">
              <Grid3X3 size={20} />
              ตารางสถานะ • {applyColumnFilters(enrichedData).length} จาก{" "}
              {enrichedData.length} รายการ
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[clamp(0.65rem,0.9vw,0.75rem)] text-gray-300 flex items-center gap-1 mr-5">
                <span className="hidden sm:inline">อัปเดตล่าสุด:</span>
                <span className="font-mono text-white">{lastUpdated.toLocaleDateString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              </span>
              <button
                onClick={exportToExcel}
                disabled={refreshing}
                className="hidden lg:flex items-center gap-2 px-[0.75em] py-[0.375em] bg-emerald-600 hover:bg-emerald-800 rounded-md text-[clamp(0.75rem,1vw,0.875rem)] transition-colors font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <FileSpreadsheet
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Excel..." : "Excel"}
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-[0.75em] py-[0.375em] bg-gray-600 hover:bg-gray-500 rounded-md text-[clamp(0.75rem,1vw,0.875rem)] transition-colors font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "รีเฟรช..." : "รีเฟรช"}
              </button>
            </div>
          </div>
        </div>

        {/* DataTable Container */}
        <div className="flex-1 overflow-auto">
          <div className="h-full">
            <table className="w-full text-[clamp(0.65rem,0.85vw,0.75rem)] border-collapse">
              <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-opacity-95">
                <tr>
                  <th className="hidden px-[0.375em] py-[0.375em] text-left font-semibold text-gray-700 border-r border-gray-200 min-w-[7em] max-w-[10em]">
                    <div className="space-y-1">
                      <button
                        onClick={() => handleSort("load_id")}
                        className="flex items-center gap-1 text-[clamp(0.65rem,0.85vw,0.75rem)] hover:text-blue-600 font-medium"
                      >
                        <span>รายการ</span>
                        {getSortIcon("load_id")}
                      </button>
                      <FilterDropdown
                        column="load_id"
                        values={getUniqueValues("load_id")}
                        selectedValues={columnFilters.load_id}
                        onFilterChange={handleFilterChange}
                        onClearFilter={clearFilter}
                        showDropdown={showDropdown}
                        onToggleDropdown={setShowDropdown}
                      />
                    </div>
                  </th>

                  {/* Driver Column */}
                  <th className="px-[0.25em] py-[0.25em] text-left font-semibold text-gray-700 border-r border-gray-200 min-w-[4em] max-w-[8em]">
                    <div className="space-y-0.5">
                      <button
                        onClick={() => handleSort("driver_name")}
                        className="flex items-center gap-1 text-[clamp(0.65rem,0.85vw,0.75rem)] hover:text-blue-600"
                      >
                        <span>พจส.</span>
                        {getSortIcon("driver_name")}
                      </button>
                      <FilterDropdown
                        column="driver_name"
                        values={getUniqueValues("driver_name")}
                        selectedValues={columnFilters.driver_name}
                        onFilterChange={handleFilterChange}
                        onClearFilter={clearFilter}
                        showDropdown={showDropdown}
                        onToggleDropdown={setShowDropdown}
                      />
                    </div>
                  </th>

                  <th className="px-[0.5em] py-[0.5em] text-center font-semibold text-gray-700 border-r border-gray-200 min-w-[5em] max-w-[7em]">
                    <div className="space-y-1">
                      <button
                        onClick={() => handleSort("phone")}
                        className="flex items-center gap-1 text-[clamp(0.65rem,0.85vw,0.75rem)] hover:text-blue-600 mx-auto"
                      >
                        <span>เบอร์</span>
                        {getSortIcon("phone")}
                      </button>
                    </div>
                  </th>

                  {/* Status Column */}
                  <th className="px-[0.5em] py-[0.5em] text-center font-semibold text-gray-700 border-r border-gray-200 min-w-[3em] max-w-auto">
                    <div className="space-y-1">
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center gap-1 text-[clamp(0.65rem,0.85vw,0.75rem)] hover:text-blue-600 mx-auto"
                      >
                        <span>สถานะ</span>
                        {getSortIcon("status")}
                      </button>
                      <FilterDropdown
                        column="status"
                        values={getUniqueValues("status")}
                        selectedValues={columnFilters.status}
                        onFilterChange={handleFilterChange}
                        onClearFilter={clearFilter}
                        showDropdown={showDropdown}
                        onToggleDropdown={setShowDropdown}
                      />
                    </div>
                  </th>

                  {/* Origin Column */}
                  <th className="px-[0.25em] py-[0.25em] text-left font-semibold text-gray-700 border-r border-gray-200 min-w-[8em] max-w-[15em]">
                    <div className="space-y-0.5">
                      <button
                        onClick={() => handleSort("origin")}
                        className="flex items-center gap-1 text-[clamp(0.65rem,0.85vw,0.75rem)] hover:text-blue-600"
                      >
                        <span>ต้นทาง</span>
                        {getSortIcon("origin")}
                      </button>
                      <FilterDropdown
                        column="origin"
                        values={getUniqueValues("origin")}
                        selectedValues={columnFilters.origin}
                        onFilterChange={handleFilterChange}
                        onClearFilter={clearFilter}
                        showDropdown={showDropdown}
                        onToggleDropdown={setShowDropdown}
                      />
                    </div>
                  </th>

                  {/* Receive Time Column */}
                  <th className="px-[0.5em] py-[0.5em] text-center font-semibold text-gray-700 border-r border-gray-200 min-w-[5em] max-w-[8em]">
                    <button
                      onClick={() => handleSort("date_recive")}
                      className="flex items-center gap-1 text-[clamp(0.65rem,0.85vw,0.75rem)] hover:text-blue-600 mx-auto"
                    >
                      <span>
                        วันที่และเวลา
                        <br />
                        ขึ้นสินค้า
                      </span>
                      {getSortIcon("date_recive")}
                    </button>
                  </th>

                  {/* Destination Column */}
                  <th className="px-[0.25em] py-[0.25em] text-left font-semibold text-gray-700 border-r border-gray-200 min-w-[8em] max-w-[15em]">
                    <div className="space-y-0.5">
                      <button
                        onClick={() => handleSort("destination")}
                        className="flex items-center gap-1 text-[clamp(0.65rem,0.85vw,0.75rem)] hover:text-blue-600"
                      >
                        <span>ปลายทาง</span>
                        {getSortIcon("destination")}
                      </button>
                      <FilterDropdown
                        column="destination"
                        values={getUniqueValues("destination")}
                        selectedValues={columnFilters.destination}
                        onFilterChange={handleFilterChange}
                        onClearFilter={clearFilter}
                        showDropdown={showDropdown}
                        onToggleDropdown={setShowDropdown}
                      />
                    </div>
                  </th>

                  {/* Deliver Time Column */}
                  <th className="px-[0.5em] py-[0.5em] text-center font-semibold text-gray-700 border-r border-gray-200 min-w-[5em] max-w-[8em]">
                    <button
                      onClick={() => handleSort("date_deliver")}
                      className="flex items-center gap-1 text-[clamp(0.65rem,0.85vw,0.75rem)] hover:text-blue-600 mx-auto"
                    >
                      <span>
                        วันที่และเวลา
                        <br />
                        ลงสินค้า
                      </span>
                      {getSortIcon("date_deliver")}
                    </button>
                  </th>

                  {/* Distance Column with Info */}
                  <th className="px-[0.25em] py-[0.25em] text-center font-semibold text-gray-700 border-r border-gray-200 min-w-[4em] max-w-[6em]">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleSort("distance")}
                          className="flex items-center gap-1 text-[clamp(0.65rem,0.85vw,0.75rem)] hover:text-blue-600"
                        >
                          <span>ระยะทางที่เหลือ</span>
                          {getSortIcon("distance")}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowInfoTooltip(
                                showInfoTooltip === "distance"
                                  ? null
                                  : "distance"
                              )
                            }
                            className="cursor-pointer text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <Info size={12} />
                          </button>
                          {showInfoTooltip === "distance" && (
                            <div
                              className="fixed bg-gray-900 text-white text-[clamp(0.75rem,1vw,0.875rem)] rounded-lg p-[1em] shadow-2xl z-[9999] max-w-[90vw] sm:max-w-md border border-gray-700"
                              style={{
                                top: "50%",
                                left: "50%",
                                transform: "translate(0%, 0%)",
                              }}
                            >
                              <h4 className="font-semibold mb-3 text-base text-yellow-300">
                                {getInfoTooltipContent("distance")?.title}
                              </h4>
                              <div className="whitespace-pre-line text-[clamp(0.75rem,1vw,0.875rem)] leading-relaxed text-gray-100 text-left">
                                {getInfoTooltipContent("distance")?.content}
                              </div>
                              <button
                                onClick={() => setShowInfoTooltip(null)}
                                className="absolute cursor-pointer top-3 right-3 text-gray-400 hover:text-white transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </th>

                  {/* Risk Column with Info */}
                  <th className="px-[0.25em] py-[0.25em] text-center font-semibold text-gray-700 border-r border-gray-200 min-w-[4em] max-w-[6em]">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleSort("risk")}
                          className="flex items-center gap-1 text-[clamp(0.65rem,0.85vw,0.75rem)] hover:text-blue-600"
                        >
                          <span>ความเสี่ยง</span>
                          {getSortIcon("risk")}
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowInfoTooltip(
                                showInfoTooltip === "risk" ? null : "risk"
                              )
                            }
                            className="cursor-pointer text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <Info size={12} />
                          </button>
                          {showInfoTooltip === "risk" && (
                            <div
                              className="fixed bg-gray-900 text-white text-[clamp(0.65rem,0.85vw,0.75rem)] rounded-lg p-[1em] shadow-2xl z-[9999] max-w-[90vw] sm:max-w-md border border-gray-700"
                              style={{
                                top: "50%",
                                left: "50%",
                                transform: "translate(0%, 0%)",
                              }}
                            >
                              <h4 className="font-semibold mb-3 text-base text-yellow-300">
                                {getInfoTooltipContent("risk")?.title}
                              </h4>
                              <div className="whitespace-pre-line text-md leading-relaxed text-gray-100 text-left">
                                {getInfoTooltipContent("risk")?.content}
                              </div>
                              <button
                                onClick={() => setShowInfoTooltip(null)}
                                className="absolute cursor-pointer top-3 right-3 text-gray-400 hover:text-white transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <FilterDropdown
                        column="risk"
                        values={getUniqueValues("risk")}
                        selectedValues={columnFilters.risk}
                        onFilterChange={handleFilterChange}
                        onClearFilter={clearFilter}
                        showDropdown={showDropdown}
                        onToggleDropdown={setShowDropdown}
                      />
                    </div>
                  </th>

                  {/* Map Column */}
                  <th className="px-[0.25em] py-[0.25em] text-center font-semibold text-gray-700 border-r border-gray-200 min-w-[3em] max-w-[5em]">
                    <div className="flex items-center justify-center">
                      <span className="text-[clamp(0.65rem,0.9vw,0.75rem)]">
                        จัดการ
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="bg-white divide-y divide-gray-100">
                {applyColumnFilters(enrichedData).map((item, index) => {
                  // เช็ค delay status ตามสถานะรถ
                  let delayStatus;
                  const originStatuses = ["พร้อมรับงาน", "รับงาน"];
                  const destinationStatuses = [
                    "ถึงต้นทาง",
                    "เริ่มขึ้นสินค้า",
                    "ขึ้นสินค้าเสร็จ",
                    "เริ่มขนส่ง",
                  ];

                  if (originStatuses.includes(item.status)) {
                    delayStatus = getDelayStatus(
                      item.date_recive,
                      item.status
                    );
                  } else if (destinationStatuses.includes(item.status)) {
                    delayStatus = getDelayStatus(
                      item.date_deliver,
                      item.status
                    );
                  } else {
                    delayStatus = {
                      isDelayed: false,
                      delayTime: 0,
                      message:
                        item.status === "จัดส่งแล้ว (POD)" ? "เสร็จสิ้น" : "",
                    };
                  }

                  return (
                    <tr
                      key={item.load_id}
                      className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                    >
                      {/* Load ID */}
                      <td className="hidden px-[0.375em] py-[0.25em] border-r border-gray-100">
                        <div
                          className="font-semibold text-gray-900 text-[clamp(0.65rem,0.85vw,0.75rem)] truncate"
                          title={item.load_id}
                        >
                          {item.load_id}
                        </div>
                      </td>

                      {/* Driver & Plate */}
                      <td className="px-[0.25em] py-[0.25em] border-r border-gray-100">
                        <div className="space-y-0.25">
                          <div
                            className="text-gray-900 text-[clamp(0.65rem,0.85vw,0.75rem)] cursor-pointer hover:text-blue-600 truncate"
                            title={`${item.driver_name}, ${item.h_plate}`}
                            onClick={() =>
                              Swal.fire({
                                title: "Information",
                                html: `<p>รหัสขนส่ง: ${item.load_id}</p>
                                  <br/>
                                        <p>${item.locat_recive} - ${item.locat_deliver}</p>
                                        <p>${item.h_plate}/${item.t_plate}</p>
                                        <p>${item.driver_name}</p>
                                        <p>${item.phone}</p>
                                        <p>แผนที่รถ:<a target="_blank" style="color:blue;" href="https://www.google.com/maps/dir/?api=1&origin=${item.latlng_recive}&destination=${item.latlng_deliver}&waypoints=${item.vehicle_info.current_latlng}
"> ${item.vehicle_info.current_latlng}</a> </p>`,
                                icon: "info",
                                confirmButtonText: "ตกลง",
                              })
                            }
                          >
                            {item.driver_name}, {item.h_plate}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-[0.25em] py-[0.25em] text-center border-r border-gray-100">
                        <a
                          href={`tel:${item.phone}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-[clamp(0.65rem,0.85vw,0.75rem)] transition-colors truncate block"
                          title={item.phone}
                        >
                          {item.phone}
                        </a>
                      </td>

                      {/* Status */}
                      <td className="px-[0.25em] py-[0.25em] text-center border-r border-gray-100">
                        <span
                          className={`inline-flex px-[0.375em] rounded-full text-[clamp(0.7rem,0.95vw,0.8rem)] ${getStatusColor(
                            item.status
                          )} max-w-full`}
                          title={item.vehicle_info.status}
                        >
                          <span className="truncate">{item.status}</span>
                        </span>
                      </td>

                      {/* Origin */}
                      <td className="px-[0.25em] py-[0.25em] border-r border-gray-100">
                        <div
                          className="text-gray-900 text-[clamp(0.65rem,0.85vw,0.75rem)] truncate w-40"
                          title={item.locat_recive}
                        >
                          {item.locat_recive}
                        </div>
                      </td>

                      {/* Origin Time */}
                      <td className="px-[0.25em] py-[0.25em] text-center border-r border-gray-100">
                        <div
                          className="text-gray-600 text-[clamp(0.65rem,0.85vw,0.75rem)]"
                          title={formatDateTime(item.date_recive)}
                        >
                          <div>
                            {format(parseISO(item.date_recive), "d/M")},{" "}
                            {format(parseISO(item.date_recive), "HH:mm")}
                          </div>
                          {/* <div className="text-sm text-gray-500">
                             
                            </div> */}
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="px-[0.25em] py-[0.25em] border-r border-gray-100">
                        <div
                          className="text-gray-900 text-[clamp(0.65rem,0.85vw,0.75rem)] truncate w-40"
                          title={item.locat_deliver}
                        >
                          {item.locat_deliver}
                        </div>
                      </td>

                      {/* Destination Time */}
                      <td className="px-[0.25em] py-[0.25em] text-center border-r border-gray-100">
                        <div
                          className="text-gray-600 text-[clamp(0.65rem,0.85vw,0.75rem)]"
                          title={formatDateTime(item.date_deliver)}
                        >
                          <div>
                            {format(parseISO(item.date_deliver), "d/M")},{" "}
                            {format(parseISO(item.date_deliver), "HH:mm")}
                          </div>
                          {/* <div className="text-sm text-gray-500">
                             
                            </div> */}
                        </div>
                      </td>

                      {/* Distance & Time Remaining */}
                      {(() => {
                        // ตรวจสอบเวลาอัปเดต GPS (ห่างจากปัจจุบัน 1 ชั่วโมงหรือไม่)
                        const gpsUpdatedAt = new Date(
                          item.vehicle_info.gps_updated_at
                        ).getTime();
                        const currentTimeMs = currentTime.getTime();
                        const oneHourInMs = 20 * 60 * 1000; // 20 นาที
                        const isGpsOutdated =
                          currentTimeMs - gpsUpdatedAt > oneHourInMs;

                        return (
                          <>
                            <td className="px-[0.25em] py-[0.25em] text-center border-r border-gray-100">
                              {isGpsOutdated ? (
                                <span className="text-gray-400 text-[clamp(0.65rem,0.85vw,0.75rem)]">
                                  -
                                </span>
                              ) : item.distanceInfo ? (
                                <div
                                  className="space-y-0.5"
                                  title={`${item.distanceInfo.distance.toFixed(
                                    2
                                  )} กิโลเมตร, ${item.distanceInfo.duration
                                    } นาที`}
                                >
                                  <div className="text-gray-900 text-[clamp(0.65rem,0.85vw,0.75rem)] truncate max-w-auto">
                                    {item.distanceInfo.distance.toFixed(2)}{" "}
                                    กม.
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[clamp(0.65rem,0.85vw,0.75rem)]">
                                  -
                                </span>
                              )}
                            </td>
                            {/* Risk Assessment */}
                            <td className="px-[0.25em] py-[0.25em] text-center border-r border-gray-100">
                              {isGpsOutdated ? (
                                <div className="flex items-center justify-center">
                                  <span
                                    className="inline-flex items-center px-[0.5em] py-[0.25em] rounded-lg text-[clamp(0.65rem,0.85vw,0.75rem)] bg-gray-50 text-red-700 font-medium"
                                    title={`ไม่มีสัญญาณ GPS ล่าสุด : ${item.vehicle_info.gps_updated_at}`}
                                  >
                                    ⚠️GPS
                                  </span>
                                </div>
                              ) : item.riskAssessment ? (
                                <div className="flex items-center justify-center">
                                  <span
                                    className={`inline-flex items-center px-[0.25em] rounded-lg text-[clamp(0.65rem,0.85vw,0.75rem)] ${item.riskAssessment.color} w-auto`}
                                    title={item.riskAssessment.label}
                                  >
                                    <span className="mr-0.5">
                                      {item.riskAssessment.icon}
                                    </span>
                                    <span className="truncate text-[clamp(0.7rem,0.95vw,0.8rem)]">
                                      {item.riskAssessment.level === "low"
                                        ? "ต่ำ"
                                        : item.riskAssessment.level ===
                                          "moderate"
                                          ? "ปานกลาง"
                                          : "สูง"}
                                    </span>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[10px]">
                                  {(item.latlng_recive === "#N/A" ||
                                    item.latlng_deliver === "#N/A") && item.status !== "จัดส่งแล้ว (POD)"
                                    ? "ไม่มีพิกัดสถานที่"
                                    : "-"}
                                </span>
                              )}
                            </td>
                          </>
                        );
                      })()}

                      {/* Map Column */}
                      <td className="px-[0.25em] py-[0.25em] text-center border-r border-gray-100">
                        <div className="flex gap-1 justify-center items-center">
                          <button
                            onClick={() => handleView(item)}
                            className="inline-flex items-center cursor-pointer justify-center p-[0.25em] text-blue-600 hover:text-blue-800 hover:bg-blue-50 hover:scale-110 rounded transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenMap(item)}
                            className="inline-flex items-center cursor-pointer justify-center p-[0.25em] text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 hover:scale-110 rounded transition-colors"
                            title="เปิดแผนที่"
                          >
                            <Map size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* No Results */}
            {applyColumnFilters(enrichedData).length === 0 && (
              <div className="text-center py-[4rem] border-t border-gray-200">
                <Filter size={64} className="mx-auto text-gray-300 mb-6" />
                <h3 className="text-[clamp(1rem,1.8vw,1.25rem)] font-medium text-gray-700 mb-3">
                  ไม่พบข้อมูลที่ตรงกับการค้นหา
                </h3>
                <p className="text-gray-500 text-[clamp(0.9rem,1.3vw,1.125rem)]">
                  ลองเปลี่ยนเงื่อนไขการกรองข้อมูล
                </p>
              </div>
            )}
          </div>
        </div>
      </div>


      {showInfoTooltip && (
        <div
          className="fixed inset-0 bg-opacity-30 z-[9998]"
          onClick={() => setShowInfoTooltip(null)}
        />
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-[40]"
          onClick={() => setShowDropdown(null)}
        />
      )}

      {modalView.show && modalView.job && (
        <AdminView
          jobView={modalView.job}
          closeModal={handleCloseView}
          refreshTable={onRefreshData || (() => { })}
        />
      )}

      {showMapModal && selectedJobForMap && (
        <AdminMap
          jobView={selectedJobForMap}
          closeModal={handleCloseMap}
          refreshTable={() => { }}
        />
      )}
    </div>
  );
};
