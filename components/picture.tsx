"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  Eye,
  X,
  Trash2,
  Camera,
  ImagePlus,
  AlertCircle,
  Check,
  ImageIcon,
} from "lucide-react";

interface ImageFile {
  id: string;
  file?: File;
  url: string;
  name: string;
  size?: number;
  isUploaded?: boolean;
  category?: string;
  key: string;
}

const IMAGE_CATEGORIES = [
  { value: '', label: 'เลือกประเภทรูปภาพ' },
  { value: 'origin', label: 'ต้นทาง' },
  { value: 'destination', label: 'ปลายทาง' },
  { value: 'damage', label: 'เสียหาย' },
  { value: 'pallet', label: 'พาเลท' },
  { value: 'bill', label: 'บิลทางด่วน' },
  { value: 'other', label: 'อื่นๆ' }
];

type TicketProps = {
  onLoadingChange: (loading: boolean) => void;
};

export const Picture = ({ onLoadingChange }: TicketProps) => {

  const fileInputRef = useRef<HTMLInputElement>(null); 
  const [uploadImages, setUploadImages] = useState<ImageFile[]>([]);
  const [databaseImages, setDatabaseImages] = useState<ImageFile[]>([]); 
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [deleteAlert, setDeleteAlert] = useState<{
    show: boolean;
    imageId: string;
    imageType: 'upload' | 'database';
  }>({
    show: false,
    imageId: '',
    imageType: 'upload'
  });

  const [isUploading, setIsUploading] = useState(false);
  const [JobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");
  const status = params.get("status") || "";
  setJobId(jobId);
  setStatus(status);

  const fetchImages = async () => {
    try {
      const res = await fetch("/api/upload", {
        method: "GET",
        headers: {
          id: jobId ?? "",
        },
      });

      const getimages = await res.json();
      // console.log("getimages : ",getimages)
      setDatabaseImages(getimages.images);
      onLoadingChange(false)
    } catch (error) {
      console.error("Error fetching data:", error);
      onLoadingChange(false)
    }
  };

  if (jobId) {
    fetchImages();
  }
}, []);


       

const handleUpload = async () => {
  if (uploadImages.length === 0) {
    alert('กรุณาเลือกรูปภาพที่จะอัปโหลด');
    return;
  }

  if (!validateUploadData()) {
    alert('กรุณาเลือกประเภทรูปภาพให้ครบทุกรูป');
    return;
  }

  setIsUploading(true);

  try {
    const formData = new FormData();
    
    // เพิ่ม JobId และข้อมูลเพิ่มเติม
    formData.append('jobId', JobId || '');
    
    uploadImages.forEach((img, index) => {
      if (img.file) {
        const renamedFile = new File([img.file], img.name, { type: img.file.type });
        formData.append('file', renamedFile);
        // เพิ่มข้อมูล metadata สำหรับแต่ละไฟล์
        formData.append(`category_${index}`, img.category || '');
        formData.append(`fileName_${index}`, img.name);
      }
    });


    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'X-Job-Id': JobId || '', // เพิ่ม header สำหรับ JobId
      },
      body: formData
    });

    if (res.ok) {
      // อ่าน response เพียงครั้งเดียว
      let result;
      try {
        result = await res.json();
      } catch {
        result = { message: 'Upload successful' };
      }
      
      console.log('Upload success:', result);
      
      // รีเฟรชหน้าเพื่ือโหลดรูปใหม่
      location.reload();
      
    } else {
      // อ่าน error response เพียงครั้งเดียว
      await handleUploadError(res);
    }

  } catch (err: any) {
    console.error('Upload error:', err);
    
    if (err.name === 'AbortError') {
      alert('❌ การอัปโหลดใช้เวลานานเกินไป กรุณาลองใหม่');
    } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
      alert('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    } else {
      alert(`❌ เกิดข้อผิดพลาดขณะอัปโหลด: ${err.message || 'Unknown error'}`);
    }
  } finally {
    setIsUploading(false);
  }
};

