"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  X,
  Briefcase,
  Image,
  Calendar,
  MapPin,
  Clock,
  User,
  FileText,
  DollarSign,
  Truck,
  Package,
  AlertCircle,
  Weight,
  Ruler,
  Fuel,
  Phone,
  Check,
  ChevronDown,
} from "lucide-react";
import Swal from "sweetalert2";

interface JobData {
  date_plan: string;
  h_plate: string;
  t_plate: string;
  fuel_type: string;
  height: string;
  weight: string;
  driver_name: string;
  phone: string;
  status?: string;
  remark: string;
  job_type?: string;
  locat_recive: string;
  date_recive: string;
  locat_deliver: string;
  date_deliver: string;
  unload_cost: string;
  pallet_plan: string;
  pallet_type: string;
}

interface FormItem {
  id: number;
  isExpanded: boolean;
  data: JobData;
}
export function AdminCreate({
  closeModal,
}: {
  closeModal: (close: boolean) => void;
}) {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [btn] = useState<string>("create");
  const [navjob, setNavjob] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);
  const [aiGenerator, setAigenerator] = useState<{
    show: boolean;
    input: string;
    value: string[];
  }>({
    show: true,
    input: "",
    value: [],
  });

const getEmptyJobData = (): JobData => ({
    date_plan: "",
    h_plate: "",
    t_plate: "",
    fuel_type: "",
    height: "",
    weight: "",
    driver_name: "",
    phone: "",
    status: "",
    remark: "",
    job_type: "",
    locat_recive: "",
    date_recive: "",
    locat_deliver: "",
    date_deliver: "",
    unload_cost: "",
    pallet_plan: "",
    pallet_type: "",
  });

  const handleChange = (formId: number, field: string, value: string | number) => {
    setForms(prev => 
      prev.map(form => 
        form.id === formId 
          ? { ...form, data: { ...form.data, [field]: value } }
          : form
      )
    );
  };

   const handleSaved = () => {
     Swal.fire({
            title: "บันทึกข้อมูลสำเร็จ",
            text: "ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว",
            icon: "success",
            confirmButtonText: "ตกลง",
            allowOutsideClick: false,
          });
          setSavedAlert(false)
  }


  const handleAigenerator = async () => {
    console.log(aiGenerator.input);

    if (aiGenerator.input.trim().length === 0) {
      console.warn("Input is empty");
      return;
    }

    let prompt = `ช่วยแปลงข้อมูลต่อไปนี้ให้อยู่ในรูป JSON Array โดยไม่ต้องใส่คำอธิบายส่งค่าผลลัพธ์มาอย่างเดียว โดยให้ key ตามนี้:
date_plan (รูปแบบ YYYY-MM-DD),
h_plate,
t_plate,
fuel_type,
height (ตัวเลขหรือ null),
weight (ตัวเลขหรือ null),
driver_name,
phone,
status,
remark,
job_type,
locat_recive,
date_recive (รูปแบบ dd/mm/yyyy, HH:mm),
locat_deliver,
date_deliver (รูปแบบ dd/mm/yyyy, HH:mm),
unload_cost,
pallet_plan (ตัวเลข),
pallet_type

ข้อมูล: ${aiGenerator.input}`;

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
 const data = await res.json();
  let content = data["candidates"][0]["content"]["parts"][0]["text"];
  content = content.replace(/```json|```/g, "").trim();
  const parsedDataArray = JSON.parse(content); // สมมติเป็น Array ของ JobData
  console.log("Parsed Data:", parsedDataArray);
  if (Array.isArray(parsedDataArray)) {
    // แปลงแต่ละ item ให้เป็น FormItem พร้อม id
    const newForms: FormItem[] = parsedDataArray.map((item: any, index: number) => {
      const jobData: JobData = {
        date_plan: item.date_plan || "",
        h_plate: item.h_plate || "",
        t_plate: item.t_plate || "",
        fuel_type: item.fuel_type || "",
        height: item.height ? String(item.height) : "",
        weight: item.weight ? String(item.weight) : "",
        driver_name: item.driver_name || "",
        phone: item.phone || "",
        status: item.status || "",
        remark: item.remark || "",
        job_type: item.job_type || "",
        locat_recive: item.locat_recive || "",
        date_recive: item.date_recive || "",
        locat_deliver: item.locat_deliver || "",
        date_deliver: item.date_deliver || "",
        unload_cost: item.unload_cost || "",
        pallet_plan: item.pallet_plan ? String(item.pallet_plan) : "",
        pallet_type: item.pallet_type || "",
      };

      return {
        id: forms.length + index, 
        isExpanded: false,
        data: jobData,
      };
    });

    setForms((prev) => [...prev, ...newForms]);
    setNavjob(true);
  } else {
    console.warn("Expected an array but got:", parsedDataArray);
  }
} catch (error) {
  console.error("Error parsing data:", error);
}
  };

  const handleAddForm = () => {
    setNavjob(true); 
    console.log("Adding new form");
    const newForm: FormItem = {
      id: forms.length,
      isExpanded: false,
      data: getEmptyJobData(),
    };
    setForms(prev => [...prev, newForm]);
    console.log("New form added:", newForm);
  };

  const toggleExpanded = (key: number) => {
    setForms((prev) =>
      prev.map((form, index) =>
        index === key ? { ...form, isExpanded: !form.isExpanded } : form
      )
    );
  };

  const ElementForm = ({
    formData,
  }: {
    formData: { id: number;  isExpanded: boolean; data: JobData };
  }) => {
    return (
     (navjob && <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-2">
        <div
          className="flex flex-row items-center gap-4 p-4   cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleExpanded(formData.id)}
        >

          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800">#{formData.id + 1}</h2>
          </div>

          {/* Toggle Icon */}
          <div
            className={`p-2 rounded-lg bg-gray-100 text-gray-600 transition-all duration-200 ${
              formData.isExpanded ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>

        {/* Job Cards */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            formData.isExpanded
              ? "max-h-auto opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  วันที่วางแผน
                </label>
                <input
                  type="text"
                  value={formData.data.date_plan}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) => handleChange(formData.id, "date_plan", e.target.value)}
                />
              </div>

              {/* Head Plate */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4" />
                  ทะเบียนหัว
                </label>
                <input
                  type="text"
                  value={formData.data.h_plate}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                 onChange={(e) => handleChange(formData.id, "h_plate", e.target.value)}
                />
              </div>

              {/* Tail Plate */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4" />
                  ทะเบียนหาง
                </label>
                <input
                  type="text"
                  value={formData.data.t_plate}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                 onChange={(e) => handleChange(formData.id, "t_plate", e.target.value)}
                />
              </div>

              {/* Fuel Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Fuel className="w-4 h-4" />
                  ประเภทเชื้อเพลิง
                </label>
                <select
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  value={formData.data.fuel_type}
                  onChange={(e) => handleChange(formData.id, "fuel_type", e.target.value)}
                  disabled={btn === "edit"}
                >
                  <option value=""></option>
                  <option value="ดีเซล">ดีเซล</option>
                  <option value="NGV">NGV</option>
                </select>
              </div>

              {/* Height */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Ruler className="w-4 h-4" />
                  ความสูงรถ
                </label>
                <input
                  type="text"
                  value={formData.data.height}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) => handleChange(formData.id, "height", e.target.value)}
                />
              </div>

              {/* Weight */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Weight className="w-4 h-4" />
                  น้ำหนักรถ
                </label>
                <input
                  type="text"
                  value={formData.data.weight}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) => handleChange(formData.id, "weight", e.target.value)}
                />
              </div>

              {/* Driver Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  ชื่อพจส.
                </label>
                <input
                  type="text"
                  value={formData.data.driver_name}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) => handleChange(formData.id, "driver_name", e.target.value)}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  เบอร์โทร
                </label>
                <input
                  type="tel"
                  value={formData.data.phone}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) => handleChange(formData.id, "phone", e.target.value)}
                />
              </div>

              {/* Location Receive */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  สถานที่ขึ้นสินค้า
                </label>
                <input
                  type="text"
                  value={formData.data.locat_recive}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) => handleChange(formData.id, "locat_recive", e.target.value)}
                />
              </div>

              {/* Location Deliver */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  สถานที่ลงสินค้า
                </label>
                <input
                  type="text"
                  value={formData.data.locat_deliver}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) =>
                    handleChange(formData.id, "locat_deliver", e.target.value)
                  }
                />
              </div>

              {/* Date Receive */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  วันที่ขึ้นสินค้า
                </label>
                <input
                  type="text"
                  value={formData.data.date_recive}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) => handleChange(formData.id, "date_recive", e.target.value)}
                />
              </div>

              {/* Date Deliver */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  วันที่ลงสินค้า
                </label>
                <input
                  type="text"
                  value={formData.data.date_deliver}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) => handleChange(formData.id, "date_deliver", e.target.value)}
                />
              </div>

              {/* Pallet Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4" />
                  ประเภทพาเลท
                </label>
                <select
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  value={formData.data.pallet_type}
                  onChange={(e) => handleChange(formData.id, "pallet_type", e.target.value)}
                  disabled={btn === "edit"}
                >
                  <option value=""></option>
                  <option value="แลกเปลี่ยน">แลกเปลี่ยน</option>
                  <option value="โอน">โอน</option>
                  <option value="รถเปล่า">รถเปล่า</option>
                </select>
              </div>

              {/* Pallet Plan */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4" />
                  จำนวนพาเลท
                </label>
                <input
                  type="number"
                  value={formData.data.pallet_plan}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) =>
                    handleChange(formData.id, "pallet_plan", e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>

              {/* Unload Cost */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4" />
                  ค่าลงสินค้า
                </label>
                <input
                  type="text"
                  value={formData.data.unload_cost}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  onChange={(e) => handleChange(formData.id, "unload_cost", e.target.value)}
                />
              </div>

              {/* Remark */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4" />
                  หมายเหตุ
                </label>
                <textarea
                  rows={3}
                  value={formData.data.remark}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm sm:text-base"
                  onChange={(e) => handleChange(formData.id, "remark", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
     )
    );
  };

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm sm:max-w-4xl max-h-[95vh] sm:max-h-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
              สร้างงาน
            </h3>
          </div>
          <button
            onClick={() => closeModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content Area - Responsive scroll */}
        <div className="p-3 sm:p-6 max-h-[60vh] sm:max-h-[50vh] overflow-y-auto">
          <div className="space-y-4 sm:space-y-6">
            <div
              className={`flex flex-col justify-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-lg text-gray-600 ${
                btn === "edit" ? "bg-gray-50" : "bg-white"
              }`}
            >
              <div className="flex flex-row items-start gap-3 mb-4">
                <button
                  onClick={() =>
                    setAigenerator({ show: true, input: "", value: [] })
                  }
                  className="group relative outline-0 bg-sky-200 [--sz-btn:38px] [--space:calc(var(--sz-btn)/5.5)] [--gen-sz:calc(var(--space)*2)] [--sz-text:calc(var(--sz-btn)-var(--gen-sz))] h-[var(--sz-btn)] w-[var(--sz-btn)] border border-solid border-transparent rounded-lg flex items-center justify-center aspect-square cursor-pointer transition-transform duration-200 active:scale-[0.95] bg-[linear-gradient(45deg,#efad21,#ffd60f)] [box-shadow:#3c40434d_0_1px_2px_0,#3c404326_0_2px_6px_2px,#0000004d_0_30px_60px_-30px,#34343459_0_-2px_6px_0_inset]"
                >
                  <svg
                    className="animate-pulse absolute z-10 overflow-visible transition-all duration-300 text-[#ffea50] group-hover:text-white top-[calc(var(--sz-text)/7)] left-[calc(var(--sz-text)/7)] h-[var(--gen-sz)] w-[var(--gen-sz)] group-hover:h-[var(--sz-text)] group-hover:w-[var(--sz-text)] group-hover:left-[calc(var(--sz-text)/4)] group-hover:top-[calc(calc(var(--gen-sz))/2)]"
                    stroke="none"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
                    ></path>
                  </svg>
                  <span className="text-lg font-extrabold leading-none text-white transition-all duration-200 group-hover:opacity-0">
                    AI
                  </span>
                </button>

                {aiGenerator.show && (
                  <div className="w-full relative">
                    <textarea
                      rows={4}
                      onChange={(e) =>
                        setAigenerator({
                          ...aiGenerator,
                          input: e.target.value,
                        })
                      }
                      value={aiGenerator.input}
                      className="peer w-full p-2  text-xs bg-inherit border-2 outline-none transition disabled:opacity-70 disabled:cursor-not-allowed border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-a"
                      placeholder=""
                    ></textarea>
                    <label className="pt-1 block text-gray-500 text-sm mb-3">
                      {" "}
                      AI Generator{" "}
                    </label>
                    <button className="bg-green-200 text-gray-700 font-semibold border border-green-600 rounded p-2 cursor-pointer">
                      <Check onClick={handleAigenerator} className="w-5 h-5 " />
                    </button>
                    <button className="bg-red-200 ml-3 text-gray-700 font-semibold border border-red-600 rounded p-2 cursor-pointer">
                      <X
                        onClick={() =>
                          setAigenerator({ show: false, input: "", value: [] })
                        }
                        className="w-5 h-5 "
                      />
                    </button>
                  </div>
                )}
              </div>
              <hr></hr>

              <h4 className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                ข้อมูลจัดส่ง
              </h4>
              <button
                onClick={handleAddForm}
                className="rounded-lg relative w-36 h-10 cursor-pointer flex items-center border border-green-500 bg-green-500 group hover:bg-green-600 active:bg-green-700 active:border-green-700"
              >
                <span className="text-white font-semibold ml-8 transform group-hover:translate-x-20 transition-all duration-300">
                  เพิ่มงาน
                </span>
                <span className="absolute right-0 h-full w-10 rounded-lg bg-green-500 flex items-center justify-center transform group-hover:translate-x-0 group-hover:w-full transition-all duration-300">
                  <svg
                    className="svg w-8 text-white"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line x1="12" x2="12" y1="5" y2="19"></line>
                    <line x1="5" x2="19" y1="12" y2="12"></line>
                  </svg>
                </span>
              </button>

              {forms.map((form, index) => (
                <ElementForm key={index} formData={form} />
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
            <button
              onClick={() => closeModal(false)}
              className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              ยกเลิก
            </button>
            <button  onClick={() => setSavedAlert(true)} className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
              บันทึก
            </button>
          </div>
        </div>

                {/* Confirmation Alert Modal */}
    {savedAlert && (
      <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-xs sm:max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 bg-green-100 rounded-full">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">ยืนยันการบันทึก</h3>
          </div>
          
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            คุณแน่ใจหรือไม่ที่จะยืนยันข้อมูลนี้? 
          </p>
          
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <button
              onClick={() => setSavedAlert(false)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm sm:text-base"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => {handleSaved()}}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    )}

      </div>
    </div>
  );
}
