"use client";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  X,
  Briefcase,
  Calendar,
  MapPin,
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
  Plus,
  Loader2,
  Copy,
  RefreshCw,
  Search,
  Save,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Swal from "sweetalert2";
import { usegetListName, useUserStore } from "@/lib/userStore";

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
  unload_cost: number | string;
  pallet_plan: number | string;
  pallet_type: string;
}

interface FormItem {
  id: number;
  isExpanded: boolean;
  data: JobData;
}

interface DriverData {
  name: string;
  phone: string;
  h_plate: string;
  t_plate: string;
  fuel_type: string;
  height: string;
  weight: string;
  created_at?: string;
  locat_recive?: string;
  locat_deliver?: string;
  job_type?: string;
  pallet_type?: string;
  pallet_plan?: number;
  unload_cost?: string;
}

interface QuickFillData {
  recentLocations: string[];
  recentJobTypes: string[];
  recentDrivers: DriverData[];
}

export function AdminCreateNew({
  closeModal,
  refreshTable,
}: {
  closeModal: (close: boolean) => void;
  refreshTable?: () => void;
}) {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [savedAlert, setSavedAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quickFillData, setQuickFillData] = useState<QuickFillData>({
    recentLocations: [],
    recentJobTypes: [],
    recentDrivers: [],
  });
  const [showDriverDropdown, setShowDriverDropdown] = useState<{
    [key: number]: boolean;
  }>({});
  const [driverSearchTerm, setDriverSearchTerm] = useState<{
    [key: number]: string;
  }>({});

  // Get data from stores
  const listname = usegetListName();
  const { accessToken } = useUserStore();

  // Load recent data for quick fill
  useEffect(() => {
    const loadQuickFillData = async () => {
      try {
        const access_token = localStorage.getItem("access_token");
        const res = await fetch("/api/admin", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
            query: "limit=50",
          },
        });

        if (res.ok) {
          const data = await res.json();
          const jobs = data.jobs || [];

          // Extract data grouped by driver
          const locations = new Set<string>();
          const jobTypes = new Set<string>();
          const driversMap = new Map<string, DriverData>();

          jobs.forEach((job: any) => {
            if (job.locat_recive) locations.add(job.locat_recive);
            if (job.locat_deliver) locations.add(job.locat_deliver);
            if (job.job_type) jobTypes.add(job.job_type);

            // Keep latest data for each driver
            if (job.driver_name) {
              const existing = driversMap.get(job.driver_name);
              if (
                !existing ||
                new Date(job.created_at || 0) >
                  new Date(existing.created_at || 0)
              ) {
                driversMap.set(job.driver_name, {
                  name: job.driver_name,
                  phone: job.phone || "",
                  h_plate: job.h_plate || "",
                  t_plate: job.t_plate || "",
                  fuel_type: job.fuel_type || "",
                  height: job.height || "",
                  weight: job.weight || "",
                  created_at: job.created_at || "",
                  locat_recive: job.locat_recive || "",
                  locat_deliver: job.locat_deliver || "",
                  job_type: job.job_type || "",
                  pallet_type: job.pallet_type || "",
                  pallet_plan: job.pallet_plan || 0,
                  unload_cost: job.unload_cost || "",
                });
              }
            }
          });

          setQuickFillData({
            recentLocations: Array.from(locations),
            recentJobTypes: Array.from(jobTypes),
            recentDrivers: Array.from(driversMap.values()),
          });
        }
      } catch (error) {
        console.error("Error loading quick fill data:", error);
      }
    };

    loadQuickFillData();
  }, []);

  const getEmptyJobData = useCallback(
    (): JobData => ({
      date_plan: new Date().toISOString().split("T")[0],
      h_plate: "",
      t_plate: "",
      fuel_type: "",
      height: "",
      weight: "",
      driver_name: "",
      phone: "",
      status: "พร้อมรับงาน",
      remark: "",
      job_type: "",
      locat_recive: "",
      date_recive: "",
      locat_deliver: "",
      date_deliver: "",
      unload_cost: "",
      pallet_plan: 0,
      pallet_type: "null",
    }),
    []
  );

  // Form change handler
  const handleChange = useCallback(
    (formId: number, field: keyof JobData, value: string | number) => {
      setForms((prev) =>
        prev.map((form) =>
          form.id === formId
            ? { ...form, data: { ...form.data, [field]: value } }
            : form
        )
      );
    },
    []
  );

  const handleDriverSelect = useCallback(
    (formId: number, driverName: string) => {
      const driverData = quickFillData.recentDrivers.find(
        (d) => d.name === driverName
      );

      if (driverData) {
        setForms((prev) =>
          prev.map((form) =>
            form.id === formId
              ? {
                  ...form,
                  data: {
                    ...form.data,
                    driver_name: driverData.name,
                    phone: driverData.phone,
                    h_plate: driverData.h_plate,
                    t_plate: driverData.t_plate,
                    fuel_type: driverData.fuel_type,
                    height: driverData.height,
                    weight: driverData.weight,
                    // locat_recive: driverData.locat_recive || form.data.locat_recive,
                    // locat_deliver: driverData.locat_deliver || form.data.locat_deliver,
                    // job_type: driverData.job_type || form.data.job_type,
                    // pallet_type: driverData.pallet_type || form.data.pallet_type,
                    // pallet_plan: driverData.pallet_plan || form.data.pallet_plan,
                    // unload_cost: driverData.unload_cost || form.data.unload_cost,
                  },
                }
              : form
          )
        );

        // Show success message
        Swal.fire({
          title: "เติมข้อมูลสำเร็จ",
          text: `ข้อมูลของ ${driverName} ถูกเติมอัตโนมัติแล้ว`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      } else {
        // Just set driver name
        handleChange(formId, "driver_name", driverName);
      }

      setShowDriverDropdown((prev) => ({ ...prev, [formId]: false }));
      setDriverSearchTerm((prev) => ({ ...prev, [formId]: "" }));
    },
    [quickFillData.recentDrivers, handleChange]
  );

  const getFilteredDrivers = useCallback(
    (formId: number) => {
      const searchTerm = driverSearchTerm[formId] || "";
      const allDrivers = [
        ...new Set([
          ...listname,
          ...quickFillData.recentDrivers.map((d) => d.name),
        ]),
      ];

      if (searchTerm.length === 0)
        return allDrivers.sort((a, b) => a.localeCompare(b));

      return allDrivers.filter((name) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    [listname, quickFillData.recentDrivers, driverSearchTerm]
  );

  const copyFromPreviousForm = useCallback(
    (currentFormId: number) => {
      const currentIndex = forms.findIndex((f) => f.id === currentFormId);
      if (currentIndex > 0) {
        const previousForm = forms[currentIndex - 1];
        setForms((prev) =>
          prev.map((form) =>
            form.id === currentFormId
              ? {
                  ...form,
                  data: {
                    ...previousForm.data,
                    date_plan: form.data.date_plan,
                    date_recive: form.data.date_recive,
                    date_deliver: form.data.date_deliver,
                  },
                }
              : form
          )
        );

        Swal.fire({
          title: "คัดลอกข้อมูลสำเร็จ",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    },
    [forms]
  );

  // Save handler
  const handleSaved = useCallback(async () => {
    if (forms.length === 0) {
      await Swal.fire({
        title: "ไม่มีข้อมูล",
        text: "กรุณาเพิ่มข้อมูลอย่างน้อย 1 งาน",
        icon: "warning",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    const db = forms.map((form) => form.data);

    // Validate required fields
    const invalidItems = db.filter(
      (item) =>
        !item.date_plan ||
        !item.h_plate ||
        !item.t_plate ||
        !item.driver_name ||
        !item.locat_recive ||
        !item.date_recive ||
        !item.locat_deliver ||
        !item.date_deliver
    );

    if (invalidItems.length > 0) {
      await Swal.fire({
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณากรอกข้อมูลที่มี * ให้ครบถ้วน",
        icon: "warning",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    setIsLoading(true);

    try {
      const access_token = localStorage.getItem("access_token");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(db),
      });

      if (res.ok) {
        await Swal.fire({
          title: "บันทึกข้อมูลสำเร็จ",
          text: `บันทึกงาน ${forms.length} เที่ยวเรียบร้อยแล้ว`,
          icon: "success",
          confirmButtonText: "ตกลง",
          allowOutsideClick: false,
        });
        refreshTable?.();
        setSavedAlert(false);
        closeModal(false);
      } else {
        const errorData = await res.text();
        await Swal.fire({
          title: "บันทึกข้อมูลไม่สำเร็จ",
          text: `เกิดข้อผิดพลาด: ${errorData}`,
          icon: "error",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (error) {
      console.error("Error saving data:", error);
      await Swal.fire({
        title: "บันทึกข้อมูลไม่สำเร็จ",
        text: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setIsLoading(false);
    }
  }, [forms, closeModal, refreshTable]);

  // Form handlers
  const handleAddForm = useCallback(() => {
    const newForm: FormItem = {
      id: Date.now(),
      isExpanded: true,
      data: getEmptyJobData(),
    };

    // Hide all existing forms and show only the new one
    setForms((prev) => [
      ...prev.map((form) => ({ ...form, isExpanded: false })),
      newForm,
    ]);
  }, [getEmptyJobData]);

  const toggleExpanded = useCallback((formId: number) => {
    setForms((prev) =>
      prev.map((form) =>
        form.id === formId
          ? { ...form, isExpanded: !form.isExpanded }
          : { ...form, isExpanded: false }
      )
    );
  }, []);

  const removeForm = useCallback((formId: number) => {
    setForms((prev) => prev.filter((form) => form.id !== formId));
    setShowDriverDropdown((prev) => {
      const newState = { ...prev };
      delete newState[formId];
      return newState;
    });
    setDriverSearchTerm((prev) => {
      const newState = { ...prev };
      delete newState[formId];
      return newState;
    });
  }, []);

  // Form Component
  const FormCard = ({
    formData,
    index,
  }: {
    formData: FormItem;
    index: number;
  }) => {
    const canCopyFromPrevious = index > 0;

    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden mb-6">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all"
          onClick={() => toggleExpanded(formData.id)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              {index + 1}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                เที่ยวงาน #{index + 1}
              </h3>
              <p className="text-sm text-gray-600">
                {formData.data.driver_name || "ยังไม่ได้เลือกพนักงานขับรถ"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCopyFromPrevious && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyFromPreviousForm(formData.id);
                }}
                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-all"
                title="คัดลอกจากงานก่อนหน้า"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                removeForm(formData.id);
              }}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className={`p-2 rounded-lg bg-gray-100 text-gray-600 transition-all ${
                formData.isExpanded ? "rotate-180" : ""
              }`}
            >
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            formData.isExpanded
              ? "max-h-none opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* วันที่วางแผน */}
              <div className="lg:col-span-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  วันที่วางแผน <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.data.date_plan}
                  onChange={(e) =>
                    handleChange(formData.id, "date_plan", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* ชื่อพนักงานขับรถ - Dropdown with Search */}
              <div className="lg:col-span-2 relative">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <User className="w-4 h-4 text-green-500" />
                  ชื่อพนักงานขับรถ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={
                      driverSearchTerm[formData.id] || formData.data.driver_name
                    }
                    onChange={(e) => {
                      setDriverSearchTerm((prev) => ({
                        ...prev,
                        [formData.id]: e.target.value,
                      }));
                      if (e.target.value !== formData.data.driver_name) {
                        handleChange(
                          formData.id,
                          "driver_name",
                          e.target.value
                        );
                      }
                      setShowDriverDropdown((prev) => ({
                        ...prev,
                        [formData.id]: true,
                      }));
                    }}
                    onFocus={() =>
                      setShowDriverDropdown((prev) => ({
                        ...prev,
                        [formData.id]: true,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>

                {/* Dropdown */}
                {showDriverDropdown[formData.id] && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {getFilteredDrivers(formData.id).map((driverName, idx) => {
                      const driverData = quickFillData.recentDrivers.find(
                        (d) => d.name === driverName
                      );
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            handleDriverSelect(formData.id, driverName)
                          }
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-gray-800">
                              {driverName}
                            </div>
                            {driverData && (
                              <div className="text-sm text-gray-500">
                                {driverData.h_plate &&
                                  `${driverData.h_plate} - ${driverData.t_plate}`}
                                {driverData.phone && ` • ${driverData.phone}`}
                              </div>
                            )}
                          </div>
                          {driverData && (
                            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              มีข้อมูลเก่า
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {getFilteredDrivers(formData.id).length === 0 && (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        ไม่พบข้อมูลพนักงาน
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* เบอร์โทร */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Phone className="w-4 h-4 text-purple-500" />
                  เบอร์โทร
                </label>
                <input
                  type="tel"
                  value={formData.data.phone}
                  onChange={(e) =>
                    handleChange(formData.id, "phone", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* ทะเบียนหัว */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Truck className="w-4 h-4 text-orange-500" />
                  ทะเบียนหัว <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.data.h_plate}
                  onChange={(e) =>
                    handleChange(formData.id, "h_plate", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* ทะเบียนหาง */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Truck className="w-4 h-4 text-orange-500" />
                  ทะเบียนหาง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.data.t_plate}
                  onChange={(e) =>
                    handleChange(formData.id, "t_plate", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* ประเภทเชื้อเพลิง */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Fuel className="w-4 h-4 text-red-500" />
                  ประเภทเชื้อเพลิง
                </label>
                <select
                  value={formData.data.fuel_type}
                  onChange={(e) =>
                    handleChange(formData.id, "fuel_type", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">เลือกประเภทเชื้อเพลิง</option>
                  <option value="ดีเซล">ดีเซล</option>
                  <option value="NGV">NGV</option>
                  <option value="ไฟฟ้า">ไฟฟ้า</option>
                </select>
              </div>

              {/* ความสูงรถ */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Ruler className="w-4 h-4 text-indigo-500" />
                  ความสูงรถ (เมตร)
                </label>
                <input
                  type="text"
                  value={formData.data.height}
                  onChange={(e) =>
                    handleChange(formData.id, "height", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* น้ำหนักรถ */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Weight className="w-4 h-4 text-pink-500" />
                  น้ำหนักจำกัด (ตัน)
                </label>
                <input
                  type="text"
                  value={formData.data.weight}
                  onChange={(e) =>
                    handleChange(formData.id, "weight", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* ประเภทงาน */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Package className="w-4 h-4 text-cyan-500" />
                  ประเภทงาน
                </label>
                <select
                  value={formData.data.job_type}
                  onChange={(e) =>
                    handleChange(formData.id, "job_type", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">เลือกประเภทงาน</option>
                  <option value="ดรอป">ดรอป</option>
                  <option value="ทอย">ทอย</option>
                </select>
              </div>

              {/* ประเภทพาเลท */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Package className="w-4 h-4 text-yellow-500" />
                  ประเภทพาเลท
                </label>
                <select
                  value={formData.data.pallet_type}
                  onChange={(e) =>
                    handleChange(formData.id, "pallet_type", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="null">ไม่มี</option>
                  <option value="แลกเปลี่ยน">แลกเปลี่ยน</option>
                  <option value="โอน">โอน</option>
                  <option value="รถเปล่า">รถเปล่า</option>
                </select>
              </div>

              {/* จำนวนพาเลท */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Package className="w-4 h-4 text-teal-500" />
                  จำนวนพาเลท
                </label>
                <input
                  type="number"
                  value={formData.data.pallet_plan}
                  onChange={(e) =>
                    handleChange(
                      formData.id,
                      "pallet_plan",
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* สถานที่ขึ้นสินค้า */}
              <div className="lg:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <MapPin className="w-4 h-4 text-green-500" />
                  สถานที่ขึ้นสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.data.locat_recive}
                  onChange={(e) =>
                    handleChange(formData.id, "locat_recive", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* วันที่ขึ้นสินค้า */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  วันที่ขึ้นสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.data.date_recive}
                  onChange={(e) =>
                    handleChange(formData.id, "date_recive", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* สถานที่ลงสินค้า */}
              <div className="lg:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <MapPin className="w-4 h-4 text-red-500" />
                  สถานที่ลงสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.data.locat_deliver}
                  onChange={(e) =>
                    handleChange(formData.id, "locat_deliver", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* วันที่ลงสินค้า */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  วันที่ลงสินค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.data.date_deliver}
                  onChange={(e) =>
                    handleChange(formData.id, "date_deliver", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* ค่าลงสินค้า */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  ค่าลงสินค้า (บาท)
                </label>
                <input
                  type="text"
                  value={formData.data.unload_cost}
                  onChange={(e) =>
                    handleChange(formData.id, "unload_cost", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* หมายเหตุ */}
              <div className="lg:col-span-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  หมายเหตุ
                </label>
                <textarea
                  rows={3}
                  value={formData.data.remark}
                  onChange={(e) =>
                    handleChange(formData.id, "remark", e.target.value)
                  }
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[105vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white bg-opacity-20 rounded-2xl">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                สร้างเที่ยวงานใหม่
              </h3>
              <p className="text-blue-100">จัดการงานขนส่งอย่างมีประสิทธิภาพ</p>
            </div>
          </div>
          <button
            onClick={() => closeModal(false)}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="hidden bg-gray-50 p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {listname.length}
              </div>
              <div className="text-sm text-gray-600">พนักงานขับรถ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {quickFillData.recentLocations.length}
              </div>
              <div className="text-sm text-gray-600">สถานที่</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {quickFillData.recentDrivers.length}
              </div>
              <div className="text-sm text-gray-600">ข้อมูลรถ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {forms.length}
              </div>
              <div className="text-sm text-gray-600">งานที่สร้าง</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Add Form Button */}
          <div className="mb-6">
            <button
              onClick={handleAddForm}
              className="w-full cursor-pointer md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              เพิ่มเที่ยวงาน
            </button>
          </div>

          {/* Forms */}
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                ยังไม่มีเที่ยวงาน
              </h3>
              <p className="text-gray-500 mb-6">
                เริ่มต้นสร้างงานขนส่งแรกของคุณ
              </p>
              <button
                onClick={handleAddForm}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl transition-colors"
              >
                สร้างงานแรก
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {forms.map((form, index) => (
                <FormCard key={form.id} formData={form} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-1 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={() => closeModal(false)}
              className="py-1 px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => setSavedAlert(true)}
              disabled={isLoading || forms.length === 0}
              className="py-1 px-6 sm:py-3  bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  บันทึกทั้งหมด ({forms.length} งาน)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {savedAlert && (
          <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  ยืนยันการบันทึก
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                คุณต้องการบันทึกงาน {forms.length} เที่ยวนี้หรือไม่?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSavedAlert(false)}
                  disabled={isLoading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaved}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      ยืนยัน
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {Object.values(showDriverDropdown).some(Boolean) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowDriverDropdown({});
            setDriverSearchTerm({});
          }}
        />
      )}
    </div>
  );
}