// แยกฟังก์ชันจัดการ error ออกมา
const handleUploadError = async (res: Response) => {
  let errorMessage = 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
  
  try {
    // ลองอ่านเป็น JSON ก่อน
    const contentType = res.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } else {
      // ถ้าไม่ใช่ JSON ให้อ่านเป็น text
      const textError = await res.text();
      errorMessage = textError || errorMessage;
    }
  } catch (parseError) {
    console.warn('Could not parse error response:', parseError);
    errorMessage = `HTTP ${res.status}: ${res.statusText}`;
  }

  console.error('Upload failed:', {
    status: res.status,
    statusText: res.statusText,
    errorMessage
  });

  // แสดง error message ตาม status code
  switch (res.status) {
    case 400:
      alert(`❌ ข้อมูลไม่ถูกต้อง: ${errorMessage}`);
      break;
    case 401:
      alert('❌ ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่');
      break;
    case 413:
      alert('❌ ขนาดไฟล์ใหญ่เกินไป! (เกิน 5MB)');
      break;
    case 415:
      alert('❌ ประเภทไฟล์ไม่รองรับ! กรุณาใช้ไฟล์รูปภาพเท่านั้น');
      break;
    case 422:
      alert(`❌ ข้อมูลไม่ครบถ้วน: ${errorMessage}`);
      break;
    case 500:
      alert(`❌ เกิดข้อผิดพลาดในเซิร์ฟเวอร์: ${errorMessage}`);
      break;
    case 502:
    case 503:
    case 504:
      alert('❌ เซิร์ฟเวอร์ไม่พร้อมให้บริการ กรุณาลองใหม่ภายหลัง');
      break;
    default:
      alert(`❌ พบปัญหาการส่งข้อมูล (${res.status}): ${errorMessage}`);
  }
};

const validateUploadData = () => {
    const incompleteImages = uploadImages.filter(img => !img.category || img.category === '');
    return incompleteImages.length === 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };


  //  หลังจาก Drop รูปไปตั้งค่าสถานะ
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) return;
      const newImage: ImageFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        key: '',
        isUploaded: false
      };
      
      setUploadImages(prev => [...prev, newImage]);

     

    });
  };


  // จัดการการลบรูป
  const handleDeleteImage = (imageId: string, imageType: 'upload' | 'database') => {
    setDeleteAlert({
      show: true,
      imageId,
      imageType
    });
  };

// ยืนยันการลบ
 const confirmDelete = async () => {
  const { imageId, imageType } = deleteAlert;

  if (imageType === "upload") {
    setUploadImages((prev) => prev.filter((img) => img.id !== imageId));
  } else {
    const image = databaseImages.find((img) => img.id == imageId);
    if (!image) {
      alert("ไม่พบรูปภาพในระบบ");
      return;
    }

    try {
      const res = await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: image.key }),
      });

      if (!res.ok) throw new Error("ลบไฟล์ไม่สำเร็จ");
location.reload();
      // router.push(`/picture?id=${JobId}`)
    } catch (err) {
      console.error("❌ ลบไฟล์ล้มเหลว:", err);
      alert("เกิดข้อผิดพลาดในการลบไฟล์");
    }
  }

  setDeleteAlert({ show: false, imageId: "", imageType: "upload" });
};


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      
      const newImage: ImageFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        key: '',
        isUploaded: false
      };
      
      setUploadImages(prev => [...prev, newImage]);


      if( status == "ถึงต้นทาง" || status == "เริ่มขึ้นสินค้า" || status == "ขึ้นสินค้าเสร็จ"  ){
        updateImageCategory(newImage.id, "origin");
      } else if (status == "ถึงปลายทาง" || status == "เริ่มลงสินค้า" || status == "ลงสินค้าเสร็จ") {
        updateImageCategory(newImage.id, "destination");
      }

    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }



  };

  const getFileExtension = (filename: string) => {
  return filename.substring(filename.lastIndexOf('.'));
};


const updateImageCategory = (imageId: string, category: string) => {
  setUploadImages(prev => {
    const currentImage = prev.find(img => img.id === imageId);
    const extension = getFileExtension(currentImage?.name || "");
    const baseName = `${JobId}_${category}`;
    const uploadNames = prev
      .filter(img => img.id !== imageId)
      .map(img => removeFileExtension(img.name));

    const databaseNames = databaseImages.map(img => removeFileExtension(img.name));

    const allExistingNames = [...uploadNames, ...databaseNames];

    let counter = 1;
    let finalName = `${baseName}_${counter}${extension}`;

    while (allExistingNames.includes(`${baseName}_${counter}`)) {
      counter++;
      finalName = `${baseName}_${counter}${extension}`;
    }

    return prev.map(img =>
      img.id === imageId
        ? {
            ...img,
            category,
            name: finalName,
          }
        : img
    );
  });
};

