import React, { useRef, useState, useEffect } from 'react'
import { ImagePlus, X, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ImagesFnProps = {
  onImagesChange: (files: File[]) => void;
  jobId: string;
  imagesOf: string;
  existingImages: { key: string; url: string }[];
};

export const ImagesFn: React.FC<ImagesFnProps> = ({ onImagesChange, jobId, imagesOf, existingImages: initialExistingImages }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<{ key: string; url: string }[]>([]);

  // ใช้เพื่อตั้งค่าจาก props เฉพาะตอน mount
  useEffect(() => {
    setExistingImages(initialExistingImages);
  }, [initialExistingImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const renamedFiles = fileArray.map((file, index) => {
      const ext = file.name.split(".").pop();
      const newFileName = `${jobId}_${imagesOf}${images.length + (index + 1)}.${ext}`;
      return new File([file], newFileName, { type: file.type });
    });

    const newImages = [...images, ...renamedFiles];
    setImages(newImages);
    onImagesChange(newImages);
  };

  const handleRemoveExistingImage = (imageToRemove: { key: string; url: string }) => {
    const confirmDelete = confirm("คุณต้องการลบรูปภาพนี้ใช่หรือไม่?");
    if (!confirmDelete) return;

    fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: imageToRemove.key }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("ลบไฟล์ไม่สำเร็จ");
        setExistingImages((prev) => prev.filter((img) => img.key !== imageToRemove.key));
      })
      .catch((err) => {
        console.error("❌ ลบไฟล์ล้มเหลว:", err);
      });
  };

  const handleViewFullImage = (imageUrl: string) => {
    setViewingImage(imageUrl);
  };

  const closeFullView = () => {
    setViewingImage(null);
  };

  const removeImage = (indexToRemove: number) => {
    const updated = images.filter((_, index) => index !== indexToRemove);
    setImages(updated);
    onImagesChange(updated);
    if (updated.length === 0 && inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <Card className="mb-5 bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ImagePlus className="h-5 w-5" />
            <span>เอกสารรูปภาพ</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:bg-blue-50"
          />

          {(existingImages.length > 0 || images.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {existingImages.map((img, i) => (
                <div key={`exist-${i}`} className="relative group overflow-hidden rounded-lg">
                  <img 
                    src={img.url} 
                    className="w-full h-32 object-cover rounded-lg shadow-md transition-all duration-300 group-hover:scale-105 group-hover:brightness-75" 
                    alt={`Existing image ${i + 1}`}
                  />
                  
                  {/* Eye Icon for Full View */}
                  <button
                    onClick={() => handleViewFullImage(img.url)}
                    className="absolute inset-0 flex items-center justify-center  opacity-100 transition-all duration-300 "
                  >
                   <Eye className="w-4 h-4 text-gray-600 drop-shadow-lg" />
                  </button>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveExistingImage(img)}
                    className="absolute top-0 right-0 bg-red-50 bg-opacity-90 backdrop-blur-sm text-red-500 rounded-full p-1.5 shadow-lg opacity-100  transition-all duration-200 scale-110"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {images.map((file, index) => (
  <div key={`new-${index}`} className="relative group">
    <img
      src={URL.createObjectURL(file)}
      alt={`new-${index}`}
      className="w-full rounded-lg shadow"
    />
    {/* Eye Icon for Full View */}
                  <button
                    onClick={() => handleViewFullImage(URL.createObjectURL(file))}
                    className="absolute inset-0 flex items-center justify-center  opacity-100 transition-all duration-300 "
                  >
                    <Eye className="w-4 h-4 text-gray-600 drop-shadow-lg" />
                  
                  </button>

    {/* Remove Button */}
    <button
      onClick={() => removeImage(index)}
      className="absolute top-1 right-1 bg-white bg-opacity-70 text-red-500 rounded-full p-1 shadow"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
))}
            </div>
          )}
        </CardContent>
      </Card>

      {viewingImage && (
        <div 
          className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-100 p-4"
          onClick={closeFullView}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={viewingImage} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              alt="Full view"
            />
            <button
              onClick={closeFullView}
              className="absolute top-0 right-0 bg-red-50 bg-opacity-90 text-red-500 rounded-full p-2 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      </div>
  )
}

