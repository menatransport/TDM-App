'client'
import React, { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ImagesFn = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Convert FileList to Array and append to existing state
      setImages((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, index) => index !== indexToRemove);
      // Clear input file if no images left
      if (updated.length === 0 && inputRef.current) {
        inputRef.current.value = "";
      }
      return updated;
    });
  };

  return (
      <Card className="mb-20 bg-gray-50 shadow-md hover:shadow-lg transition-all duration-300 border-0 ring-1 ring-gray-200/50 hover:ring-gray-300/50">
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
                placeholder="เลือกรูปภาพ"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

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
                </CardContent>
          </Card> 
  )
}