// helper: ตัดนามสกุลไฟล์ออก
function removeFileExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}



    // ฟังก์ชันสำหรับแสดงป้ายประเภท
  const getCategoryLabel = (category: string) => {
    const categoryItem = IMAGE_CATEGORIES.find(cat => cat.value === category);
    return categoryItem ? categoryItem.label : 'ไม่ระบุ';
  };

  // ฟังก์ชันสำหรับสีป้ายประเภท
  const getCategoryColor = (category: string) => {
    const colors = {
      origin: "bg-green-100 text-green-800",
      destination: "bg-blue-100 text-blue-800",
      damage: "bg-red-100 text-red-800",
      pallet: "bg-yellow-100 text-yellow-800",
      bill: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex justify-center p-5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200 bg-opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200 bg-opacity-20 rounded-full "></div>
        <div className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300 bg-opacity-25 rounded-full "></div>
        <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300 bg-opacity-30 rounded-full "></div>
      </div>

      <div className="flex flex-col z-10 w-full space-y-4">
        <div className="flex items-center justify-between mb-5">
          <Button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-gray-700 shadow hover:bg-gray-100 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-500" />
            <span className="font-medium">ติดตามสถานะ</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-7xl mx-auto md:w-full">



          {/* Container 1 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6 ">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Upload className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                อัปโหลดรูปภาพใหม่
              </h2>
              
            </div>
            <p className="text-xs text-gray-500">⚠️ สามารถอัปโหลดภาพได้หลายภาพในครั้งเดียว</p>

            {/* Zone การอัปโหลด */}
            <div
              className="border-2 border-dashed border-emerald-300 rounded-xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                อัปโหลดหรือถ่ายรูปที่นี่
              </p>
              <p className="text-xs text-gray-500">
                รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Preview รูปที่จะอัปโหลด */}
            {uploadImages.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">
                    รูปภาพที่เลือก ({uploadImages.length})
                  </h3>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || !validateUploadData()}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      !validateUploadData() 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } ${isUploading ? 'opacity-50' : ''}`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังอัปโหลด...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        อัปโหลดทั้งหมด
                      </>
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-auto overflow-y-auto">
                  {uploadImages.map((image) => (
                    <div key={image.id} className="relative group bg-gray-50 rounded-xl overflow-hidden">
                      <div className="aspect-square relative">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-100 transition-all duration-200 flex gap-2">
                            <button
                              onClick={() => setViewingImage(image.url)}
                              className="p-2 rounded-full bg-gray-100 transition-colors"
                            >
                              <Eye className="h-4 w-4 text-gray-700 cursor-pointer" />
                            </button>
                            <button
                              onClick={() => handleDeleteImage(image.id, 'upload')}
                              className="p-2  rounded-full bg-red-400 transition-colors"
                            >
                              <X className="h-4 w-4 text-white cursor-pointer" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* ข้อมูลไฟล์ */}
                      <div className="p-3 space-y-2">
                        <p className="text-sm text-wrap font-medium text-gray-800 truncate">{image.name}</p>
                        {image.size && (
                          <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                        )}
                        
                        {/* Dropdown สำหรับเลือกประเภท */}
                        <select
                          value={image.category || ''}
                          onChange={(e) => updateImageCategory(image.id, e.target.value)}
                          className={`w-full text-xs border rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            !image.category || image.category === '' 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {IMAGE_CATEGORIES.map((category) => (
                            <option 
                              key={category.value} 
                              value={category.value}
                              disabled={category.value === ''}
                            >
                              {category.label}
                            </option>
                          ))}
                        </select>
                        
                        {/* แสดงสถานะการเลือกประเภท */}
                        {(!image.category || image.category === '') && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs">กรุณาเลือกประเภท</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

  <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ImageIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">รูปภาพที่บันทึก</h2>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                {/* {databaseImages.length} รูป */}
              </span>
            </div>
 {databaseImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-auto overflow-y-auto">
                {databaseImages.map((image) => (
                  <div key={image.id} className="relative group bg-gray-50 rounded-xl overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-100 transition-all duration-200 flex gap-2">
                          <button
                            onClick={() => setViewingImage(image.url)}
                            className="p-2 rounded-full bg-gray-100 transition-colors"
                          >
                            <Eye className="h-4 w-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDeleteImage(image.id, 'database')}
                            className="p-2 bg-red-400 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* ข้อมูลรูป */}
                    <div className="p-3">
                      <p className="text-sm text-wrap font-medium text-gray-800 truncate">{image.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">อัปโหลดแล้ว</span>
                      </div>
                      {/* แสดงป้ายประเภท */}
                      {image.category && (
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(image.category)}`}>
                            {getCategoryLabel(image.category)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">ยังไม่มีรูปภาพที่บันทึก</p>
                <p className="text-gray-400 text-sm">อัปโหลดรูปภาพเพื่อเริ่มต้น</p>
              </div>
            )}
    </div>

      {viewingImage && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-12 right-0 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
            <img
              src={viewingImage}
              alt="Full view"
              className="rounded-lg max-w-full max-h-full object-contain"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            />
          </div>
        </div>
      )}

      {/* Alert การลบ */}
      {deleteAlert.show && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">ยืนยันการลบ</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              คุณแน่ใจหรือไม่ที่จะลบรูปภาพนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteAlert({ show: false, imageId: '', imageType: 'upload' })}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                ลบรูปภาพ
              </button>
            </div>
          </div>
        </div>
      )}


        </div>
      </div>
    </div>
  );
};
