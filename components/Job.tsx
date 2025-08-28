"use client";
import { useState, useEffect, useRef } from "react";
import { Jobcards } from "@/components/Jobcards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Funnel,
  Inbox,
  X,
  CheckCircle,
  Loader,
  AlertCircle,
  Package,
  Filter,
  MapPin,
  ChevronDown,
  Check,
  Grid3X3,
  Briefcase,
  Truck,
} from "lucide-react";
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
  const [finished_status, setFinished_status] = useState<any[]>([]);
  const [DialogResult, setDialogResult] = useState(false);
  const [datajobs, setDatajobs] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [isExpanded_1, setIsExpanded_1] = useState(true);
  const [isExpanded_2, setIsExpanded_2] = useState(false);
  const [isExpanded_3, setIsExpanded_3] = useState(false);
  const [isExpanded_finished, setIsExpanded_finished] = useState(false);
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
        // console.log("Fetched jobs data:", data.jobs);
        const filterStatus = data.jobs.filter(
          (job: any) =>
            job.status !== "ตกคิว" &&
            job.status !== "อบรมที่บริษัท" &&
            job.status !== "ยกเลิก" &&
            job.status !== "ซ่อม"
        );

        const finished_status = data.jobs.filter(
          (job: any) => job.status === "จัดส่งแล้ว (POD)"
        );
        const pending_status = filterStatus.filter(
          (job: any) => job.status !== "จัดส่งแล้ว (POD)"
        );
        setDatajobs(filterStatus);
        console.log("pending_status:", pending_status);
        setPending(pending_status);
        setFinished_status(finished_status);
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

  const toggleExpanded_1 = () => {
    setIsExpanded_1(!isExpanded_1);
    setIsExpanded_2(false);
    setIsExpanded_3(false);
    setIsExpanded_finished(false);
  };
  const toggleExpanded_2 = () => {
    setIsExpanded_1(false);
    setIsExpanded_2(!isExpanded_2);
    setIsExpanded_3(false);
    setIsExpanded_finished(false);
  };

  const toggleExpanded_3 = () => {
    setIsExpanded_1(false);
    setIsExpanded_2(false);
    setIsExpanded_3(!isExpanded_3);
    setIsExpanded_finished(false);
  };

  const toggleExpanded_finished = () => {
    setIsExpanded_1(false);
    setIsExpanded_2(false);
    setIsExpanded_3(false);
    setIsExpanded_finished(!isExpanded_finished);
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
      <div className="flex flex-col z-10 w-full space-y-4 mb-20">
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
                      วันที่บันทึกพาเลท
                    </Badge>
                    <input
                      type="datetime-local"
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
                      <option value="นำฝาก">นำฝาก</option>
                      <option value="รับคืน">รับคืน</option>
                      <option value="ยืมลูกค้า">ยืมลูกค้า</option>
                      <option value="คืนลูกค้า">ส่งคืนลูกค้า</option>
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
                  <div className="hidden flex-row items-center gap-2">
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

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
          <div
            className="flex flex-row items-center gap-2 p-2 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={toggleExpanded_1}
          >
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl text-white shadow-lg">
              <Truck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">
                งานรอดำเนินการ
              </h2>
              {datajobs.length > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                    รอดำเนินการ {pending.length}  งาน
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  pending.length > 0 ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {pending.length > 0 ? "มีงาน" : "ไม่มีงาน"}
              </span>
            </div>

            {/* Toggle Icon */}
            <div
              className={`p-2 rounded-lg bg-gray-100 text-gray-600 transition-all duration-200 ${
                isExpanded_1 ? "rotate-180" : ""
              }`}
            >
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>

         {/* Job Cards */}
        {datajobs.length === 0 ? (
          <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 justify-center text-gray-500 py-10">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">ยังไม่มีงานตอนนี้</p>
          </div>
        ) : (
          <div
            className={`transition-all duration-300 ease-in-out ${
              isExpanded_1
                ? "opacity-100"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <Jobcards filterStatus="รอดำเนินงาน" datajobs={datajobs} />
          </div>
        )}

        </div>



        <div className="hidden bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
          <div
            className="flex flex-row items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={toggleExpanded_2}
          >
            <div className="p-2  bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white shadow-lg">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">
                งานดรอป
              </h2>
              {datajobs.length > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                    รอดำเนินการ {datajobs.length}  งาน
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full bg-gray-400`}
              ></div>
              <span className="text-sm text-gray-600">
                {/* {datajobs.length > 0 ? "มีงาน" : "ว่าง"} */} ว่าง
              </span>
            </div>

            {/* Toggle Icon */}
            <div
              className={`p-2 rounded-lg bg-gray-100 text-gray-600 transition-all duration-200 ${
                isExpanded_2 ? "rotate-180" : ""
              }`}
            >
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
               {/* Job Cards */}
        {datajobs.length === 0 ? (
          <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 justify-center text-gray-500 py-10">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">ยังไม่มีงานตอนนี้</p>
          </div>
        ) : (
          <div
            className={`transition-all duration-300 ease-in-out ${
              isExpanded_2
                ? "opacity-100"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <Jobcards filterStatus="รอดำเนินงาน" datajobs={datajobs} />
          </div>
        )}
        </div>

           {/* ทอย */}

           <div className="hidden bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
          <div
            className="flex flex-row items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={toggleExpanded_3}
          >
            <div className="p-2  bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white shadow-lg">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">
                งานทอย
              </h2>
              {datajobs.length > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                    รอดำเนินการ {datajobs.length}  งาน
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full bg-gray-400`}
              ></div>
              <span className="text-sm text-gray-600">
                {/* {datajobs.length > 0 ? "มีงาน" : "ว่าง"} */} ว่าง
              </span>
            </div>

            {/* Toggle Icon */}
            <div
              className={`p-2 rounded-lg bg-gray-100 text-gray-600 transition-all duration-200 ${
                isExpanded_3 ? "rotate-180" : ""
              }`}
            >
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
               {/* Job Cards */}
        {datajobs.length === 0 ? (
          <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 justify-center text-gray-500 py-10">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">ยังไม่มีงานตอนนี้</p>
          </div>
        ) : (
          <div
            className={`transition-all duration-300 ease-in-out ${
              isExpanded_3
                ? "opacity-100"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <Jobcards filterStatus="รอดำเนินงาน" datajobs={datajobs} />
          </div>
        )}
        </div>


        <hr className="my-4 border-gray-200" />

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
          <div
            className="flex flex-row items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={toggleExpanded_finished}
          >
            <div className="p-2  bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl text-white shadow-lg">
              <Check className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">
                งานจัดส่งแล้ว
              </h2>
               {finished_status.length > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    เสร็จสิ้น {finished_status.length}  งาน
                  </span>
                </div>
              )}
            </div>
            {/* Toggle Icon */}
            <div
              className={`p-2 rounded-lg bg-gray-100 text-gray-600 transition-all duration-200 ${
                isExpanded_finished ? "rotate-180" : ""
              }`}
            >
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
               {/* Job Cards */}
        {datajobs.length === 0 ? (
          <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 justify-center text-gray-500 py-10">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">ยังไม่มีงานตอนนี้</p>
          </div>
        ) : (
          <div
            className={`transition-all duration-300 ease-in-out ${
              isExpanded_finished
                ? "opacity-100"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <Jobcards filterStatus="จัดส่งแล้ว (POD)" datajobs={datajobs} />
          </div>
        )}
        </div>
      </div>



        


       <div className="hidden bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-center gap-20 max-w-md mx-auto">
          <button
            // onClick={() => setActiveTab('jobs')}
            className={`flex flex-col items-center p-3 w-15 rounded-lg transition-all ${
              // activeTab === 'jobs' 
                'bg-blue-100 text-blue-600' 
                // : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">งาน</span>
          </button>
          
          <button
            // onClick={() => setActiveTab('palette')}
            className={`flex flex-col items-center p-3 w-15 rounded-lg transition-all ${
              // activeTab === 'palette' 
                 'bg-blue-100 text-blue-600' 
                // : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid3X3 className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">พาเลท</span>
          </button>
        </div>
      </div>

    </div>




  );
};
