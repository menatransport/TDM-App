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
} from "lucide-react";
import { useRouter } from "next/navigation";

type TicketProps = {
  onLoadingChange: (loading: boolean) => void;
};

export const Ticket = ({ onLoadingChange }: TicketProps) => {
  const router = useRouter();

  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false);
  const [isOpen4, setIsOpen4] = useState(false);
  const [job, setDatajobs] = useState<any>({});
  const [tickets, setTickets] = useState<any>({});
  const [pallet, setPallet] = useState<any>({});
  const [access_token, setAccesstoken] = useState<any>({});
  const [timeline, setTimeline] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("id");
    const access_token = localStorage.getItem("access_token");
    setAccesstoken(access_token);
    const fetchData = async () => {
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
        setPallet(data.palletdata);
        onLoadingChange(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        onLoadingChange(false);
      }
    };

    fetchData();
  }, []);

  const handleSaved = async () => {
    // console.log("timeline : ", timeline);

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

    if (!result.isConfirmed) return setIsLoading(false);

    if (Object.keys(timeline).length === 0 && job.status !== "จัดส่งแล้ว (POD)")
      return Swal.fire({
        title: "โปรบันทึกเวลาก่อน กดปุ่มบันทึกข้อมูล!",
        icon: "error",
        draggable: true,
      });
    setIsLoading(false);
    try {
      setIsLoading(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(timeline),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("เกิดข้อผิดพลาด:", errorData);
        alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบอีกครั้ง");
        setIsLoading(false);
        return;
      }
      location.reload();
      setIsLoading(false);
      Swal.fire({
        title: "บันทึกข้อมูลสำเร็จ",
        text: "ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonText: "ตกลง",
        allowOutsideClick: false,
      });
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setIsLoading(false);
      location.reload();
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr || typeof dateStr !== "string") return "-";

    const [datePart] = dateStr.split(",");
    if (!datePart) return "-";

    const [day, month, year] = datePart.split("/").map(Number);
    const d = new Date(year, month - 1, day);

    return d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr || typeof dateStr !== "string") return "-";

    const [datePart, timePart] = dateStr.split(",");
    if (!datePart || !timePart) return "-";

    const [day, month, year] = datePart.split("/").map(Number);
    const [hour, minute] = timePart.trim().split(":").map(Number);
    const d = new Date(year, month - 1, day, hour, minute);

    return d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  interface Pallet {
    change_pallet?: string;
    transfer_pallet?: string;
    drop_pallet?: string;
    return_pallet?: string;
    borrow_customer_pallet?: string;
    return_customer_pallet?: string;
    [key: string]: string | undefined;
  }

  const handleInputChange = (field: keyof Pallet, value: string) => {
    setPallet((prev: Pallet) => ({
      ...prev,
      [field]: value,
    }));
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
      case "รับงานแล้ว":
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
                  router.push(`/picture?id=${job.load_id}`);
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
          <Card className="mb-4 bg-gray-50 shadow-md hover:shadow-lg transition-all duration-300 border-0 ring-1 ring-gray-200/50 hover:ring-gray-300/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">
                  📦{job.load_id}
                </CardTitle>
                <Badge
                  className={`${
                    getStatusConfig(job.status).color
                  } border-white/30 text-xs px-2 py-0.5 rounded-full backdrop-blur-sm`}
                >
                  {job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-2 space-y-2">
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
                    <span className="font-medium text-white-900 truncate">
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
                    <span className="font-medium text-gray-900 truncate">
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

                <div className="grid grid-cols gap-2">
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        จำนวนเที่ยวทอย
                      </p>
                    </div>
                    <input className="text-xs font-bold text-center text-gray-900 w-full border border-gray-300 rounded-lg h-8" />
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
                <div
                  className="flex items-center justify-between text-sm font-medium p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg cursor-pointer hover:from-blue-100 hover:to-blue-150 transition-all duration-200 shadow-sm"
                  onClick={() => setIsOpen1(!isOpen1)}
                >
                  <span className="text-blue-800">1. จัดการพาเลท</span>
                  {isOpen1 ? (
                    <ChevronUp size={20} className="text-blue-600" />
                  ) : (
                    <ChevronDown size={20} className="text-blue-600" />
                  )}
                </div>
                {isOpen1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        แลกเปลี่ยนพาเลท
                      </label>
                      <input
                        type="text"
                        value={pallet.change_pallet || 0}
                        onChange={(e) =>
                          handleInputChange("change_pallet", e.target.value)
                        }
                        placeholder="กรอกจำนวนพาเลทที่แลกเปลี่ยน"
                        className="w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        โอนพาเลท
                      </label>
                      <input
                        type="text"
                        value={pallet.transfer_pallet || 0}
                        onChange={(e) =>
                          handleInputChange("transfer_pallet", e.target.value)
                        }
                        placeholder="กรอกจำนวนพาเลทที่โอน"
                        className="w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        นำฝากพาเลท
                      </label>
                      <input
                        type="text"
                        value={pallet.drop_pallet || 0}
                        onChange={(e) =>
                          handleInputChange("drop_pallet", e.target.value)
                        }
                        placeholder="กรอกจำนวนพาเลทที่นำฝาก"
                        className="w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รับคืนพาเลท
                      </label>
                      <input
                        type="text"
                        value={pallet.return_pallet || 0}
                        onChange={(e) =>
                          handleInputChange("return_pallet", e.target.value)
                        }
                        placeholder="กรอกจำนวนพาเลทที่รับคืน"
                        className="w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ยืมพาเลทลูกค้า
                      </label>
                      <input
                        type="text"
                        value={pallet.borrow_customer_pallet || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "borrow_customer_pallet",
                            e.target.value
                          )
                        }
                        placeholder="กรอกจำนวนพาเลทที่ยืม (แจ้งเจ้าหน้าที่)"
                        className="w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คืนพาเลทลูกค้า
                      </label>
                      <input
                        type="text"
                        value={pallet.return_customer_pallet || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "return_customer_pallet",
                            e.target.value
                          )
                        }
                        placeholder="กรอกจำนวนพาเลทที่คืน"
                        className="w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm"
                      />
                    </div>
                    <p className="text-[14px] text-amber-600 mt-1">
                      ⚠️ การยืม-ฝากพาเลทโปรดแจ้งเจ้าหน้าที่ให้รับทราบ
                    </p>
                  </div>
                )}
                <div
                  className="flex items-center justify-between text-sm font-medium p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg cursor-pointer hover:from-blue-100 hover:to-blue-150 transition-all duration-200 shadow-sm"
                  onClick={() => setIsOpen2(!isOpen2)}
                >
                  <span className="text-blue-800">
                    2. รายละเอียดสินค้าชำรุด
                  </span>
                  {isOpen2 ? (
                    <ChevronUp size={20} className="text-blue-600" />
                  ) : (
                    <ChevronDown size={20} className="text-blue-600" />
                  )}
                </div>
                {isOpen2 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รายละเอียดสินค้าชำรุด
                      </label>
                      <textarea
                        rows={4}
                        placeholder="กรุณาระบุรายละเอียดของสินค้าที่ชำรุด เช่น ประเภทความเสียหาย สาเหตุ จำนวน เป็นต้น"
                        className="w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm resize-none"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      💡 กรุณาระบุรายละเอียดให้ชัดเจนพร้อมแนบรูปภาพ
                    </p>
                  </div>
                )}

                {/* หัวข้อ 3 */}
                <div
                  className="flex items-center justify-between text-sm font-medium p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg cursor-pointer hover:from-blue-100 hover:to-blue-150 transition-all duration-200 shadow-sm"
                  onClick={() => setIsOpen3(!isOpen3)}
                >
                  <span className="text-blue-800">3. เลข LDT</span>
                  {isOpen3 ? (
                    <ChevronUp size={20} className="text-blue-600" />
                  ) : (
                    <ChevronDown size={20} className="text-blue-600" />
                  )}
                </div>
                {isOpen3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="กรอกเลข LDT"
                        className="w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Button saved */}

          <Button
            onClick={handleSaved}
            disabled={isLoading}
            className={`flex w-full justify-center items-center z-50 h-15 transition-all duration-200 space-x-2 px-4 py-5 shadow-lg 
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
                  xmlns="http://www.w3.org/2000/svg"
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
        </div>
      </div>
    </div>
  );
};
