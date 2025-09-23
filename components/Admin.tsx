"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  User,
  Truck,
  Package,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  RefreshCw,
  MapPin,
  Clock,
  Phone,
  NotebookPen,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  BookOpenCheck,
  CircleX,
  Check,
  FileSpreadsheet,
  ChartPie,
} from "lucide-react";
import Swal from "sweetalert2";
import { AdminView } from "@/components/AdminView";
import { AdminCreateNew } from "@/components/AdminCreateNew";
import { AdminMap } from "@/components/AdminMap";
import { TransportItem } from "@/lib/type";
import { usegetListName } from "@/lib/userStore";
import * as XLSX from 'xlsx';

const itemsPerPage = 10;
const today = new Date().toISOString().split("T")[0];
const sevenDaysAgo = new Date(
  new Date(today).getTime() - 7 * 24 * 60 * 60 * 1000
)
  .toISOString()
  .split("T")[0];
const tomorrow = new Date(new Date(today).getTime() + 1 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

export const Admintool = () => {
  const listname = usegetListName();
  const [filters, setFilters] = useState({
    date_plan: { date_plan_start: sevenDaysAgo, date_plan_end: tomorrow },
    load_id: "",
    driver_name: "",
    h_plate: "",
    status: "",
  });
  const [showDriverSuggestions, setShowDriverSuggestions] = useState(false);
  const [filteredDriverNames, setFilteredDriverNames] = useState<string[]>([]);
  const [showLoadIdSuggestions, setShowLoadIdSuggestions] = useState(false);
  const [filteredLoadIds, setFilteredLoadIds] = useState<string[]>([]);
  const [transportData, setTransportData] = useState<TransportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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

  const [modalMap, setmodalMap] = useState<{
    show: boolean;
  }>({
    show: false,
  });

  // State สำหรับการอัปเดตเวลา
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // console.log("📋 Listname จากหน้า Login:", listname);
  }, []);

  // อัปเดตเวลาทุก 30 วินาที สำหรับ real-time highlight
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // อัปเดตทุก 30 วินาที

    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    // 1. แยก date_plan ออกก่อน
    const { date_plan, ...restFilters } = filters;

    // 2. กรองค่าที่ไม่ว่าง
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
       console.log("🚚 ข้อมูลที่ค้นหา:", data);
      setTransportData(data.jobs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }

    // setTimeout(() => {
    //   let filteredData = mockData;

    //   setTransportData(filteredData);
    //   setLoading(false);
    // }, 1000);
  };

  const handleDriverNameChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      driver_name: value,
    }));

    // แยกชื่อตามจุลภาค (comma) และเอาชื่อสุดท้ายมาค้นหา
    const names = value.split(",").map((name) => name.trim());
    const lastInputName = names[names.length - 1];

    // กรองชื่อที่ตรงกับชื่อสุดท้ายที่พิมพ์
    if (lastInputName.length > 0) {
      const filtered = listname.filter((name) => {
        // ไม่แสดงชื่อที่เลือกไปแล้ว
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
      // ถ้าไม่มีการพิมพ์หลัง comma แสดงรายชื่อที่ยังไม่ถูกเลือก
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

  // ฟังก์ชันเลือกชื่อจาก dropdown
  const handleSelectDriverName = (name: string) => {
    const currentValue = filters.driver_name;
    const names = currentValue.split(",").map((n) => n.trim());

    // แทนที่ชื่อสุดท้ายด้วยชื่อที่เลือก
    names[names.length - 1] = name;

    // รวมชื่อกลับเป็นสตริง
    const newValue = names.join(", ");
    setFilters((prev) => ({
      ...prev,
      driver_name: newValue,
    }));
    setShowDriverSuggestions(false);
  };

  // ฟังก์ชันซ่อน suggestions เมื่อคลิกข้างนอก
  const handleDriverBlur = () => {
    // ใช้ setTimeout เพื่อให้การคลิกใน dropdown ทำงานก่อน
    setTimeout(() => {
      setShowDriverSuggestions(false);
    }, 200);
  };

  // ฟังก์ชันจัดการ Load ID Search
  const handleLoadIdChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      load_id: value,
    }));

    // แยก load_id ตามจุลภาค (comma) และเอา ID สุดท้ายมาค้นหา
    const loadIds = value.split(",").map((id) => id.trim());
    const lastInputId = loadIds[loadIds.length - 1];

    // ดึง load_id ที่ไม่ซ้ำกันจาก transportData
    const uniqueLoadIds = [...new Set(transportData.map(item => item.load_id))];

    // กรอง load_id ที่ตรงกับ ID สุดท้ายที่พิมพ์
    if (lastInputId.length > 0) {
      const filtered = uniqueLoadIds.filter((loadId) => {
        // ไม่แสดง ID ที่เลือกไปแล้ว
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
      // ถ้าไม่มีการพิมพ์หลัง comma แสดงรายการ ID ที่ยังไม่ถูกเลือก
      const selectedIds = loadIds.slice(0, -1);
      const availableIds = uniqueLoadIds.filter(
        (loadId) =>
          !selectedIds.some(
            (selectedId) => selectedId.toLowerCase() === loadId.toLowerCase()
          )
      );
      setFilteredLoadIds(availableIds.slice(0, 10)); // จำกัดแค่ 10 รายการ
      setShowLoadIdSuggestions(availableIds.length > 0);
    }
  };

  // ฟังก์ชันเลือก Load ID จาก dropdown
  const handleSelectLoadId = (loadId: string) => {
    const currentValue = filters.load_id;
    const loadIds = currentValue.split(",").map((id) => id.trim());

    // แทนที่ ID สุดท้ายด้วย ID ที่เลือก
    loadIds[loadIds.length - 1] = loadId;

    // รวม ID กลับเป็นสตริง
    const newValue = loadIds.join(", ");
    setFilters((prev) => ({
      ...prev,
      load_id: newValue,
    }));
    setShowLoadIdSuggestions(false);
  };

  // ฟังก์ชันซ่อน load_id suggestions เมื่อคลิกข้างนอก
  const handleLoadIdBlur = () => {
    // ใช้ setTimeout เพื่อให้การคลิกใน dropdown ทำงานก่อน
    setTimeout(() => {
      setShowLoadIdSuggestions(false);
    }, 200);
  };

  // ✅ รีเซ็ตข้อมูล filter
  const resetFilters = () => {
    setFilters({
      date_plan: { date_plan_start: sevenDaysAgo, date_plan_end: today },
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
  };

  // ✅ Excel Export Function
  const handleExcelExport = () => {
    try {
      // สร้าง timestamp สำหรับชื่อไฟล์
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: YYYY-MM-DDTHH-MM-SS
      const filename = `${timestamp}_menafasttrack.xlsx`;
      const ticketdata = transportData; // ใช้ transportData แทน mockData
      // เตรียมข้อมูลสำหรับ Excel
      const excelData = transportData.map((item, index) => ({
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
        'วันที่เวลารับงาน': item.ticket_info?.start_datetime || '',
        'วันที่เวลาถึงต้นทาง': item.ticket_info?.origin_datetime || '',
        'วันที่เวลาเริ่มขึ้นสินค้า': item.ticket_info?.start_recive_datetime || '',
        'วันที่เวลาขึ้นสินค้าเสร็จ': item.ticket_info?.end_recive_datetime || '',
        'วันที่เวลาเริ่มขนส่ง': item.ticket_info?.intransit_datetime || '',
        // 'วันที่ถึงปลายทาง': item.ticket_info?.desination_datetime || '',
        'วันที่เวลาส่งเอกสาร': item.ticket_info?.docs_submitted_datetime || '',
        'วันที่เวลาเริ่มลงสินค้า': item.ticket_info?.start_unload_datetime || '',
        'วันที่เวลาลงสินค้าเสร็จ': item.ticket_info?.end_unload_datetime || '',
        'วันที่เวลาคืนเอกสาร': item.ticket_info?.docs_returned_datetime || '',
        'วันที่เวลาออกจากปลายทาง': item.ticket_info?.complete_datetime || '',
        'วันที่สร้าง': item.create_at || '',
        'อัพเดทล่าสุด': item.update_at || ''
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
        { wch: 15 },  //วันที่เวลารับงาน
        { wch: 15 },  //วันที่เวลาถึงต้นทาง
        { wch: 15 },  //วันที่เวลาเริ่มขึ้นสินค้า
        { wch: 15 },  //วันที่เวลาขึ้นสินค้าเสร็จ
        { wch: 15 },  //วันที่เวลาเริ่มขนส่ง
        { wch: 15 },  //วันที่ถึงปลายทาง
        { wch: 15 },  //วันที่เวลาส่งเอกสาร
        { wch: 15 },  //วันที่เวลาเริ่มลงสินค้า
        { wch: 15 },  //วันที่เวลาลงสินค้าเสร็จ
        { wch: 15 },  //วันที่เวลาคืนเอกสาร
        { wch: 15 },  //วันที่เวลาออกจากปลายทาง
        { wch: 20 },  // วันที่สร้าง
        { wch: 20 }   // อัพเดทล่าสุด
      ];
      worksheet['!cols'] = colWidths;

      // เพิ่ม worksheet เข้า workbook
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
  };

  // ✅ ดู / แก้ไข / ลบ
  const handleView = (id: any) => {
    const jobData = transportData.find((item) => item.load_id === id); // ✅ ใช้ find
    if (jobData) {
      setmodalView({ show: true, job: jobData });
    }
  };


  const handleClose = (close: boolean) => {
    setmodalView((prev) => ({ ...prev, show: close }));
    setmodalCreate((prev) => ({ ...prev, show: close }));
    setmodalMap((prev) => ({ ...prev, show: close }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "พร้อมรับงาน":
        return "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200";
      case "รับงาน":
      case "ถึงต้นทาง":
      case "เริ่มขึ้นสินค้า":
      case "ขึ้นสินค้าเสร็จ":
        return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200";
      case "เริ่มขนส่ง":
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-300";
      case "ถึงปลายทาง":
      case "เริ่มลงสินค้า":
      case "ลงสินค้าเสร็จ":
        return "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-200";
      case "จัดส่งแล้ว (POD)":
        return "bg-gradient-to-r from-green-100 to-green-200 text-green-900 border-green-300";
      case "อบรมที่บริษัท":
      case "ซ่อม":
      case "ยกเลิก":
      case "ตกคิว":
        return "bg-gradient-to-r from-red-50 to-red-100 text-red-900 border-red-200";
      default:
        return "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRowHighlight = (item: TransportItem) => {
    const receiveTime = item.date_recive ? new Date(item.date_recive) : null;
    const deliverTime = item.date_deliver ? new Date(item.date_deliver) : null;
    
    // ตรวจสอบเฉพาะสถานะ "รับงาน" หรือ "พร้อมรับงาน"
    const isTargetStatus_origin = item.status === "รับงาน" || item.status === "พร้อมรับงาน";
    const isTargetStatus_deliver = item.status === "ถึงต้นทาง" || item.status === "เริ่มขึ้นสินค้า" || item.status === "ขึ้นสินค้าเสร็จ" || item.status === "เริ่มขนส่ง";
    if (!isTargetStatus_origin && !isTargetStatus_deliver) {
      return ""; 
    }

    // ตรวจสอบเวลารับสินค้า (date_recive)
    if (receiveTime && isTargetStatus_origin) {
      const oneHourBeforeReceive = new Date(receiveTime.getTime() - (60 * 60 * 1000));
      
      // เกินเวลารับสินค้าแล้ว - สีแดง
      if (currentTime >= receiveTime) {
        return " border-l-4 border-red-500 border-b-0 ";
      }
      
      // ใกล้เวลารับสินค้า (เหลือ 1 ชั่วโมง) - สีเหลือง
      if (currentTime >= oneHourBeforeReceive && currentTime < receiveTime) {
        return " border-l-4 border-yellow-400 border-b-0 ";
      }
    }

    // ตรวจสอบเวลาส่งสินค้า (date_deliver)
    if (deliverTime && isTargetStatus_deliver) {
      const oneHourBeforeDeliver = new Date(deliverTime.getTime() - (60 * 60 * 1000));
      
      // เกินเวลาส่งสินค้าแล้ว - สีแดง
      if (currentTime >= deliverTime) {
        return "border-l-4 border-red-500 border-b-0 ";
      }
      
      // ใกล้เวลาส่งสินค้า (เหลือ 1 ชั่วโมง) - สีเหลือง
      if (currentTime >= oneHourBeforeDeliver && currentTime < deliverTime) {
        return "border-l-4 border-yellow-400 border-b-0 ";
      }
    }

    return ""; 
  };

  // Sort data
  const sortedData = useMemo(() => {
    // เรียงลำดับตาม highlight ก่อน แล้วค่อยเรียงตาม column ที่เลือก
    return [...transportData].sort((a, b) => {
      // ตรวจสอบ highlight priority
      const aHighlight = getRowHighlight(a);
      const bHighlight = getRowHighlight(b);
      
      // กำหนดลำดับความสำคัญของ highlight
      const getHighlightPriority = (highlight: string) => {
        if (highlight.includes('border-red-500')) return 1; // สีแดง = ลำดับที่ 1 (สำคัญที่สุด)
        if (highlight.includes('border-yellow-400')) return 2; // สีเหลือง = ลำดับที่ 2
        return 3; // ไม่มี highlight = ลำดับที่ 3 (สำคัญน้อยที่สุด)
      };
      
      const aPriority = getHighlightPriority(aHighlight);
      const bPriority = getHighlightPriority(bHighlight);
      
      // เรียงตามลำดับความสำคัญ (เลขน้อย = สำคัญมาก)
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // ถ้าความสำคัญเท่ากัน ให้เรียงตาม column ที่เลือก
      if (sortColumn) {
        const aVal = a[sortColumn] ?? "";
        const bVal = b[sortColumn] ?? "";
        
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }
      
      // ถ้าไม่มีการเลือก column และทั้งคู่ไม่มี highlight (priority = 3)
      // ให้เรียงตาม date_recive จากมากไปน้อย (ใหม่ไปเก่า)
      if (aPriority === 3 && bPriority === 3) {
        const aReceiveDate = a.date_recive ? new Date(a.date_recive) : new Date(0);
        const bReceiveDate = b.date_recive ? new Date(b.date_recive) : new Date(0);
        
        // เรียงจากมากไปน้อย (ใหม่ไปเก่า)
        if (aReceiveDate > bReceiveDate) return -1;
        if (aReceiveDate < bReceiveDate) return 1;
      }
      
      // สำหรับกรณีอื่นๆ ให้เรียงตาม load_id
      const aLoadId = a.load_id;
      const bLoadId = b.load_id;
      if (aLoadId < bLoadId) return -1;
      if (aLoadId > bLoadId) return 1;
      return 0;
    });
  }, [transportData, sortColumn, sortDirection, currentTime]);

  // Paging data

  // Paging data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: keyof TransportItem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIcons = (column: keyof TransportItem) => (
    <span className="inline ml-1">
      <ChevronUp
        onClick={() => handleSort(column)}
        className={`w-4 h-4 inline cursor-pointer hover:text-blue-600 ${
          sortColumn === column && sortDirection === "asc"
            ? "text-blue-600"
            : "text-gray-600"
        }`}
      />
      <ChevronDown
        onClick={() => handleSort(column)}
        className={`w-4 h-4 inline cursor-pointer hover:text-blue-600 ${
          sortColumn === column && sortDirection === "desc"
            ? "text-blue-600"
            : "text-gray-600"
        }`}
      />
    </span>
  );

  const confirmDelete = async () => {
    let value = { status: cancel };
    let jobid = deleteAlert.load_id;
    const access_token = localStorage.getItem("access_token");
    try {
      setDeleteAlert({ show: false, load_id: "" });
      const res_data = await fetch("/api/jobs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
          id: jobid ?? "",
        },
        body: JSON.stringify(value),
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
  };

  // ✅ โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200 bg-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200 bg-opacity-20 rounded-full"></div>
        <div className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300 bg-opacity-25 rounded-full"></div>
        <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300 bg-opacity-30 rounded-full"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                ระบบจัดการงานขนส่ง
              </h1>
              <p className="text-gray-600">จัดการและติดตามงานขนส่งทั้งหมด</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setmodalCreate({ show: true })}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">เพิ่มงานใหม่</span>
              </button>
              <button 
                onClick={() => window.open('https://lookerstudio.google.com/s/vjSdVuS7MCg', '_blank')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow hover:shadow-md border border-gray-200"
              >
                <ChartPie  size={20} />
                <span className="hidden sm:inline">แดชบอร์ด</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Filter size={24} />
              ตัวกรองข้อมูล
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition-colors"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${
              showFilters ? "block" : "hidden md:grid"
            }`}
          >
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar size={16} />
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={filters.date_plan.date_plan_start}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    date_plan: {
                      ...prev.date_plan,
                      date_plan_start: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar size={16} />
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={filters.date_plan.date_plan_end}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    date_plan: {
                      ...prev.date_plan,
                      date_plan_end: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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

                    // หา load_id ที่ตรงแบบแม่นยำ หรือ ID แรกที่ตรงใน suggestions
                    const uniqueLoadIds = [...new Set(transportData.map(item => item.load_id))];
                    const exactMatch = uniqueLoadIds.find(
                      (loadId) =>
                        loadId.toLowerCase() === lastInputId.toLowerCase()
                    );

                    const firstSuggestion =
                      filteredLoadIds.length > 0
                        ? filteredLoadIds[0]
                        : null;

                    if (exactMatch) {
                      // ถ้าตรงแบบแม่นยำ ใช้ ID นั้น
                      loadIds[loadIds.length - 1] = exactMatch;
                      const newValue = loadIds.join(", ") + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        load_id: newValue,
                      }));
                    } else if (firstSuggestion) {
                      // ถ้าไม่ตรงแม่นยำ ใช้ ID แรกใน suggestions
                      loadIds[loadIds.length - 1] = firstSuggestion;
                      const newValue = loadIds.join(", ") + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        load_id: newValue,
                      }));
                    } else if (lastInputId.trim().length > 0) {
                      // ถ้าไม่มีใน suggestions แต่มีการพิมพ์ ให้เพิ่ม comma
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />

              {/* Autocomplete dropdown for Load ID */}
              {showLoadIdSuggestions && filteredLoadIds.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredLoadIds.map((loadId, index) => {
                    // หาข้อมูลเพิ่มเติมจาก transportData
                    const jobData = transportData.find(item => item.load_id === loadId);
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

                    // หาชื่อที่ตรงแบบแม่นยำ หรือชื่อแรกที่ตรงใน suggestions
                    const exactMatch = listname.find(
                      (name) =>
                        name.toLowerCase() === lastInputName.toLowerCase()
                    );

                    const firstSuggestion =
                      filteredDriverNames.length > 0
                        ? filteredDriverNames[0]
                        : null;

                    if (exactMatch) {
                      // ถ้าตรงแบบแม่นยำ ใช้ชื่อนั้น
                      names[names.length - 1] = exactMatch;
                      const newValue = names.join(", ") + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        driver_name: newValue,
                      }));
                    } else if (firstSuggestion) {
                      // ถ้าไม่ตรงแม่นยำ ใช้ชื่อแรกใน suggestions
                      names[names.length - 1] = firstSuggestion;
                      const newValue = names.join(", ") + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        driver_name: newValue,
                      }));
                    } else if (lastInputName.trim().length > 0) {
                      // ถ้าไม่มีใน suggestions แต่มีการพิมพ์ ให้เพิ่ม comma
                      const newValue = currentValue + ", ";
                      setFilters((prev) => ({
                        ...prev,
                        driver_name: newValue,
                      }));
                    }
                    setShowDriverSuggestions(false);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
          </div>

          <div
            className={`flex flex-col sm:flex-row gap-3 mt-6 ${
              showFilters ? "block" : "hidden md:flex"
            }`}
          >
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Search size={20} />
              )}
              {loading ? "กำลังค้นหา..." : "ค้นหาข้อมูล"}
            </button>
            <button
              onClick={resetFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw size={20} />
              รีเซ็ต
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white backdrop-blur-md rounded-xl shadow-lg border border-white/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">งานทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-800">
                  {transportData.length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white backdrop-blur-md rounded-xl shadow-lg border border-white/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ยกเลิก</p>
                <p className="text-2xl font-bold text-red-800">
                  {
                    transportData.filter(
                      (item) =>
                        item.status === "ยกเลิก" ||
                        item.status === "ตกคิว" ||
                        item.status === "ซ่อม" ||
                        item.status === "อบรมที่บริษัท"
                    ).length
                  }
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <CircleX className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white backdrop-blur-md rounded-xl shadow-lg border border-white/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">พร้อมรับงาน</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    transportData.filter(
                      (item) => item.status === "พร้อมรับงาน"
                    ).length
                  }
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white backdrop-blur-md rounded-xl shadow-lg border border-white/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">กำลังขนส่ง</p>
                <p className="text-2xl font-bold text-blue-600">
                  {
                    transportData.filter(
                      (item) =>
                        item.status === "รับงาน" ||
                        item.status === "ถึงต้นทาง" ||
                        item.status === "เริ่มขึ้นสินค้า" ||
                        item.status === "ขึ้นสินค้าเสร็จ" ||
                        item.status === "เริ่มขนส่ง" ||
                        item.status === "ถึงปลายทาง" ||
                        item.status === "เริ่มลงสินค้า" ||
                        item.status === "ลงสินค้าเสร็จ"
                    ).length
                  }
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Truck className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white backdrop-blur-md rounded-xl shadow-lg border border-white/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">เสร็จสิ้น</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    transportData.filter(
                      (item) => item.status === "จัดส่งแล้ว (POD)"
                    ).length
                  }
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Check className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white backdrop-blur-md rounded-2xl shadow-xl border border-white/30 overflow-hidden relative">
          <div className="p-4 bg-gray-500 border-b border-gray-200">
            <h2 className="text-xl text-white font-semibold text-gray-800">
              ข้อมูลงานขนส่ง
            </h2>
            <p className="text-white mt-1">
              พบข้อมูล {transportData.length} รายการ
            </p>
            <div className="absolute top-4 right-4 flex flex-col sm:flex-row gap-2">
             <button
                onClick={() => handleExcelExport()}
                className="bg-emerald-600 border border-white hover:bg-emerald-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FileSpreadsheet  size={20} />
                <span className="hidden sm:inline">Excel</span>
              </button>
            </div>
            <div className="flex justify-end items-center gap-2 text-sm text-gray-600">
              
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border text-white rounded hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
              >
                ก่อนหน้า
              </button>
              <span className="text-gray-200">
                หน้า {currentPage} จาก {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border text-white rounded hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
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
                  <div key={item.id} className={`border-b border-gray-200 p-4 ${getRowHighlight(item)}`}>
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
                              className={`px-2 py-1 rounded-md text-xs font-medium shadow-sm border ${
                                item.job_type === "ดรอป"
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
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        <span>
                          {item.locat_recive} - {item.locat_deliver}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <span>
                          {item.date_recive} - {item.date_deliver}
                        </span>
                      </div>
                      <div className="flex text-wrap items-center gap-2 text-sm text-gray-600">
                        <NotebookPen size={16} />
                        <span>{item.remark}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(item.load_id)}
                        className="flex-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Eye size={16} />
                        ดู
                      </button>
                     
                      <button
                        onClick={() =>
                          setDeleteAlert({ show: true, load_id: item.load_id })
                        }
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} />
                        ยกเลิก
                      </button>

                      
                    </div>
                    <div className="mt-2 flex gap-2">
                     <button
                      onClick={() => setmodalMap({ show: true})}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <MapPin  size={16} />
                        แผนที่
                      </button>
                    </div>
                  </div>
                ))}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 w-30">
                    รหัสขนส่ง <br /> {renderSortIcons("load_id")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                    ชื่อพจส. <br /> {renderSortIcons("driver_name")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600 w-30">
                    ทะเบียนรถ <br /> {renderSortIcons("h_plate")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                    ต้นทาง <br /> {renderSortIcons("locat_recive")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                    ปลายทาง <br /> {renderSortIcons("locat_deliver")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                    วันที่ขึ้นสินค้า <br /> {renderSortIcons("date_recive")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                    วันที่ลงสินค้า <br /> {renderSortIcons("date_deliver")}
                  </th>
                  <th className="px-2 py-4 text-center text-sm font-medium text-gray-600 min-w-[160px]">
                    สถานะ & ประเภท <br /> {renderSortIcons("status")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-600">
                    หมายเหตุ
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-gray-600">
                    จัดการ
                  </th>
                </tr>
              </thead>

              {/* Rows Data */}

              <tbody className="divide-y divide-white">
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
                        className={`hover:bg-gray-100 transition-colors ${getRowHighlight(item)}`}
                      >
                        <td className="px-6 py-4 text-xs font-medium text-gray-800">
                          {item.load_id}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {item.driver_name}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {item.h_plate} / {item.t_plate}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
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
                                    className={`px-2 py-1 rounded-md text-xs font-medium text-center min-w-[80px] shadow-sm border ${
                                      item.job_type === "ดรอป"
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
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.remark}
                        </td>
                        <td className="px-6 py-4 bg-gray-50">
                          <div className="flex justify-center gap-2">
                            <button
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg"
                              onClick={() => handleView(item.load_id)}
                            >
                              <Eye size={16} />
                            </button>
                            
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg">
                        <MapPin size={16} 
                       onClick={() => setmodalMap({ show: true})}
                        />
                      </button>


                            <button className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg">
                              <Trash2
                                size={16}
                                onClick={() =>
                                  setDeleteAlert({
                                    show: true,
                                    load_id: item.load_id,
                                  })
                                }
                              />
                            </button>

                            

                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {transportData.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">ไม่พบข้อมูลที่ค้นหา</p>
              <p className="text-gray-400 text-sm mt-2">
                ลองปรับเปลี่ยนเงื่อนไขการค้นหา
              </p>
            </div>
          )}

          <div className="flex justify-end items-center m-4 gap-2 text-sm text-gray-600">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 border rounded hover:bg-gray-100  disabled:opacity-40"
            >
              ก่อนหน้า
            </button>
            <span>
              หน้า {currentPage} จาก {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 border rounded hover:bg-gray-100  disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {/* Alert การลบ */}
      {deleteAlert.show && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                ยืนยันการยกเลิก
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              คุณแน่ใจหรือไม่ที่จะยกเลิกงานนี้?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-start mb-4">
              <select
                value={cancel}
                onChange={(e) => setCancel(e.target.value)}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
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
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  confirmDelete();
                }}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                จัดการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal จัดการ */}
      {modalView.show && (
        <AdminView
          jobView={modalView.job}
          closeModal={(close: boolean) => handleClose(close)}
          refreshTable={() => handleSearch()}
        />
      )}

      {modalCreate.show && (
        <AdminCreateNew
          closeModal={(close: boolean) => handleClose(close)}
          refreshTable={() => handleSearch()}
        />
      )}
      
      {modalMap.show && (
        <AdminMap
         jobView={modalView.job}
          closeModal={(close: boolean) => handleClose(close)}
          refreshTable={() => handleSearch()}
        />
      )}

    </div>
  );
};
