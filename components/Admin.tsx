"use client";

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { safeMap, safeFilter, safeFind, safeLength, normalizeApiResponse } from "../lib/arrayHelpers";
import {
  Search,
  Filter,
  Calendar,
  User,
  Truck,
  Package,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  MapPin,
  Clock,
  NotebookPen,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  BookOpenCheck,
  CircleX,
  Check,
  FileSpreadsheet,
  ChartPie,
  BookUser,
  Table,
  MessageCircleQuestion,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import type { TransportItem } from "@/lib/type";
import { DateInput } from "@/components/ui/date-input";

// Dynamic imports for heavy components (bundle-dynamic-imports)
const AdminView = lazy(() => import("@/components/AdminView").then(m => ({ default: m.AdminView })));
const AdminCreateNew = lazy(() => import("@/components/AdminCreateNew").then(m => ({ default: m.AdminCreateNew })));
const AdminMap = lazy(() => import("@/components/AdminMap").then(m => ({ default: m.AdminMap })));
const DelayReasonModal = lazy(() => import("@/components/DelayReasonModal").then(m => ({ default: m.DelayReasonModal })));
const AdminDashboard = lazy(() => import("@/components/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const TransportStatusReport = lazy(() => import("@/components/TransportStatusReport").then(m => ({ default: m.TransportStatusReport })));

// Loading component for Suspense fallback (rendering-hoist-jsx)
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    <span className="ml-2 text-gray-600">กำลังโหลด...</span>
  </div>
);

const itemsPerPage = 10;

const toThaiDate = (date: Date): string => {
  const thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  return thaiDate.toISOString().split("T")[0];
};

// Hoist static date calculations (rendering-hoist-jsx)
const getInitialDates = () => {
  const now = new Date();
  return {
    today: toThaiDate(now),
    sevenDaysAgo: toThaiDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
    tomorrow: toThaiDate(new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)),
  };
};

const initialDates = getInitialDates();

// Hoist static background elements (rendering-hoist-jsx)
// Respects prefers-reduced-motion for accessibility (ux: reduced-motion)
const BackgroundElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200/30 rounded-full motion-safe:animate-pulse" />
    <div className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200/20 rounded-full" />
    <div className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300/25 rounded-full" />
    <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300/30 rounded-full" />
  </div>
);

// Hoist status color mapping for O(1) lookup (js-index-maps)
const STATUS_COLORS: Record<string, string> = {
  "พร้อมรับงาน": "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200",
  "รับงาน": "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200",
  "ถึงต้นทาง": "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200",
  "เริ่มขึ้นสินค้า": "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200",
  "ขึ้นสินค้าเสร็จ": "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200",
  "เริ่มขนส่ง": "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-300",
  "ถึงปลายทาง": "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-200",
  "เริ่มลงสินค้า": "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-200",
  "ลงสินค้าเสร็จ": "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-200",
  "จัดส่งแล้ว (POD)": "bg-gradient-to-r from-green-100 to-green-200 text-green-900 border-green-300",
  "อบรมที่บริษัท": "bg-gradient-to-r from-red-50 to-red-100 text-red-900 border-red-200",
  "ซ่อม": "bg-gradient-to-r from-red-50 to-red-100 text-red-900 border-red-200",
  "ยกเลิก": "bg-gradient-to-r from-red-50 to-red-100 text-red-900 border-red-200",
  "ตกคิว": "bg-gradient-to-r from-red-50 to-red-100 text-red-900 border-red-200",
};

const DEFAULT_STATUS_COLOR = "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200";

// Status Sets for O(1) lookup (js-set-map-lookups)
const CANCEL_STATUSES = new Set(["ยกเลิก", "ตกคิว", "ซ่อม", "อบรมที่บริษัท"]);
const IN_TRANSIT_STATUSES = new Set([
  "รับงาน", "ถึงต้นทาง", "เริ่มขึ้นสินค้า", "ขึ้นสินค้าเสร็จ",
  "เริ่มขนส่ง", "ถึงปลายทาง", "เริ่มลงสินค้า", "ลงสินค้าเสร็จ"
]);



