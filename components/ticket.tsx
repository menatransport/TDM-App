"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { TimelineStep } from "@/components/Timeline";
import Image from "next/image";

import {
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  CircleEllipsis,
  Save,
  ChevronDown,
  ChevronUp,
  Copy,
  Package,
  Plus,
  Minus,
  AlertTriangle,
  X,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

type TicketProps = {
  onLoadingChange: (loading: boolean) => void;
};

export const Ticket = ({ onLoadingChange }: TicketProps) => {
  const router = useRouter();

  const [isOpenPallet, setIsOpenPallet] = useState(false);
  const [isOpenDamage, setIsOpenDamage] = useState(false);
  const [isOpenLDT, setIsOpenLDT] = useState(false);
  const [job, setDatajobs] = useState<any>({});
  const [tickets, setTickets] = useState<any>({});
  const [pallet, setPallet] = useState<any>({});
  const [damage, setDamage] = useState("");
  const [ldt, setLdt] = useState("");
  const [roll_trip, setRolltrip] = useState("");
  const [access_token, setAccesstoken] = useState<any>({});
  const [timeline, setTimeline] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // เก็บข้อมูลเดิมสำหรับเปรียบเทียบ
  const [originalData, setOriginalData] = useState({
    damage: "",
    ldt: "",
    roll_trip: "0",
    pallet: {},
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("id");
    const access_token = localStorage.getItem("access_token");
    setAccesstoken(access_token);

    fetchData();
  }, []);

  const fetchData = async () => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("id");
    const access_token = localStorage.getItem("access_token");

    try {
      const res_data = await fetch("/api/tickets", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
          id: jobId ?? "",
        },
      });

      const data = await res_data.json();
      // console.log("data ticket : ", data);
      setDatajobs(data);
      setTickets(data.ticket);

      setPallet({ ...data.palletdata, load_id: data.load_id });

      setDamage(data.damage_detail || "");
      setLdt(data.ldt || "");
      setRolltrip(data.roll_trip || "0");
      setOriginalData({
        damage: data.damage_detail || "",
        ldt: data.ldt || "",
        roll_trip: data.roll_trip || "0",
        pallet: { ...data.palletdata, load_id: data.load_id },
      });

      onLoadingChange(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      onLoadingChange(false);
    }
  };

  const handleSaved = async () => {
    const result = await Swal.fire({
      title: "คุณต้องการยืนยันบันทึกข้อมูลหรือไม่?",
      text: "กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนกดปุ่ม 'ตกลง'",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
      allowOutsideClick: false,
    });

    if (!result.isConfirmed) return;

    console.log("timeline:", timeline);
    if (
      Object.keys(timeline).length === 0 &&
      job.status !== "จัดส่งแล้ว (POD)"
    ) {
      return Swal.fire({
        title: "โปรดบันทึกเวลาก่อน กดปุ่มบันทึกข้อมูล!",
        icon: "error",
        draggable: true,
      });
    }

    try {
      setIsLoading(true);

      // เช็คการเปลี่ยนแปลงและเตรียม API calls
      const apiCalls = [];

      // 1. เช็ค Timeline - ถ้ามีการเปลี่ยนแปลง
      if (Object.keys(timeline).length > 0) {
        // console.log("Timeline changed, sending timeline API");
        apiCalls.push(
          fetch("/api/tickets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify(timeline),
          })
        );
      }

      // 2. เช็ค Job Data - ถ้ามีการเปลี่ยนแปลง
      const jobDataChanged =
        damage !== originalData.damage ||
        ldt !== originalData.ldt ||
        roll_trip !== originalData.roll_trip;

      if (jobDataChanged) {
        // console.log("Job data changed, sending job API");
        apiCalls.push(
          fetch("/api/jobs", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access_token}`,
              id: job.load_id ?? "",
            },
            body: JSON.stringify({
              damage_detail: damage,
              roll_trip: roll_trip,
              ldt: ldt,
            }),
          })
        );
      }

      // 3. เช็ค Pallet Data - ถ้ามีการเปลี่ยนแปลง
      const palletDataChanged =
        JSON.stringify(pallet) !== JSON.stringify(originalData.pallet);

      if (palletDataChanged) {
        // console.log("Pallet data changed, sending pallet API");
        apiCalls.push(
          fetch("/api/pallet", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify(pallet),
          })
        );
      }

      // ถ้าไม่มีการเปลี่ยนแปลงใดๆ
      if (apiCalls.length === 0) {
        Swal.fire({
          title: "ไม่มีการเปลี่ยนแปลง",
          text: "ไม่พบการเปลี่ยนแปลงข้อมูลที่ต้องบันทึก",
          icon: "info",
          confirmButtonText: "ตกลง",
        });
        setIsLoading(false);
        return;
      }

      // ส่ง API เฉพาะที่มีการเปลี่ยนแปลง
      // console.log(`Sending ${apiCalls.length} API calls`);
      const responses = await Promise.all(apiCalls);

      // ตรวจสอบ response
      const failedResponses = responses.filter((res) => !res.ok);

      if (failedResponses.length > 0) {
        console.error("Some API calls failed:", failedResponses);

        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: `ไม่สามารถบันทึกข้อมูลได้ ${failedResponses.length} รายการ โปรดแจ้งเจ้าหน้าที่หรือลองใหม่อีกครั้ง`,
          icon: "error",
          confirmButtonText: "ตกลง",
        });
        return;
      }

      // รีเฟรชข้อมูลและรีเซ็ต state
      await fetchData();
      setTimeline({});

      Swal.fire({
        title: "บันทึกข้อมูลสำเร็จ",
        text: `ข้อมูลถูกบันทึกเรียบร้อยแล้ว`,
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ:", error);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดแจ้งเจ้าหน้าที่หรือลองใหม่อีกครั้ง",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setIsLoading(false);
    }
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
  interface Pallet {
    change_pallet?: string;
    tranfer_pallet?: string;
    drop_pallet?: string;
    return_pallet?: string;
    borrow_customer_pallet?: string;
    return_customer_pallet?: string;
    [key: string]: string | undefined;
  }

  const handleOnchange_pallet = (field: keyof Pallet, value: string) => {
    setPallet((prev: Pallet) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDateThai = (dateStr?: string) => {
    if (!dateStr) return "";

    let d: Date;

    const parts = dateStr.split(", ");
    if (parts.length === 2) {
      const [datePart, timePart] = parts;
      const [day, month, year] = datePart.split("/").map(Number);
      const [hour, minute, second] = timePart.split(":").map(Number);
      d = new Date(year, month - 1, day, hour, minute, second);
    } else {
      d = new Date(dateStr);
    }

    if (isNaN(d.getTime())) return "";

    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  };

  const formatTimeSimple = (dateStr?: string) => {
    if (!dateStr || typeof dateStr !== "string") return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const generateSummaryText = () => {
    // console.log("timeline : ", tickets);
    const receiveDate =
      formatDate(job.date_recive) + " " + formatTime(job.date_recive);
    const deliverDate =
      formatDate(job.date_deliver) + " " + formatTime(job.date_deliver);
    const driverName = job.driver_name || "-";
    const vehiclePlate = `${job.h_plate || "-"}/${job.t_plate || "-"}`;
    const vehicleType = job.vehicle_type || " ล้อ";
    const phoneNumber = "☎️" + job.phone || "☎️";
    const supplier = "🔰TDM";
    const origin = `🔰 ${job.locat_recive || "🔰"}`;
    const destination = `🔰 ${job.locat_deliver || "🔰"}`;
    const arriveOriginTime = formatDateThai(tickets.origin_datetime);
    const startLoadTime = formatDateThai(tickets.start_recive_datetime);
    const finishLoadTime = formatDateThai(tickets.end_recive_datetime);
    const leaveOriginTime = formatDateThai(tickets.intransit_datetime);
    const arriveDestTime = formatDateThai(tickets.desination_datetime);
    const startUnloadTime = formatDateThai(tickets.start_unload_datetime);
    const finishUnloadTime = formatDateThai(tickets.end_unload_datetime);
    const leaveDestTime = formatDateThai(tickets.complete_datetime);

    // ข้อมูลพาเลท
    let palletInfo = "";
    if (pallet.change_pallet && pallet.change_pallet !== "0") {
      palletInfo += `${pallet.change_pallet} (แลกเปลี่ยน) `;
    }
    if (pallet.tranfer_pallet && pallet.tranfer_pallet !== "0") {
      palletInfo += `${pallet.tranfer_pallet} (โอน) `;
    }
    if (pallet.drop_pallet && pallet.drop_pallet !== "0") {
      palletInfo += `${pallet.drop_pallet} (นำฝาก) `;
    }
    if (pallet.return_pallet && pallet.return_pallet !== "0") {
      palletInfo += `${pallet.return_pallet} (รับคืน) `;
    }
    if (
      pallet.borrow_customer_pallet &&
      pallet.borrow_customer_pallet !== "0"
    ) {
      palletInfo += `${pallet.borrow_customer_pallet} (ยืมลูกค้า) `;
    }
    if (
      pallet.return_customer_pallet &&
      pallet.return_customer_pallet !== "0"
    ) {
      palletInfo += `${pallet.return_customer_pallet} (คืนลูกค้า) `;
    }

    let summaryText = "";
  if( job.locat_recive == "บริษัท นีโอ แฟคทอรี่ จำกัด" ) {
summaryText = `🚨สรุปการทำงาน🚨
 🆔: ${job.load_id}
 วันที่รับสินค้า : ${receiveDate}
 วันที่รับส่งสินค้า : ${deliverDate}
 ชื่อ : ${driverName}
 ทะเบียนรถ : ${vehiclePlate}
 ประเภทรถ : ${vehicleType}
 เบอร์โทร : ${phoneNumber}
 ซัพพลายเออร์ : ${supplier}
 ต้นทาง : ${origin}
 ปลายทาง : ${destination}
 🕘เวลาถึงต้นทาง = ${arriveOriginTime}
 🕘เวลาเริ่มขึ้นงาน = ${startLoadTime}
 🕘เวลาขึ้นงานเสร็จ = ${finishLoadTime}
 🕘เวลาออกจากโรงงาน = ${leaveOriginTime}
 🕘เวลาถึงปลายทาง = ${arriveDestTime}
 🕘เวลายื่นเอกสาร = ${formatDateThai(tickets.docs_submitted_datetime)}
 🕘เวลาเริ่มลงงาน = ${startUnloadTime}
 🕘เวลาลงงานเสร็จ = ${finishUnloadTime}
 🕘เวลาได้รับเอกสารคืน = ${formatDateThai(tickets.docs_returned_datetime)}
 🕘เวลาออกจากปลายทาง = ${leaveDestTime}
 หมายเหตุ : ${damage || " "}
 1.ค่าลงสินค้า = ${job.unload_cost || " "}
 2.ติดเวลาจราจร =
 3.จำนวนพาเลท = ${palletInfo || " "}
 4.เลขที่เอกสารLDT : ${ldt || " "}`;
  } else {
summaryText = `🚨สรุปการทำงาน🚨
 🆔: ${job.load_id}
 วันที่รับสินค้า : ${receiveDate}
 วันที่รับส่งสินค้า : ${deliverDate}
 ชื่อ : ${driverName}
 ทะเบียนรถ : ${vehiclePlate}
 ประเภทรถ : ${vehicleType}
 เบอร์โทร : ${phoneNumber}
 ซัพพลายเออร์ : ${supplier}
 ต้นทาง : ${origin}
 ปลายทาง : ${destination}
 🕘เวลาถึงต้นทาง = ${arriveOriginTime}
 🕘เวลาเริ่มขึ้นงาน = ${startLoadTime}
 🕘เวลาขึ้นงานเสร็จ = ${finishLoadTime}
 🕘เวลาออกจากโรงงาน = ${leaveOriginTime}
 🕘เวลาถึงปลายทาง = ${arriveDestTime}
 🕘เวลาเริ่มลงงาน = ${startUnloadTime}
 🕘เวลาลงงานเสร็จ = ${finishUnloadTime}
 🕘เวลาออกจากปลายทาง = ${leaveDestTime}
 หมายเหตุ : ${damage || " "}
 1.ค่าลงสินค้า = ${job.unload_cost || " "}
 2.ติดเวลาจราจร =
 3.จำนวนพาเลท = ${palletInfo || " "}
 4.เลขที่เอกสารLDT : ${ldt || " "}`;
  }
    return summaryText;
  };

  const handleCopySummary = async () => {
    try {
      const summaryText = generateSummaryText();

      // ตรวจสอบว่า browser รองรับ Clipboard API หรือไม่
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(summaryText);

        Swal.fire({
          title: "คัดลอกสำเร็จ!",
          text: "ข้อความสรุปการทำงานถูกคัดลอกแล้ว กรุณาตรวจสอบและนำไปแจ้งทางเจ้าหน้าที่ท่าน",
          icon: "success",
          showConfirmButton: true,
        });
      } else {
        // วิธีที่ 2: Fallback สำหรับ browser เก่าหรือ HTTP
        const textArea = document.createElement("textarea");
        textArea.value = summaryText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          Swal.fire({
            title: "คัดลอกสำเร็จ!",
            text: "ข้อความสรุปการทำงานถูกคัดลอกแล้ว กรุณาตรวจสอบและนำไปแจ้งทางเจ้าหน้าที่ท่าน",
            icon: "success",
            showConfirmButton: true,
          });
        } else {
          throw new Error("การคัดลอกด้วย execCommand ล้มเหลว");
        }
      }
    } catch (error) {
      console.error("Error copying to clipboard:", error);

      // วิธีที่ 3: แสดงข้อความในกรณีที่คัดลอกไม่ได้
      const summaryText = generateSummaryText();

      Swal.fire({
        title: "ไม่สามารถคัดลอกอัตโนมัติได้",
        html: `
          <div style="text-align: left; max-height: 300px; overflow-y: auto; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9; font-family: monospace; font-size: 12px; white-space: pre-wrap;">${summaryText}</div>
          <br>
          <p style="color: #666; font-size: 14px;">กรุณาคัดลอกข้อความด้านบนด้วยตนเอง</p>
        `,
        icon: "info",
        confirmButtonText: "ตกลง",
        width: "90%",
        customClass: {
          popup: "swal-wide",
        },
      });
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex justify-center p-5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200 bg-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200 bg-opacity-20 rounded-full "></div>
        <div className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300 bg-opacity-25 rounded-full "></div>
        <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300 bg-opacity-30 rounded-full "></div>
      </div>

      <div className="flex flex-col z-1 w-full space-y-4">
        {/* Buttton to home */}
        <div className="flex items-center justify-between mb-2">
          {/* ปุ่มกลับฝั่งซ้าย */}
          <Button
            onClick={() => {
              if (!isLoading) {
                router.push("/job");
              }
            }}
            className={`flex items-center gap-2 rounded-md bg-white px-4 py-2 text-gray-700 shadow hover:bg-gray-100 transition-all duration-200 ${
              isLoading ? "opacity-50 pointer-events-none" : "hover:opacity-80"
            }`}
          >
            <ArrowLeft className="h-4 w-4 text-emerald-500" />
            <span className="font-medium">งาน</span>
          </Button>

          <div className="flex flex-col justify-center text-center item-center cursor-pointer">
            <Image
              src="/cameralord.gif"
              onClick={() => {
                if (!isLoading) {
                  console.log("image");
                  router.push(
                    `/picture?id=${job.load_id}&status=${job.status}`
                  );
                }
              }}
              className={`cursor-pointer transition-opacity duration-300 ${
                isLoading
                  ? "opacity-50 pointer-events-none"
                  : "hover:opacity-80"
              }`}
              width={60}
              height={60}
              alt="images"
            />
            <Badge
              className={`border-white/30 text-xs rounded-full backdrop-blur-sm`}
            >
              รูปภาพ
            </Badge>
          </div>
        </div>
        <div className="flex flex-col w-full md:w-1/2 md:self-center-safe">
          {/* Header Info */}
          <Card className="mb-2 bg-gray-50 shadow-md hover:shadow-lg transition-all duration-300 border-0 ring-1 ring-gray-200/50 hover:ring-gray-300/50">
            <CardHeader>
              <div className="relative flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold">
                    🆔{job.load_id}
                  </CardTitle>
                  <p className="ml-5 text-dark/90 text-xs font-medium">
                    {job.h_plate} • {job.t_plate}
                  </p>
                </div>
                <div className="flex flex-col items-end  space-x-2 space-y-2">
                  <Badge
                    className={`${
                      getStatusConfig(job.status).color
                    } border-white/30 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm`}
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-1 space-y-1">
                <div className="flex justify-between">
                  <p className="text-sm font-semibold">ต้นทาง</p>
                  <p className="text-sm font-semibold">ปลายทาง</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div
                    className={`flex items-center space-x-1 flex-1 min-w-0 ${
                      getStatusConfig(job.status).btn
                    } rounded-lg p-2 shadow-sm`}
                  >
                    <MapPin
                      className={`h-3 w-3 ${
                        getStatusConfig(job.status).iconColor
                      } flex-shrink-0`}
                    />
                    <span className="font-medium text-white-900 whitespace-normal break-words flex-1">
                      {job.locat_recive}
                    </span>
                  </div>

                  <ArrowRight
                    className={`h-3 w-3 ${
                      getStatusConfig(job.status).iconColor
                    } mx-2 flex-shrink-0`}
                  />

                  <div
                    className={`flex items-center space-x-1 flex-1 min-w-0 ${
                      getStatusConfig(job.status).btn
                    } rounded-lg p-2 shadow-sm`}
                  >
                    <span className="font-medium text-gray-900 whitespace-normal break-words flex-1">
                      {job.locat_deliver}
                    </span>
                  </div>
                </div>

                {/* Dates in compact grid */}
                <div className="grid grid-cols-2 gap-2 ">
                  <div className="bg-white rounded-lg p-2 shadow-xs">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <Clock className="h-2.5 w-2.5 text-green-600" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        รับ
                      </p>
                    </div>
                    <div className="flex flex-row gap-2">
                      <p className="text-xs font-bold text-gray-900">
                        {formatDate(job.date_recive)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatTime(job.date_recive)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <Clock className="h-2.5 w-2.5 text-red-600" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        ส่ง
                      </p>
                    </div>
                    <div className="flex flex-row gap-2">
                      <p className="text-xs font-bold text-gray-900">
                        {formatDate(job.date_deliver)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatTime(job.date_deliver)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        ค่าลงสินค้า
                      </p>
                    </div>
                    <p className="text-xs font-bold text-center text-gray-900">
                      {job.unload_cost}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        แผนพาเลท
                      </p>
                    </div>
                    <p className="text-xs font-bold text-center text-gray-900">
                      {job.pallet_plan} {job.pallet_type}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols gap-2">
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        หมายเหตุ
                      </p>
                    </div>
                    <p className="text-xs font-bold text-center text-gray-900">
                      {job.remark}
                    </p>
                  </div>
                </div>

                <div
                  className={` ${
                    job.job_type == "ทอย" ? "grid grid-cols gap-2" : "hidden"
                  }`}
                >
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        จำนวนเที่ยวทอย (ถ้ามี)
                      </p>
                    </div>
                    <input
                      type="number"
                      value={roll_trip}
                      onChange={(e) => setRolltrip(e.target.value)}
                      className="text-xs font-bold text-center text-gray-900 w-full border border-gray-300 rounded-lg h-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline สถานะ */}
          <Card className="mb-4 bg-gray-0 shadow-md hover:shadow-lg transition-all duration-300 border-0 ring-1 ring-gray-200/50 hover:ring-gray-300/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>ติดตามสถานะ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <TimelineStep db={tickets} onTimeChange={setTimeline} />
              </div>
            </CardContent>
          </Card>

          {/* รายละเอียดเพิ่มเติม*/}
          <Card className="mb-10 bg-gray-50 shadow-md hover:shadow-lg transition-all duration-300 border-0 ring-1 ring-gray-200/50 hover:ring-gray-300/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CircleEllipsis className="h-5 w-5" />
                <span>รายละเอียดเพิ่มเติม</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                {/* จำนวนพาเลท - Collapsible Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsOpenPallet(!isOpenPallet)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">จำนวนพาเลท</h3>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full bg-gray-100 transition-all duration-300 ${isOpenPallet ? 'rotate-180 bg-blue-100' : ''}`}>
                        <ChevronDown className={`w-5 h-5 ${isOpenPallet ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                    </div>
                  </div>
                  
                  {isOpenPallet && (
                    <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {/* แลกเปลี่ยนพาเลท */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          แลกเปลี่ยนพาเลท
                        </label>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.change_pallet || "0");
                              if (current > 0) {
                                handleOnchange_pallet("change_pallet", (current - 1).toString());
                              }
                            }}
                            className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              value={pallet.change_pallet || "0"}
                              onChange={(e) => handleOnchange_pallet("change_pallet", e.target.value)}
                              className="w-full text-center text-xl font-bold py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              min="0"
                            />
                          
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.change_pallet || "0");
                              handleOnchange_pallet("change_pallet", (current + 2).toString());
                            }}
                            className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* โอนพาเลท */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          โอนพาเลท
                        </label>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.tranfer_pallet || "0");
                              if (current > 0) {
                                handleOnchange_pallet("tranfer_pallet", (current - 1).toString());
                              }
                            }}
                            className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              value={pallet.tranfer_pallet || "0"}
                              onChange={(e) => handleOnchange_pallet("tranfer_pallet", e.target.value)}
                              className="w-full text-center text-xl font-bold py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              min="0"
                            />
                           
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.tranfer_pallet || "0");
                              handleOnchange_pallet("tranfer_pallet", (current + 2).toString());
                            }}
                            className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* นำฝากพาเลท */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          นำฝากพาเลท
                        </label>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.drop_pallet || "0");
                              if (current > 0) {
                                handleOnchange_pallet("drop_pallet", (current - 1).toString());
                              }
                            }}
                            className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              value={pallet.drop_pallet || "0"}
                              onChange={(e) => handleOnchange_pallet("drop_pallet", e.target.value)}
                              className="w-full text-center text-xl font-bold py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              min="0"
                            />
                     
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.drop_pallet || "0");
                              handleOnchange_pallet("drop_pallet", (current + 2).toString());
                            }}
                            className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* รับคืนพาเลท */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          รับคืนพาเลท
                        </label>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.return_pallet || "0");
                              if (current > 0) {
                                handleOnchange_pallet("return_pallet", (current - 1).toString());
                              }
                            }}
                            className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              value={pallet.return_pallet || "0"}
                              onChange={(e) => handleOnchange_pallet("return_pallet", e.target.value)}
                              className="w-full text-center text-xl font-bold py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              min="0"
                            />
                          
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.return_pallet || "0");
                              handleOnchange_pallet("return_pallet", (current + 2).toString());
                            }}
                            className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* ยืมพาเลทลูกค้า */}
                      <div className="bg-gray-50 border-2 border-red-300 border-dashed rounded-lg p-3 shadow-md">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          ยืมพาเลทลูกค้า
                        </label>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.borrow_customer_pallet || "0");
                              if (current > 0) {
                                handleOnchange_pallet("borrow_customer_pallet", (current - 1).toString());
                              }
                            }}
                            className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              value={pallet.borrow_customer_pallet || "0"}
                              onChange={(e) => handleOnchange_pallet("borrow_customer_pallet", e.target.value)}
                              className="w-full text-center text-xl font-bold py-3 bg-white border-2 border-red-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              min="0"
                            />
                    
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.borrow_customer_pallet || "0");
                              handleOnchange_pallet("borrow_customer_pallet", (current + 2).toString());
                            }}
                            className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* คืนพาเลทลูกค้า */}
                      <div className="bg-gray-50 border-2 border-red-300 border-dashed rounded-lg p-3 shadow-md">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          คืนพาเลทลูกค้า
                        </label>
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.return_customer_pallet || "0");
                              if (current > 0) {
                                handleOnchange_pallet("return_customer_pallet", (current - 1).toString());
                              }
                            }}
                            className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              value={pallet.return_customer_pallet || "0"}
                              onChange={(e) => handleOnchange_pallet("return_customer_pallet", e.target.value)}
                              className="w-full text-center text-xl font-bold py-3 bg-white border-2 border-red-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              min="0"
                            />
            
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const current = parseInt(pallet.return_customer_pallet || "0");
                              handleOnchange_pallet("return_customer_pallet", (current + 2).toString());
                            }}
                            className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* คำแนะนำ */}
                      <div className="bg-red-100 rounded-lg p-3 shadow-md">
                        <p className="text-sm text-red-800 flex items-start space-x-2">
                          <span className="text-red-600 font-semibold">⚠️</span>
                          <span>การยืม-ฝากพาเลทโปรดแจ้งเจ้าหน้าที่ให้รับทราบ</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {/* รายละเอียดสินค้าชำรุด - Collapsible Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsOpenDamage(!isOpenDamage)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">สินค้าชำรุด</h3>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full bg-gray-100 transition-all duration-300 ${isOpenDamage ? 'rotate-180 bg-red-100' : ''}`}>
                        <ChevronDown className={`w-5 h-5 ${isOpenDamage ? 'text-red-600' : 'text-gray-600'}`} />
                      </div>
                    </div>
                  </div>
                  
                  {isOpenDamage && (
                    <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {/* Quick Templates */}
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🚀 เทมเพลตด่วน
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDamage("บรรจุภัณฑ์เสียหาย: ")}
                            className="p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-sm text-orange-800 font-medium transition-all duration-200 hover:scale-105"
                          >
                            📦 บรรจุภัณฑ์เสียหาย
                          </button>
                          <button
                            type="button"
                            onClick={() => setDamage("สินค้าแตกหัก: ")}
                            className="p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-sm text-red-800 font-medium transition-all duration-200 hover:scale-105"
                          >
                            💔 สินค้าแตกหัก
                          </button>
                          <button
                            type="button"
                            onClick={() => setDamage("สินค้าเปียก: ")}
                            className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800 font-medium transition-all duration-200 hover:scale-105"
                          >
                            💧 สินค้าเปียก
                          </button>
                        </div>
                      </div> */}

                      {/* Text Area */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📝 รายละเอียดเพิ่มเติม
                        </label>
                        <textarea
                          rows={4}
                          value={damage}
                          onChange={(e) => setDamage(e.target.value)}
                          placeholder="กรุณาระบุรายละเอียดของสินค้าที่ชำรุด เช่น วันที่เวลา ประเภทความเสียหาย สาเหตุ จำนวนที่เสียหาย เป็นต้น"
                          className="w-full px-4 py-3 text-sm text-gray-700 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm resize-none"
                        />
                      </div>

                      {/* Clear Button */}
                      {damage && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setDamage("")}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>ล้างข้อความ</span>
                          </button>
                        </div>
                      )}

                      {/* คำแนะนำ */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800 flex items-start space-x-2">
                          <span className="text-red-600 font-semibold">💡</span>
                          <span>กรุณาระบุรายละเอียดให้ชัดเจนพร้อมแนบรูปภาพ หากระบุจำนวนสินค้าที่เสียหาย ให้ติดต่อสอบถามกับเจ้าหน้าที่ทุกครั้ง</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* เลขที่เอกสาร LDT - Collapsible Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsOpenLDT(!isOpenLDT)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">เลขที่เอกสาร LDT</h3>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full bg-gray-100 transition-all duration-300 ${isOpenLDT ? 'rotate-180 bg-indigo-100' : ''}`}>
                        <ChevronDown className={`w-5 h-5 ${isOpenLDT ? 'text-indigo-600' : 'text-gray-600'}`} />
                      </div>
                    </div>
                  </div>
                  
                  {isOpenLDT && (
                    <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {/* Input with enhanced design */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📄 เลข LDT
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                           
                            placeholder="เช่นTT2508-1364 MT2509-0027/0028"
                            className="w-full px-4 py-4 pr-12 text-lg font-mono text-gray-700 bg-white border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-indigo-300 transition-all duration-200 shadow-sm"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Quick Clear Button */}
                      {ldt && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setLdt("")}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>ล้างเลข LDT</span>
                          </button>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Button saved */}
          <div className="flex gap-3 w-full">
            <Button
              onClick={handleSaved}
              disabled={isLoading}
              className={`flex flex-1 justify-center items-center z-50 h-15 transition-all duration-200 space-x-2 px-4 py-5 shadow-lg 
        ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-700 text-white"
        }`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="https://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  <span>กำลังบันทึก...</span>
                </div>
              ) : (
                <>
                  <Save size={18} />
                  <span>บันทึกข้อมูล</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleCopySummary}
              disabled={isLoading}
              className={`flex justify-center items-center z-50 h-15 transition-all duration-200 space-x-2 px-4 py-5 shadow-lg 
        ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-green-700 hover:scale-105 font-semibold border-dashed border-green-700 border-3"
        }`}
            >
              <Copy size={18} />
              <span className="inline">คัดลอกสถานะ</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
