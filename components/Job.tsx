"use client";
import { useState, useEffect, useRef } from "react";
import { Jobcards } from "@/components/Jobcards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Funnel, Inbox, X, CheckCircle, Loader, AlertCircle, Package, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Swal from "sweetalert2";
type TicketProps = {
  onLoadingChange: (loading: boolean) => void;
};

export const Jobcomponent = ({ onLoadingChange }: TicketProps) => {
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด");
  const [DialogResult, setDialogResult] = useState(false);
  const [datajobs, setDatajobs] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const access_token = localStorage.getItem("access_token");
        const res_data = await fetch("/api/jobs", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
        });
        const data = await res_data.json();
        const filterStatus = data.jobs.filter(
          (job: any) =>
            job.status !== "ตกคิว" &&
            job.status !== "อบรมที่บริษัท" &&
            job.status !== "ยกเลิก" &&
            job.status !== "ซ่อม"
        );
        setDatajobs(filterStatus);
        onLoadingChange(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        onLoadingChange(false);
      }
    };

    fetchData();
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);
    const totalImages = images.length + selectedFiles.length;

    if (totalImages > 2) {
      alert("คุณสามารถอัปโหลดได้สูงสุด 2 รูปภาพเท่านั้น");

      // เคลียร์ input file เพื่อไม่ให้เกิด state ค้าง
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setImages((prev) => [...prev, ...selectedFiles]);
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, index) => index !== indexToRemove);
      if (updated.length === 0 && inputRef.current) {
        inputRef.current.value = "";
      }
      return updated;
    });
  };

  const handleSaved = () => {
    setDialogResult(false);
    Swal.fire({
      title: "บันทึกข้อมูลสำเร็จ!",
      icon: "success",
      draggable: true,
    });
  };
  const count = {
    totalCount: datajobs.length,
    inProgressCount: datajobs.filter((job) => job.status !== "จัดส่งแล้ว (POD)")
      .length,
    completedCount: datajobs.filter((job) => job.status === "จัดส่งแล้ว (POD)")
      .length,
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex justify-center px-4 py-3 relative overflow-hidden">
      {/* Background Bubbles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200 bg-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200 bg-opacity-20 rounded-full "></div>
        <div className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300 bg-opacity-25 rounded-full "></div>
        <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300 bg-opacity-30 rounded-full "></div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col z-10 w-full space-y-4">
        {/* Heading + Top Buttons */}
        <div className="flex justify-between items-center gap-2">
          <p className="hidden text-xl sm:text-xl text-center font-semibold text-gray-800">
            งานขนส่งของฉัน
          </p>

          <div className="hidden gap-2 flex-reverse sm:flex-row flex-col">
            <Dialog open={DialogResult} onOpenChange={setDialogResult}>
              <DialogTrigger asChild>
                <Button className="flex items-center bg-white border border-gray-500 space-x-2 hover:shadow-lg hover:-translate-y-1">
                  <Inbox className="h-4 w-4" />
                  <span>ระบบพาเลท</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border border-gray-500">
                <DialogHeader>
                  <DialogTitle>ระบบพาเลท</DialogTitle>
                  <DialogDescription className="text-[11px] text-gray-700">
                    กรอกข้อมูลเกี่ยวกับพาเลทที่มีการเบิกเข้า-เบิกออก พื้นที่
                    ออฟฟิศ TDM
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 p-4 ">
                  <div className="flex flex-row items-center gap-2">
                    <Badge className="text-center bg-green-200 p-1.5">
                      วันที่ลงพาเลท
                    </Badge>
                    <input
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      required
                      className="w-50 border text-[13px] p-1 text-center border-gray-300 rounded-md bg-white"
                    />
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <Badge className="text-center bg-green-200 p-1.5">
                      สถานที่พาเลท
                    </Badge>
                    <select
                      className="w-50 border text-[13px] p-1 text-center border-gray-300 rounded-md"
                      defaultValue={"ออฟฟิศ TDM"}
                    >
                      <option value=""></option>
                      <option value="ออฟฟิศ TDM">ออฟฟิศ TDM</option>
                    </select>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <Badge className="text-center bg-green-200 p-1.5">
                      ประเภทการเบิก
                    </Badge>
                    <select
                      className="w-50 border text-[13px] p-1 text-center border-gray-300 rounded-md"
                      required
                    >
                      <option value=""></option>
                      <option value="เบิกเข้า">เบิกเข้า</option>
                      <option value="เบิกออก">เบิกออก</option>
                      <option value="ส่งคืนลูกค้า">ส่งคืนลูกค้า</option>
                    </select>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <Badge className="text-center bg-green-200 p-1.5">
                      จำนวนพาเลท
                    </Badge>
                    <input
                      type="number"
                      className="w-50 border text-[13px] p-1 text-center border-gray-300 rounded-md bg-white w-20"
                      required
                    />
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <Badge className="text-center bg-green-200 p-1.5">
                      แนบหลักฐาน
                    </Badge>
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      placeholder="เลือกรูปภาพ"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      {images.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`preview-${index}`}
                            className="w-full object-cover rounded-lg border border-gray-300 shadow"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-white bg-opacity-70  text-red-500 rounded-full p-1 shadow opacity-100 transition"
                            title="ลบรูปนี้"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter className="w-full flex justify-between ">
                  {/* Button Submit and close ยกเลิก */}
                  <Button
                    onClick={handleSaved}
                    type="submit"
                    className="bg-green-500 text-white hover:bg-green-600"
                  >
                    บันทึกข้อมูล
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
<div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <div className="p-2 bg-green-100 rounded-xl">
                <Filter className="h-4 w-4 text-green-600" />
              </div>
              <span>กรองตาม:</span>
            </div>
            
            <button
              onClick={() => setFilterStatus("ทั้งหมด")}
              className={`inline-flex items-center gap-3 px-2 py-2 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === "ทั้งหมด"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border-2 border-blue-300"
                  : "bg-white bg-opacity-90 backdrop-blur-sm text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-opacity-100"
              }`}
            >
              <Package className="h-4 w-4" />
              <span>ทั้งหมด</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                filterStatus === "ทั้งหมด" 
                  ? "bg-white bg-opacity-20 text-gray-800" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                {count.totalCount}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus("รอดำเนินงาน")}
              className={`inline-flex items-center gap-3 px-2 py-2 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === "รอดำเนินงาน"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg border-2 border-amber-300"
                  : "bg-white bg-opacity-90 backdrop-blur-sm text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-opacity-100"
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <span>รอดำเนินงาน</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                filterStatus === "รอดำเนินงาน" 
                  ? "bg-white bg-opacity-20 text-gray-800" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                {count.inProgressCount}
              </span>
            </button>

            {/* <button
              onClick={() => setFilterStatus("กำลังขนส่ง")}
              className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === "กำลังขนส่ง"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg border-2 border-blue-300"
                  : "bg-white bg-opacity-90 backdrop-blur-sm text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-opacity-100"
              }`}
            >
              <Loader className={`h-4 w-4 ${filterStatus === "กำลังขนส่ง" ? "animate-spin" : ""}`} />
              <span>กำลังขนส่ง</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                filterStatus === "กำลังขนส่ง" 
                  ? "bg-white bg-opacity-20 text-white" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                {count.inProgressCount}
              </span>
            </button> */}

            <button
              onClick={() => setFilterStatus("จัดส่งแล้ว (POD)")}
              className={`inline-flex items-center gap-3 px-2 py-2 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === "จัดส่งแล้ว (POD)"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg border-2 border-green-300"
                  : "bg-white bg-opacity-90 backdrop-blur-sm text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-opacity-100"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>จัดส่งสำเร็จ</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                filterStatus === "จัดส่งแล้ว (POD)" 
                  ? "bg-white bg-opacity-20 text-gray-800" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                {count.completedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Job Cards */}
        {datajobs.length === 0 ? (
          <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 justify-center text-gray-500 py-10">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">ยังไม่มีงานตอนนี้</p>
          </div>
        ) : (
          <Jobcards filterStatus={filterStatus} datajobs={datajobs} />
        )}
      </div>
    </div>
  );
};