export const Admintool = () => {
  const [activeView, setActiveView] = useState<'table' | 'dashboard' | 'report_status'>('table');
  const [listname, setlistname] = useState<string[]>([]);
  // Use lazy state initialization for complex initial values (rerender-lazy-state-init)
  const [filters, setFilters] = useState(() => ({
    date_plan: { date_plan_start: initialDates.sevenDaysAgo, date_plan_end: initialDates.tomorrow },
    load_id: "",
    driver_name: "",
    h_plate: "",
    status: "",
  }));
  const [showDriverSuggestions, setShowDriverSuggestions] = useState(false);
  const [filteredDriverNames, setFilteredDriverNames] = useState<string[]>([]);
  const [showLoadIdSuggestions, setShowLoadIdSuggestions] = useState(false);
  const [filteredLoadIds, setFilteredLoadIds] = useState<string[]>([]);
  const [transportData, setTransportData] = useState<TransportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [listCustomer, setListCustomer] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof TransportItem | null>(
    null
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [cancel, setCancel] = useState("ยกเลิก");
  const [deleteAlert, setDeleteAlert] = useState<{
    show: boolean;
    load_id: string;
  }>({
    show: false,
    load_id: "",
  });
  const [modalView, setmodalView] = useState<{
    show: boolean;
    job: TransportItem | null;
  }>({
    show: false,
    job: null,
  });

  const [modalCreate, setmodalCreate] = useState<{
    show: boolean;
  }>({
    show: false,
  });

  const [delayReasonModal, setDelayReasonModal] = useState<{
    show: boolean;
  }>({
    show: false,
  });

  const [modalMap, setmodalMap] = useState<{
    show: boolean;
    job: TransportItem | null;
  }>({
    show: false,
    job: null,
  });


  // Parallel fetch on initialization (async-parallel)
  useEffect(() => {
    const initializeData = async () => {
      setListCustomer(["บริษัท นีโอ แฟคทอรี่ จำกัด"]);

      // Run fetches in parallel
      const [authResult] = await Promise.allSettled([
        fetch("/api/auth", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }).then(res => res.ok ? res.json() : null)
      ]);

      if (authResult.status === 'fulfilled' && authResult.value?.users) {
        const username = authResult.value.users.map((user: { username: string }) => user.username);
        setlistname(username);
      }
    };

    initializeData();
  }, []);



  // Memoized search handler (rerender-functional-setstate)
  const handleSearch = useCallback(async () => {
    setLoading(true);
    const { date_plan, ...restFilters } = filters;
    const filtered = Object.fromEntries(
      Object.entries(restFilters).filter(
        ([_, value]) => value !== "" && value !== null && value !== undefined
      )
    );

    const searchParams = new URLSearchParams();

    Object.entries(filtered).forEach(([key, value]) => {
      if (typeof value === "string" && value.includes(",")) {
        value.split(",").forEach((v) => {
          searchParams.append(key, v.trim());
        });
      } else {
        searchParams.append(key, String(value));
      }
    });

    if (date_plan?.date_plan_start) {
      searchParams.append("date_plan_start", date_plan.date_plan_start);
    }
    if (date_plan?.date_plan_end) {
      searchParams.append("date_plan_end", date_plan.date_plan_end);
    }

    const queryString = searchParams.toString();
    try {
      const access_token = localStorage.getItem("access_token");
      const res = await fetch("/api/admin", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
          query: queryString,
        },
      });
      const data = await res.json();

      const normalizedData = normalizeApiResponse(data);
      setTransportData(normalizedData.jobs);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleDriverNameChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      driver_name: value,
    }));

    const names = value.split(",").map((name) => name.trim());
    const lastInputName = names[names.length - 1];

    if (lastInputName.length > 0) {

      const filtered = listname.filter((name) => {
        const isAlreadySelected = names
          .slice(0, -1)
          .some(
            (selectedName) => selectedName.toLowerCase() === name.toLowerCase()
          );

        return (
          !isAlreadySelected &&
          name.toLowerCase().includes(lastInputName.toLowerCase())
        );
      });
      setFilteredDriverNames(filtered);
      setShowDriverSuggestions(filtered.length > 0);
    } else {

      const selectedNames = names.slice(0, -1);
      const availableNames = listname.filter(
        (name) =>
          !selectedNames.some(
            (selectedName) => selectedName.toLowerCase() === name.toLowerCase()
          )
      );
      setFilteredDriverNames(availableNames);
      setShowDriverSuggestions(availableNames.length > 0);
    }
  };

  const handleSelectDriverName = (name: string) => {
    const currentValue = filters.driver_name;
    const names = currentValue.split(",").map((n) => n.trim());

    names[names.length - 1] = name;

    const newValue = names.join(", ");
    setFilters((prev) => ({
      ...prev,
      driver_name: newValue,
    }));
    setShowDriverSuggestions(false);
  };

  const handleDriverBlur = () => {
    setTimeout(() => {
      setShowDriverSuggestions(false);
    }, 200);
  };

  const handleLoadIdChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      load_id: value,
    }));

    const loadIds = value.split(",").map((id) => id.trim());
    const lastInputId = loadIds[loadIds.length - 1];

    const uniqueLoadIds = [...new Set(
      safeMap(transportData, (item: TransportItem) => item.load_id)
    )];

    if (lastInputId.length > 0) {
      const filtered = uniqueLoadIds.filter((loadId) => {
        const isAlreadySelected = loadIds
          .slice(0, -1)
          .some(
            (selectedId) => selectedId.toLowerCase() === loadId.toLowerCase()
          );

        return (
          !isAlreadySelected &&
          loadId.toLowerCase().includes(lastInputId.toLowerCase())
        );
      });
      setFilteredLoadIds(filtered);
      setShowLoadIdSuggestions(filtered.length > 0);
    } else {
      const selectedIds = loadIds.slice(0, -1);
      const availableIds = uniqueLoadIds.filter(
        (loadId) =>
          !selectedIds.some(
            (selectedId) => selectedId.toLowerCase() === loadId.toLowerCase()
          )
      );
      setFilteredLoadIds(availableIds.slice(0, 10));
      setShowLoadIdSuggestions(availableIds.length > 0);
    }
  };

  const handleSelectLoadId = (loadId: string) => {
    const currentValue = filters.load_id;
    const loadIds = currentValue.split(",").map((id) => id.trim());

    loadIds[loadIds.length - 1] = loadId;

    const newValue = loadIds.join(", ");
    setFilters((prev) => ({
      ...prev,
      load_id: newValue,
    }));
    setShowLoadIdSuggestions(false);
  };


  const handleLoadIdBlur = () => {
    setTimeout(() => {
      setShowLoadIdSuggestions(false);
    }, 200);
  };

  // Memoized reset handler (rerender-functional-setstate)
  const resetFilters = useCallback(() => {
    setFilters({
      date_plan: { date_plan_start: initialDates.sevenDaysAgo, date_plan_end: initialDates.tomorrow },
      load_id: "",
      driver_name: "",
      h_plate: "",
      status: "",
    });
    setTransportData([]);
    setShowDriverSuggestions(false);
    setShowLoadIdSuggestions(false);
    setFilteredDriverNames([]);
    setFilteredLoadIds([]);
  }, []);

  const pendingDelayReasons = useMemo(() => {
    return transportData.filter(item => {
      const originDelay = item.dw_jobdata_info?.client_kpi_origin === "delay";
      const destinationDelay = item.dw_jobdata_info?.client_kpi_destination === "delay";
      const originReasonMissing = !item.reason_kpi_origin || item.reason_kpi_origin.trim() === "";
      const destinationReasonMissing = !item.reason_kpi_destination || item.reason_kpi_destination.trim() === "";

      return ((originDelay && originReasonMissing) || (destinationDelay && destinationReasonMissing)) && item.status == "จัดส่งแล้ว (POD)";
    }).length;
  }, [transportData]);

  // Memoized delay reason handler (rerender-functional-setstate)
  const delayReasonCode = useCallback(async () => {
    setDelayReasonModal({ show: true });
  }, []);

  const handleDelayReasonSave = useCallback(async (modifiedItems: TransportItem[]) => {
    try {
      setTransportData(prevData =>
        prevData.map(originalItem => {
          const modifiedItem = modifiedItems.find(item => item.load_id === originalItem.load_id);
          if (modifiedItem) {
            return {
              ...originalItem,
              reason_kpi_origin: modifiedItem.reason_kpi_origin,
              reason_kpi_destination: modifiedItem.reason_kpi_destination
            };
          }
          return originalItem;
        })
      );
      const result = modifiedItems.map(({ load_id, reason_kpi_origin, reason_kpi_destination }) => ({ load_id, reason_kpi_origin, reason_kpi_destination }));

      console.log("บันทึกเหตุผลการล่าช้า:", result);


      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(result),
      });

      if (res.ok) {

        Swal.fire({
          title: "บันทึกสำเร็จ!",
          text: `อัพเดทเหตุผลการล่าช้าแล้ว ${result.length} รายการ`,
          icon: "success",
          showConfirmButton: true
        });
      } else {
        Swal.fire({
          title: "เกิดข้อผิดพลาด!",
          text: 'ไม่สามารถบันทึกเหตุผลการล่าช้าได้ กรุณาลองใหม่อีกครั้ง',
          icon: "error",
          showConfirmButton: true
        });
      }
    } catch (error) {
      console.error("Error saving delay reasons:", error);
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: 'error : ' + error,
        icon: "error",
        showConfirmButton: true
      });
    }
  }, []);

  // Dynamic import XLSX for Excel export (bundle-conditional)
  const handleExcelExport = useCallback(async () => {
    try {
      // Dynamic import XLSX only when needed (bundle-conditional)
      const XLSX = await import('xlsx');

      // สร้าง timestamp สำหรับชื่อไฟล์
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `${timestamp}_menafasttrack.xlsx`;

      // เตรียมข้อมูลสำหรับ Excel
      const excelData = safeMap(transportData, (item: TransportItem, index) => ({
        'ลำดับ': index + 1,
        'รหัสขนส่ง': item.load_id || '',
        'ชื่อพจส.': item.driver_name || '',
        'ทะเบียนหัว': item.h_plate || '',
        'ทะเบียนหาง': item.t_plate || '',
        'ต้นทาง': item.locat_recive || '',
        'ปลายทาง': item.locat_deliver || '',
        'วันที่ขึ้นสินค้า': item.date_recive || '',
        'วันที่ลงสินค้า': item.date_deliver || '',
        'สถานะ': item.status || '',
        'ประเภทงาน': item.job_type || '',
        'น้ำหนักสินค้า': item.weight || '',
        'ประเภทเชื้อเพลิง': item.fuel_type || '',
        'หมายเหตุ': item.remark || '',
        'ontime_arrival': item.dw_jobdata_info?.client_kpi_origin || '',
        'ontime_delivery': item.dw_jobdata_info?.client_kpi_destination || '',
        'reason_kpi_arrival': item.reason_kpi_origin || '',
        'reason_kpi_delivery': item.reason_kpi_destination || '',
        'วันที่เวลารับงาน': item.ticket_info?.start_datetime || '',
        'วันที่เวลาถึงต้นทาง': item.ticket_info?.origin_datetime || '',
        'วันที่เวลาเริ่มขึ้นสินค้า': item.ticket_info?.start_recive_datetime || '',
        'วันที่เวลาขึ้นสินค้าเสร็จ': item.ticket_info?.end_recive_datetime || '',
        'วันที่เวลาเริ่มขนส่ง': item.ticket_info?.intransit_datetime || '',
        'วันที่ถึงปลายทาง': item.ticket_info?.desination_datetime || '',
        'วันที่เวลาส่งเอกสาร': item.ticket_info?.docs_submitted_datetime || '',
        'วันที่เวลาเริ่มลงสินค้า': item.ticket_info?.start_unload_datetime || '',
        'วันที่เวลาลงสินค้าเสร็จ': item.ticket_info?.end_unload_datetime || '',
        'วันที่เวลาคืนเอกสาร': item.ticket_info?.docs_returned_datetime || '',
        'วันที่เวลาออกจากปลายทาง': item.ticket_info?.complete_datetime || '',
        'วันที่สร้าง': item.created_at || '',
        'อัพเดทล่าสุด': item.updated_at || ''
      }));

      // สร้าง workbook และ worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // ปรับความกว้างของ columns
      const colWidths = [
        { wch: 8 },   // ลำดับ
        { wch: 15 },  // รหัสขนส่ง
        { wch: 20 },  // ชื่อพจส.
        { wch: 12 },  // ทะเบียนหัว
        { wch: 12 },  // ทะเบียนหาง
        { wch: 25 },  // ต้นทาง
        { wch: 25 },  // ปลายทาง
        { wch: 15 },  // วันที่ขึ้นสินค้า
        { wch: 15 },  // วันที่ลงสินค้า
        { wch: 18 },  // สถานะ
        { wch: 12 },  // ประเภทงาน
        { wch: 12 },  // น้ำหนักสินค้า
        { wch: 15 },  // ประเภทเชื้อเพลิง
        { wch: 30 },  // หมายเหตุ
        { wch: 15 },  // ontime_arrival
        { wch: 15 },  // ontime_delivery
        { wch: 30 },  // reason_kpi_arrival
        { wch: 30 },  // reason_kpi_delivery
        { wch: 15 },  // วันที่เวลารับงาน
        { wch: 15 },  // วันที่เวลาถึงต้นทาง
        { wch: 15 },  // วันที่เวลาเริ่มขึ้นสินค้า
        { wch: 15 },  // วันที่เวลาขึ้นสินค้าเสร็จ
        { wch: 15 },  // วันที่เวลาเริ่มขนส่ง
        { wch: 15 },  // วันที่ถึงปลายทาง
        { wch: 15 },  // วันที่เวลาส่งเอกสาร
        { wch: 15 },  // วันที่เวลาเริ่มลงสินค้า
        { wch: 15 },  // วันที่เวลาลงสินค้าเสร็จ
        { wch: 15 },  // วันที่เวลาคืนเอกสาร
        { wch: 15 },  // วันที่เวลาออกจากปลายทาง
        { wch: 20 },  // วันที่สร้าง
        { wch: 20 }   // อัพเดทล่าสุด
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      XLSX.writeFile(workbook, filename);

      // แสดงข้อความสำเร็จ
      Swal.fire({
        title: 'ส่งออกข้อมูลสำเร็จ!',
        text: `ไฟล์ ${filename} ถูกดาวน์โหลดแล้ว`,
        icon: 'success',
        showConfirmButton: false,
        draggable: true
      });

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'ไม่สามารถส่งออกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        draggable: true
      });
    }
  }, [transportData]);

  const handleView = useCallback((id: string) => {
    const jobData = safeFind(transportData, (item: TransportItem) => item.load_id === id);
    if (jobData) {
      setmodalView({ show: true, job: jobData });
    }
  }, [transportData]);

  const handleMap = useCallback((id: string) => {
    const jobData = safeFind(transportData, (item: TransportItem) => item.load_id === id);
    if (jobData) {
      setmodalMap({ show: true, job: jobData });
    }
  }, [transportData]);

  const handleClose = useCallback((close: boolean) => {
    setmodalView((prev) => ({ ...prev, show: close }));
    setmodalCreate((prev) => ({ ...prev, show: close }));
    setmodalMap((prev) => ({ ...prev, show: close }));
  }, []);

  const getStatusColor = useCallback((status: string) => {
    return STATUS_COLORS[status] ?? DEFAULT_STATUS_COLOR;
  }, []);


  const sortedData = useMemo(() => {
    if (!sortColumn) return transportData;

    return [...transportData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [transportData, sortColumn, sortDirection]);


  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Memoized sort handler (rerender-functional-setstate)
  const handleSort = useCallback((column: keyof TransportItem) => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        setSortDirection((prev) => prev === "asc" ? "desc" : "asc");
        return prevColumn;
      } else {
        setSortDirection("asc");
        return column;
      }
    });
  }, []);

  const renderSortIcons = (column: keyof TransportItem) => (
    <span className="inline ml-1">
      <ChevronUp
        onClick={() => handleSort(column)}
        className={`w-4 h-4 inline cursor-pointer hover:text-blue-600 ${sortColumn === column && sortDirection === "asc"
            ? "text-blue-600"
            : "text-gray-600"
          }`}
      />
      <ChevronDown
        onClick={() => handleSort(column)}
        className={`w-4 h-4 inline cursor-pointer hover:text-blue-600 ${sortColumn === column && sortDirection === "desc"
            ? "text-blue-600"
            : "text-gray-600"
          }`}
      />
    </span>
  );

  // Memoized confirm delete handler (rerender-functional-setstate)
  const confirmDelete = useCallback(async () => {
    const jobid = deleteAlert.load_id;
    const value = { load_id: jobid, status: cancel };
    const access_token = localStorage.getItem("access_token");
    try {
      setDeleteAlert({ show: false, load_id: "" });
      const res_data = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify([value]),
      });

      if (!res_data.ok) throw new Error("ลบไฟล์ไม่สำเร็จ");
      setTransportData((prev) =>
        prev.map((item) =>
          item.load_id === jobid ? { ...item, status: value.status } : item
        )
      );
      handleSearch();
      Swal.fire({
        title: "จัดการข้อมูลสำเร็จ!",
        icon: "success",
        draggable: true,
      });
    } catch (error) {
      console.log("error : ", error);
      Swal.fire({
        title: "" + error,
        icon: "error",
        draggable: true,
      });
    }
  }, [deleteAlert.load_id, cancel, handleSearch]);

  // Load initial data
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoized statistics using O(1) Set lookups (js-set-map-lookups)
  const statistics = useMemo(() => {
    let cancelCount = 0;
    let readyCount = 0;
    let inTransitCount = 0;
    let completedCount = 0;

    // Single iteration for all stats (js-combine-iterations)
    for (const item of transportData) {
      if (CANCEL_STATUSES.has(item.status ?? '')) {
        cancelCount++;
      } else if (item.status === 'พร้อมรับงาน') {
        readyCount++;
      } else if (IN_TRANSIT_STATUSES.has(item.status ?? '')) {
        inTransitCount++;
      } else if (item.status === 'จัดส่งแล้ว (POD)') {
        completedCount++;
      }
    }

    return {
      total: transportData.length,
      cancel: cancelCount,
      ready: readyCount,
      inTransit: inTransitCount,
      completed: completedCount,
    };
  }, [transportData]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 relative overflow-hidden">
      {/* Use hoisted BackgroundElements (rendering-hoist-jsx) */}
      <BackgroundElements />

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl mb-6 shadow-xl">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-500" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMyAwIDYgMi43IDYgNnMtMi43IDYtNiA2LTYtMi43LTYtNiAyLjctNiA2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')]" />

          <div className="relative px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/20">
                <Truck size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  ระบบจัดการงานขนส่ง
                </h1>
                <p className="text-indigo-100 text-sm mt-0.5">
                  MENA FastTrack &mdash; จัดการและติดตามงานขนส่ง
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setmodalCreate({ show: true })}
                aria-label="เพิ่มงานใหม่"
                className="bg-white text-indigo-700 font-semibold cursor-pointer hover:bg-indigo-50 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-indigo-600 min-h-[44px]"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">เพิ่มงานใหม่</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Filter size={22} className="text-indigo-600" />
              ตัวกรองข้อมูล
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-label={showFilters ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              aria-expanded={showFilters}
              className="md:hidden bg-gray-100 hover:bg-gray-200 p-2.5 rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronDown size={20} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${showFilters ? "block" : "hidden md:grid"
              }`}
          >
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar size={16} />
                วันที่เริ่มต้น
              </label>
              <DateInput
                value={filters.date_plan.date_plan_start}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    date_plan: {
                      ...prev.date_plan,
                      date_plan_start: value,
                    },
                  }))
                }
                placeholder="dd/mm/yyyy"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar size={16} />
                วันที่สิ้นสุด
              </label>
              <DateInput
                value={filters.date_plan.date_plan_end}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    date_plan: {
                      ...prev.date_plan,
                      date_plan_end: value,
                    },
                  }))
                }
                placeholder="dd/mm/yyyy"
              />
            </div>

            {/* Load ID */}
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package size={16} />
                รหัสขนส่ง (Shipment ID)
              </label>
              <input
                type="text"
                value={filters.load_id}
                onChange={(e) => handleLoadIdChange(e.target.value)}
                onBlur={handleLoadIdBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const currentValue = filters.load_id;
                    const loadIds = currentValue.split(",").map((id) => id.trim());
                    const lastInputId = loadIds[loadIds.length - 1];

                    const uniqueLoadIds = [...new Set(
                      safeMap(transportData, (item: TransportItem) => item.load_id)
                    )];
                    const exactMatch = uniqueLoadIds.find(
                      (loadId) =>
                        loadId.toLowerCase() === lastInputId.toLowerCase()
                    );

                    const firstSuggestion =
                      filteredLoadIds.length > 0
                        ? filteredLoadIds[0]
                        : null;

                    if (exactMatch) {
                      loadIds[loadIds.length - 1] = exactMatch;
                      const newValue = loadIds.join(", ") + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        load_id: newValue,
                      }));
                    } else if (firstSuggestion) {
                      loadIds[loadIds.length - 1] = firstSuggestion;
                      const newValue = loadIds.join(", ") + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        load_id: newValue,
                      }));
                    } else if (lastInputId.trim().length > 0) {
                      const newValue = currentValue + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        load_id: newValue,
                      }));
                    }
                    setShowLoadIdSuggestions(false);
                  }
                }}
                placeholder="ค้นหารหัสขนส่ง..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 text-sm"
              />

              {/* Autocomplete dropdown for Load ID */}
              {showLoadIdSuggestions && filteredLoadIds.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredLoadIds.map((loadId, index) => {
                    const jobData = safeFind(transportData, (item: TransportItem) => item.load_id === loadId);
                    return (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSelectLoadId(loadId)}
                      >
                        <div className="font-medium text-gray-800">{loadId}</div>
                        {jobData && (
                          <div className="text-xs text-gray-500">
                            {jobData.driver_name} • {jobData.h_plate} • {jobData.locat_deliver}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Driver Name */}
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <User size={16} />
                ชื่อพจส.
              </label>
              <input
                type="text"
                value={filters.driver_name}
                onChange={(e) => handleDriverNameChange(e.target.value)}
                onBlur={handleDriverBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const currentValue = filters.driver_name;
                    const names = currentValue.split(",").map((n) => n.trim());
                    const lastInputName = names[names.length - 1];

                    const exactMatch = listname.find(
                      (name) =>
                        name.toLowerCase() === lastInputName.toLowerCase()
                    );

                    const firstSuggestion =
                      filteredDriverNames.length > 0
                        ? filteredDriverNames[0]
                        : null;

                    if (exactMatch) {
                      names[names.length - 1] = exactMatch;
                      const newValue = names.join(", ") + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        driver_name: newValue,
                      }));
                    } else if (firstSuggestion) {
                      names[names.length - 1] = firstSuggestion;
                      const newValue = names.join(", ") + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        driver_name: newValue,
                      }));
                    } else if (lastInputName.trim().length > 0) {
                      const newValue = currentValue + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        driver_name: newValue,
                      }));
                    }
                    setShowDriverSuggestions(false);
                  }
                }}
                placeholder="ค้นหาชื่อพนักงานขับรถ..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 text-sm"
              />

              {/* Autocomplete dropdown */}
              {showDriverSuggestions && filteredDriverNames.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredDriverNames.map((name, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSelectDriverName(name)}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Truck size={16} />
                ทะเบียนรถ
              </label>
              <input
                type="text"
                value={filters.h_plate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, h_plate: e.target.value }))
                }
                placeholder="ค้นหาทะเบียนรถ..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 text-sm"
              />
            </div>



            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpenCheck size={16} />
                สถานะ
              </label>
              <select
                value={
                  filters.status ===
                    "รับงาน,ถึงต้นทาง,เริ่มขึ้นสินค้า,ขึ้นสินค้าเสร็จ,เริ่มขนส่ง,ถึงปลายทาง,เริ่มลงสินค้า,ลงสินค้าเสร็จ"
                    ? "กำลังขนส่ง"
                    : filters.status === "ตกคิว,ซ่อม,อบรมที่บริษัท,ยกเลิก"
                      ? "ยกเลิกงาน"
                      : filters.status
                }
                onChange={(e) =>
                  setFilters((prev) => {
                    if (e.target.value == "กำลังขนส่ง")
                      return {
                        ...prev,
                        status:
                          "รับงาน,ถึงต้นทาง,เริ่มขึ้นสินค้า,ขึ้นสินค้าเสร็จ,เริ่มขนส่ง,ถึงปลายทาง,เริ่มลงสินค้า,ลงสินค้าเสร็จ",
                      };
                    if (e.target.value == "ยกเลิกงาน")
                      return {
                        ...prev,
                        status: "ตกคิว,ซ่อม,อบรมที่บริษัท,ยกเลิก",
                      };
                    return { ...prev, status: e.target.value };
                  })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 text-sm cursor-pointer"
              >
                <option value="">เลือกสถานะ</option>
                <optgroup className="text-yellow-800" label="สถานะงานหลัก">
                  <option className="text-yellow-600" value="พร้อมรับงาน">
                    พร้อมรับงาน
                  </option>
                  <option className="text-blue-600" value="กำลังขนส่ง">
                    กำลังขนส่ง
                  </option>
                  <option className="text-green-800" value="จัดส่งแล้ว (POD)">
                    เสร็จสิ้น
                  </option>
                  <option className="text-red-800" value="ยกเลิกงาน">
                    ยกเลิก
                  </option>
                </optgroup>
                <optgroup className="text-gray-600" label="สถานะงานย่อย">
                  <option value="รับงาน">รับงาน</option>
                  <option value="ถึงต้นทาง">ถึงต้นทาง</option>
                  <option value="เริ่มขึ้นสินค้า">เริ่มขึ้นสินค้า</option>
                  <option value="ขึ้นสินค้าเสร็จ">ขึ้นสินค้าเสร็จ</option>
                  <option value="เริ่มขนส่ง">เริ่มขนส่ง</option>
                  <option value="ถึงปลายทาง">ถึงปลายทาง</option>
                  <option value="เริ่มลงสินค้า">เริ่มลงสินค้า</option>
                  <option value="ลงสินค้าเสร็จ">ลงสินค้าเสร็จ</option>
                  <option value="ตกคิว">ตกคิว</option>
                  <option value="ซ่อม">ซ่อม</option>
                  <option value="อบรมที่บริษัท">อบรมที่บริษัท</option>
                  <option value="ยกเลิก">ยกเลิก</option>
                </optgroup>
              </select>
            </div>

            {/* location_receive */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookUser size={16} />
                ลูกค้า
              </label>
              <select
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    locat_recive: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 text-sm cursor-pointer"
              >
                <option value="">เลือกลูกค้า</option>
                {listCustomer.map((customer, index) => (
                  <option key={index} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div
            className={`flex flex-col sm:flex-row gap-3 mt-6 ${showFilters ? "block" : "hidden md:flex"
              }`}
          >
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-indigo-500 cursor-pointer hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[44px]"
            >
              {loading ? (
                <RefreshCw size={20} className="motion-safe:animate-spin" />
              ) : (
                <Search size={20} />
              )}
              {loading ? "กำลังค้นหา..." : "ค้นหาข้อมูล"}
            </button>
            <button
              onClick={resetFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white cursor-pointer px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px]"
            >
              <RefreshCw size={20} />
              รีเซ็ต
            </button>
          </div>
        </div>

        {/* Statistics Cards - Use memoized stats (js-combine-iterations) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-4 transition-shadow duration-200 cursor-default">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">งานทั้งหมด</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {statistics.total}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <Package className="text-blue-600" size={22} />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-4 transition-shadow duration-200 cursor-default">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">ยกเลิก</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {statistics.cancel}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <CircleX className="text-red-500" size={22} />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-4 transition-shadow duration-200 cursor-default">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">พร้อมรับงาน</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {statistics.ready}
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl">
                <Clock className="text-amber-500" size={22} />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-4 transition-shadow duration-200 cursor-default">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">กำลังขนส่ง</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {statistics.inTransit}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <Truck className="text-blue-500" size={22} />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:shadow-lg border border-gray-200 p-4 transition-shadow duration-200 cursor-default col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">เสร็จสิ้น</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {statistics.completed}
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl">
                <Check className="text-emerald-500" size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Radio Button Group */}
        <div className="relative flex flex-wrap rounded-xl bg-gray-100 p-1 lg:w-1/2 mb-5 text-sm shadow-sm border border-gray-200">
          <label className="flex-1 text-center cursor-pointer">
            <input
              type="radio"
              name="viewType"
              value="table"
              checked={activeView === 'table'}
              onChange={() => setActiveView('table')}
              className="hidden"
            />
            <span className={`flex items-center justify-center gap-2 rounded-md border-none py-2 px-4 transition-all duration-150 ease-in-out ${activeView === 'table'
                ? 'bg-white font-semibold text-slate-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-700'
              }`}>
              <Table size={16} />
              <span>ตารางข้อมูล</span>
            </span>
          </label>

          <label className="flex-1 text-center cursor-pointer">
            <input
              type="radio"
              name="viewType"
              value="dashboard"
              checked={activeView === 'dashboard'}
              onChange={() => setActiveView('dashboard')}
              className="hidden"
            />
            <span className={`flex items-center justify-center gap-2 rounded-md border-none py-2 px-4 transition-all duration-150 ease-in-out ${activeView === 'dashboard'
                ? 'bg-white font-semibold text-slate-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-700'
              }`}>
              <ChartPie size={16} />
              <span>แดชบอร์ด</span>
            </span>
          </label>
          <label className="flex-1 text-center cursor-pointer">
            <input
              type="radio"
              name="viewType"
              value="report_status"
              checked={activeView === 'report_status'}
              onChange={() => setActiveView('report_status')}
              className="hidden"
            />
            <span className={`flex items-center justify-center gap-2 rounded-md border-none py-2 px-4 transition-all duration-150 ease-in-out ${activeView === 'report_status'
                ? 'bg-white font-semibold text-slate-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-700'
              }`}>
              <ClipboardCheck size={16} />
              <span>รายงานสถานะขนส่ง</span>
            </span>
          </label>
        </div>


        {/* Conditional Rendering - แสดงตาม activeView */}
        {activeView === 'table' ? (
          /* Data Table */
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative">
            <div className="p-4 md:p-5 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg md:text-xl text-white font-semibold">
                    ข้อมูลงานขนส่ง
                  </h2>
                  <p className="text-slate-300 text-sm mt-0.5">
                    พบข้อมูล {transportData.length} รายการ
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => delayReasonCode()}
                    aria-label="เหตุผลล่าช้า"
                    className="bg-purple-600 border cursor-pointer border-purple-400 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl relative focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-800 min-h-[44px]"
                  >
                    <MessageCircleQuestion size={18} />
                    <span className="hidden sm:inline text-sm">เหตุผลล่าช้า</span>
                    {pendingDelayReasons > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {pendingDelayReasons > 99 ? '99+' : pendingDelayReasons}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleExcelExport()}
                    aria-label="ส่งออก Excel"
                    className="hidden lg:flex bg-emerald-600 border cursor-pointer border-emerald-400 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl items-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-800 min-h-[44px]"
                  >
                    <FileSpreadsheet size={18} />
                    <span className="text-sm">Excel</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-end items-center gap-2 text-sm mt-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1.5 border border-slate-500 text-slate-200 rounded-lg hover:bg-slate-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 min-h-[36px]"
                >
                  ก่อนหน้า
                </button>
                <span className="text-slate-300 text-sm">
                  หน้า {currentPage} จาก {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-slate-500 text-slate-200 rounded-lg hover:bg-slate-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 min-h-[36px]"
                >
                  ถัดไป
                </button>
              </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute top-1/3 inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-700">
                      กำลังค้นหาข้อมูล...
                    </p>
                    <p className="text-sm text-gray-500 mt-1">กรุณารอสักครู่</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile View */}
            <div className="block lg:hidden">
              {loading
                ? // Loading skeleton for mobile
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`mobile-loading-${index}`}
                    className="border-b border-gray-200 p-4 animate-pulse"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-40"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-36"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-52"></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                ))
                : currentData.map((item: any) => (
                  <div key={item.id} className="border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {item.load_id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.driver_name}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm border ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                        {item.job_type &&
                          (item.job_type === "ดรอป" ||
                            item.job_type === "ทอย") && (
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium shadow-sm border ${item.job_type === "ดรอป"
                                  ? "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-200"
                                  : "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-800 border-indigo-200"
                                }`}
                            >
                              🚛 {item.job_type}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Truck size={16} />
                        <span>
                          {item.h_plate} - {item.t_plate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={16} className="text-slate-400 shrink-0" />
                        <span>
                          {item.locat_recive} - {item.locat_deliver}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={16} className="text-slate-400 shrink-0" />
                        <span>
                          {item.date_recive} - {item.date_deliver}
                        </span>
                      </div>
                      <div className="flex text-wrap items-center gap-2 text-sm text-slate-600">
                        <NotebookPen size={16} className="text-slate-400 shrink-0" />
                        <span>{item.remark}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(item.load_id)}
                        aria-label="ดูรายละเอียด"
                        className="flex-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                      >
                        <Eye size={16} />
                        ดู
                      </button>

                      <button
                        onClick={() =>
                          setDeleteAlert({ show: true, load_id: item.load_id })
                        }
                        aria-label="ยกเลิกงาน"
                        className="flex-1 cursor-pointer bg-red-500 hover:bg-red-600 text-white px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
                      >
                        <Trash2 size={16} />
                        ยกเลิก
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setmodalMap({ show: true, job: item })}
                        aria-label="ดูแผนที่"
                        className="flex-1 cursor-pointer bg-amber-500 hover:bg-amber-600 text-white px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 min-h-[44px]"
                      >
                        <MapPin size={16} />
                        แผนที่
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-30">
                      รหัสขนส่ง <br /> {renderSortIcons("load_id")}
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      ชื่อพจส. <br /> {renderSortIcons("driver_name")}
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-30">
                      ทะเบียนรถ <br /> {renderSortIcons("h_plate")}
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      ต้นทาง <br /> {renderSortIcons("locat_recive")}
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      ปลายทาง <br /> {renderSortIcons("locat_deliver")}
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      วันที่ขึ้นสินค้า <br /> {renderSortIcons("date_recive")}
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      วันที่ลงสินค้า <br /> {renderSortIcons("date_deliver")}
                    </th>
                    <th className="px-2 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide min-w-[160px]">
                      สถานะ & ประเภท <br /> {renderSortIcons("status")}
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      หมายเหตุ
                    </th>
                    <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                {/* Rows Data */}

                <tbody className="divide-y divide-gray-100">
                  {loading
                    ?
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={`loading-${index}`} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-36"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-36"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-40"></div>
                        </td>
                        <td className="px-6 py-4 bg-gray-50">
                          <div className="flex justify-center gap-2">
                            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                    : currentData.map((item) => (
                      <tr
                        key={item.load_id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-3.5 text-xs font-medium text-slate-800">
                          {item.load_id}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600">
                          {item.driver_name}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600">
                          {item.h_plate} / {item.t_plate}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600">
                          {item.locat_recive}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {item.locat_deliver}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {item.date_recive}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {item.date_deliver}
                        </td>
                        <td className="px-2 py-4 min-w-[160px]">
                          <div className="flex flex-col gap-2">
                            {/* สถานะหลัก */}
                            <div className="flex justify-center">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium text-center min-w-[120px] shadow-sm border ${getStatusColor(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                            </div>

                            {/* ประเภทงาน */}
                            {item.job_type &&
                              (item.job_type === "ดรอป" ||
                                item.job_type === "ทอย") && (
                                <div className="flex justify-center">
                                  <span
                                    className={`px-2 py-1 rounded-md text-xs font-medium text-center min-w-[80px] shadow-sm border ${item.job_type === "ดรอป"
                                        ? "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-200"
                                        : "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-800 border-orange-200"
                                      }`}
                                  >
                                    🚛 {item.job_type}
                                  </span>
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {item.remark}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-1.5">
                            <button
                              aria-label="ดูรายละเอียด"
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
                              onClick={() => handleView(item.load_id)}
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              aria-label="ดูแผนที่"
                              className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
                              onClick={() => handleMap(item.load_id)}
                            >
                              <MapPin size={16} />
                            </button>

                            <button
                              aria-label="ยกเลิกงาน"
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
                              onClick={() =>
                                setDeleteAlert({
                                  show: true,
                                  load_id: item.load_id,
                                })
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {transportData.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Package size={36} className="text-gray-300" />
                </div>
                <p className="text-slate-600 text-lg font-medium">ไม่พบข้อมูลที่ค้นหา</p>
                <p className="text-slate-400 text-sm mt-1">
                  ลองปรับเปลี่ยนเงื่อนไขการค้นหา
                </p>
              </div>
            )}

            <div className="flex justify-end items-center px-4 py-3 border-t border-gray-100 gap-2 text-sm text-slate-600">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 min-h-[36px]"
              >
                ก่อนหน้า
              </button>
              <span className="text-sm">
                หน้า {currentPage} จาก {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 min-h-[36px]"
              >
                ถัดไป
              </button>
            </div>
          </div>
        ) : activeView === 'dashboard' ? (
          /* Dashboard View - Lazy loaded with Suspense (bundle-dynamic-imports) */
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 border-b rounded-xl shadow-lg mb-5">
              <h2 className="text-lg text-white font-semibold flex items-center gap-2">
                <ChartPie size={20} /> Dashboard ข้อมูลงานขนส่ง
              </h2>
            </div>
            <Suspense fallback={<LoadingFallback />}>
              <AdminDashboard transportData={transportData} />
            </Suspense>
          </div>
        ) : activeView === 'report_status' ? (
          /* Report Status View - Lazy loaded with Suspense (bundle-dynamic-imports) */
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6">
            <Suspense fallback={<LoadingFallback />}>
              <TransportStatusReport
                transportData={transportData}
                onRefreshData={handleSearch}
              />
            </Suspense>
          </div>
        ) : null}
      </div>

      {/* Alert การลบ */}
      {deleteAlert.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                ยืนยันการยกเลิก
              </h3>
            </div>

            <p className="text-slate-600 mb-6 leading-relaxed">
              คุณแน่ใจหรือไม่ที่จะยกเลิกงานนี้?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-start mb-5">
              <select
                value={cancel}
                onChange={(e) => setCancel(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 text-slate-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="ยกเลิก">สถานะ: ยกเลิก</option>
                <option value="ตกคิว">สถานะ: ตกคิว</option>
                <option value="ซ่อม">สถานะ: ซ่อม</option>
                <option value="อบรมที่บริษัท">สถานะ: อบรมที่บริษัท</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteAlert({ show: false, load_id: "" })}
                className="px-5 py-2.5 border border-gray-200 text-slate-700 hover:bg-gray-50 rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[44px]"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  confirmDelete();
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal จัดการ - Wrapped in Suspense for code-split components (async-suspense-boundaries) */}
      {modalView.show && (
        <Suspense fallback={<LoadingFallback />}>
          <AdminView
            jobView={modalView.job}
            closeModal={(close: boolean) => handleClose(close)}
            refreshTable={handleSearch}
          />
        </Suspense>
      )}

      {modalCreate.show && (
        <Suspense fallback={<LoadingFallback />}>
          <AdminCreateNew
            closeModal={(close: boolean) => handleClose(close)}
            refreshTable={handleSearch}
          />
        </Suspense>
      )}

      {modalMap.show && (
        <Suspense fallback={<LoadingFallback />}>
          <AdminMap
            jobView={modalMap.job}
            closeModal={(close: boolean) => handleClose(close)}
            refreshTable={handleSearch}
          />
        </Suspense>
      )}

      {delayReasonModal.show && (
        <Suspense fallback={<LoadingFallback />}>
          <DelayReasonModal
            isOpen={delayReasonModal.show}
            onClose={() => setDelayReasonModal({ show: false })}
            transportData={transportData}
            onSave={handleDelayReasonSave}
          />
        </Suspense>
      )}

    </div>
  );
};
