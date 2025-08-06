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
  AlertCircle
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
  console.log("jobView : ", jobView);
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
          console.log('statusTab1')
          setStatusTab(true);
        } else {
          console.log('statusTab2')
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
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-start justify-center z-50 p-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">จัดการงาน</h3>
          </div>
          <button
            onClick={() => closeModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => {setActiveTab("jobs");setbtn("edit");}}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors ${
              activeTab === "jobs"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-4 h-4" />
            รายละเอียดงาน
          </button>
          <button
            onClick={() => {setActiveTab("tickets");setbtn("edit");}}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors ${
              activeTab === "tickets"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Clock className="w-4 h-4" />
            ติดตามสถานะ
          </button>
          <button
            onClick={() => {setActiveTab("images");setbtn("edit");}}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors ${
              activeTab === "images"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Image className="w-4 h-4" />
            รูปภาพ
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-150 overflow-y-auto">
          {activeTab === "jobs" && (
            <div className="space-y-6">
              {/* Transport Details Form */}
              <div
                className={`flex flex-col justify-center gap-6 p-4 rounded-lg text-gray-600 ${
                  btn === "edit" ? "bg-gray-50" : "bg-white"
                }`}
              >
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  ข้อมูลจัดส่ง
                </h4>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    วันที่วางแผน
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData?.t_plate || ""}
                    onChange={(e) => handleChange("t_plate", e.target.value)}
                    readOnly={btn === "edit"}
                  />
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Truck className="w-4 h-4" />
                    ประเภทเชื้อเพลิง
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    <Truck className="w-4 h-4" />
                    ความสูงรถ
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData?.height || ""}
                    onChange={(e) => handleChange("height", e.target.value)}
                    readOnly={btn === "edit"}
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Truck className="w-4 h-4" />
                    น้ำหนักรถ
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    <User className="w-4 h-4" />
                    เบอร์โทร
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData?.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    readOnly={btn === "edit"}
                  />
                </div>

                {/* Location Receive */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    สถานที่ขึ้นสินค้า
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData?.locat_recive || ""}
                    onChange={(e) =>
                      handleChange("locat_recive", e.target.value)
                    }
                    readOnly={btn === "edit"}
                  />
                </div>

                {/* Location Deliver */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    สถานที่ลงสินค้า
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData?.unload_cost || ""}
                    onChange={(e) =>
                      handleChange("unload_cost", e.target.value)
                    }
                    readOnly={btn === "edit"}
                  />
                </div>

                {/* Remark */}
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4" />
                    หมายเหตุ
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    value={formData?.remark || ""}
                    onChange={(e) => handleChange("remark", e.target.value)}
                    readOnly={btn === "edit"}
                  />
                </div>
              </div>

              {/* Metadata Section */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  ข้อมูลระบบ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">สร้างโดย</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                      placeholder="ชื่อผู้สร้าง"
                      value={formData?.create_by || ""}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">วันที่สร้าง</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600"
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
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                      placeholder="ชื่อผู้แก้ไข"
                      value={formData?.update_by || ""}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">วันที่แก้ไข</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-600"
                      value={formData?.update_at || ""}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "images" && (
            <div className="space-y-6">
              <Picture onLoadingChange={() => false} />
            </div>
          )}

          {activeTab === "tickets" && (
            <div className="space-y-6">
              <Ticket onLoadingChange={() => false} />
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => closeModal(false)}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            ปิด
          </button>
          {activeTab === "jobs" && btn === "edit" && (
            <button
              onClick={() => setbtn("saved")}
              className="px-6 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-medium rounded-lg hover:from-yellow-700 hover:to-yellow-800 shadow-lg hover:shadow-xl transition-all"
            >
              แก้ไข
            </button>
          )}
          {activeTab === "jobs" && btn === "saved" && (
            <button
              onClick={() => setSavedAlert(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
            >
              บันทึก
            </button>
          )}
        </div>
      </div>


          {savedAlert && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">ยืนยันการบันทึก</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              คุณแน่ใจหรือไม่ที่จะยืนยันข้อมูลนี้? 
            </p>
            <div className="flex justify-start mb-4">
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSavedAlert(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {handleSaved()}}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
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
