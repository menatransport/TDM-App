"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Picture } from "@/components/picture";
import { Ticket } from "@/components/ticket";
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
  Weight ,
  Ruler,
  Fuel ,
  Phone ,
} from "lucide-react";

interface TransportItem {
  load_id: string;
  date_plan: string;
  h_plate: string;
  t_plate: string;
  fuel_type: string;
  height: string;
  weight: string;
  driver_name: string;
  phone: string;
  status: string;
  remark: string;
  locat_recive: string;
  locat_deliver: string;
  date_recive: string;
  date_deliver: string;
  pallet_type: string;
  pallet_plan: number;
  unload_cost: string;
  create_by: string;
  create_at: string;
  update_by: string;
  update_at: string;
}

interface AdminViewProps {
  jobView: TransportItem | null;
  closeModal: (close: boolean) => void;
}

export function AdminView({ jobView, closeModal }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState("jobs");
  const [formData, setFormData] = useState<TransportItem | null>(null);
  const [btn, setbtn] = useState("edit");
  const [savedAlert, setSavedAlert] = useState(false);
  const [statusTab, setStatusTab] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (jobView) {
      setFormData(jobView);
      const currentId = searchParams.get("id");
      if (jobView.load_id && currentId !== jobView.load_id) {
        const url = new URL(window.location.href);
        url.searchParams.set("id", jobView.load_id);
        router.replace(url.toString()); 
        const cancelStatus = ["ยกเลิก", "อบรมที่บริษัท", "ซ่อม", "ตกคิว"];
        if (cancelStatus.some(status => jobView.status?.includes(status))) {
          setStatusTab(true);
        } else {
          setStatusTab(false);
        }
      }
    }
  }, [jobView]);

  const handleChange = (field: keyof TransportItem, value: string | number) => {
    if (!formData) return;
    setFormData((prev) => ({
      ...prev!,
      [field]: value,
    }));
  };

  const handleSaved = () => {
    
  }

  return (
  <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm sm:max-w-4xl max-h-[95vh] sm:max-h-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">จัดการงาน</h3>
        </div>
        <button
          onClick={() => closeModal(false)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Tab Navigation - Responsive */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        <button
          onClick={() => {setActiveTab("jobs");setbtn("edit");}}
          className={`flex-1 min-w-fit flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-3 sm:px-6 font-medium transition-colors text-sm sm:text-base ${
            activeTab === "jobs"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="whitespace-nowrap">รายละเอียดงาน</span>
        </button>
        <button
          onClick={() => {setActiveTab("tickets");setbtn("edit");}}
          className={`flex-1 min-w-fit flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-3 sm:px-6 font-medium transition-colors text-sm sm:text-base ${
            activeTab === "tickets"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="whitespace-nowrap">ติดตามสถานะ</span>
        </button>
        <button
          onClick={() => {setActiveTab("images");setbtn("edit");}}
          className={`flex-1 min-w-fit flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-3 sm:px-6 font-medium transition-colors text-sm sm:text-base ${
            activeTab === "images"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          <Image className="w-4 h-4" />
          <span className="whitespace-nowrap">รูปภาพ</span>
        </button>
      </div>

      {/* Content Area - Responsive scroll */}
      <div className="p-3 sm:p-6 max-h-[60vh] sm:max-h-[50vh] overflow-y-auto">
        {activeTab === "jobs" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Transport Details Form */}
            <div
              className={`flex flex-col justify-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-lg text-gray-600 ${
                btn === "edit" ? "bg-gray-50" : "bg-white"
              }`}
            >
              <h4 className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                ข้อมูลจัดส่ง
              </h4>

              {/* Grid layout for mobile/desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Date Plan */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    วันที่วางแผน
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.date_plan || ""}
                    onChange={(e) => handleChange("date_plan", e.target.value)}
                    readOnly={btn === "edit"}
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.h_plate || ""}
                    onChange={(e) => handleChange("h_plate", e.target.value)}
                    readOnly={btn === "edit"}
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.t_plate || ""}
                    onChange={(e) => handleChange("t_plate", e.target.value)}
                    readOnly={btn === "edit"}
                  />
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Fuel  className="w-4 h-4" />
                    ประเภทเชื้อเพลิง
                  </label>
                  <select
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.fuel_type || ""}
                    onChange={(e) => handleChange("fuel_type", e.target.value)}
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.height || ""}
                    onChange={(e) => handleChange("height", e.target.value)}
                    readOnly={btn === "edit"}
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Weight  className="w-4 h-4" />
                    น้ำหนักรถ
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.weight || ""}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    readOnly={btn === "edit"}
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.driver_name || ""}
                    onChange={(e) =>
                      handleChange("driver_name", e.target.value)
                    }
                    readOnly={btn === "edit"}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone  className="w-4 h-4" />
                    เบอร์โทร
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    readOnly={btn === "edit"}
                  />
                </div>

                {/* Location Receive */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    สถานที่ขึ้นสินค้า
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.locat_recive || ""}
                    onChange={(e) =>
                      handleChange("locat_recive", e.target.value)
                    }
                    readOnly={btn === "edit"}
                  />
                </div>

                {/* Location Deliver */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    สถานที่ลงสินค้า
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.locat_deliver || ""}
                    onChange={(e) =>
                      handleChange("locat_deliver", e.target.value)
                    }
                    readOnly={btn === "edit"}
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.date_recive || ""}
                    onChange={(e) =>
                      handleChange("date_recive", e.target.value)
                    }
                    readOnly={btn === "edit"}
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.date_deliver || ""}
                    onChange={(e) =>
                      handleChange("date_deliver", e.target.value)
                    }
                    readOnly={btn === "edit"}
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
                    value={formData?.pallet_type || ""}
                    onChange={(e) =>
                      handleChange("pallet_type", e.target.value)
                    }
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.pallet_plan || ""}
                    onChange={(e) =>
                      handleChange(
                        "pallet_plan",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    readOnly={btn === "edit"}
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={formData?.unload_cost || ""}
                    onChange={(e) =>
                      handleChange("unload_cost", e.target.value)
                    }
                    readOnly={btn === "edit"}
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm sm:text-base"
                    value={formData?.remark || ""}
                    onChange={(e) => handleChange("remark", e.target.value)}
                    readOnly={btn === "edit"}
                  />
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                ข้อมูลระบบ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs text-gray-500">สร้างโดย</label>
                  <input
                    type="text"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                    placeholder="ชื่อผู้สร้าง"
                    value={formData?.create_by || ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">วันที่สร้าง</label>
                  <input
                    type="text"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                    value={formData?.create_at || ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">
                    แก้ไขล่าสุดโดย
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                    placeholder="ชื่อผู้แก้ไข"
                    value={formData?.update_by || ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">วันที่แก้ไข</label>
                  <input
                    type="text"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                    value={formData?.update_at || ""}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div className="space-y-4 sm:space-y-6">
            <Picture onLoadingChange={() => false} />
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="space-y-4 sm:space-y-6">
            <Ticket onLoadingChange={() => false} />
          </div>
        )}
      </div>

      {/* Footer Buttons - Responsive */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-6 border-t shadow-lg border-gray-200 bg-white">
        <button
          onClick={() => closeModal(false)}
          className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
        >
          ปิด
        </button>
        {activeTab === "jobs" && btn === "edit" && (
          <button
            onClick={() => setbtn("saved")}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-medium rounded-lg hover:from-yellow-700 hover:to-yellow-800 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
          >
            แก้ไข
          </button>
        )}
        {activeTab === "jobs" && btn === "saved" && (
          <button
            onClick={() => setSavedAlert(true)}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
          >
            บันทึก
          </button>
        )}
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
);
}
