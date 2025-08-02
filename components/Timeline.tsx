"use client";
import React, { useRef, useState } from 'react'
import { CheckCircle, Circle, Clock, ImagePlus, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface TimelineStepProps {
  key: string
  title: string
  timestamp?: string
  isCompleted: boolean
  isActive: boolean
  icon: string
}

const TimelineStep: React.FC<TimelineStepProps> = ({
  key,
  title,
  timestamp,
  isCompleted,
  isActive,
  icon
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<File[]>([])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setImages([...images, ...Array.from(files)])
    }
  }

  const removeImage = (index: number) => {
    const updated = [...images]
    updated.splice(index, 1)
    setImages(updated)
  }

  const formatDatetime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value)
    const bangkokOffset = 7 * 60
    const localTime = new Date(date.getTime() + bangkokOffset * 60000)
    const dd = String(localTime.getDate()).padStart(2, '0')
    const mm = String(localTime.getMonth() + 1).padStart(2, '0')
    const yyyy = localTime.getFullYear()
    const HH = String(localTime.getHours()).padStart(2, '0')
    const min = String(localTime.getMinutes()).padStart(2, '0')
    return `${dd}/${mm}/${yyyy}, ${HH}:${min}`
  }

  const shouldShowImageUpload =
    (title === 'ขึ้นสินค้าเสร็จ' || title === 'ลงสินค้าเสร็จ') &&
    (isActive || isCompleted)

  return (
    <div className="relative flex items-start space-x-4 pb-6">
      {/* Connector Line */}
      {title !== 'เสร็จงาน' && !isActive && (
        <div
          className={`absolute left-5 top-10 w-0.5 h-full transition-colors duration-300 ${
            isCompleted
              ? 'bg-gradient-to-b from-green-500 to-green-300'
              : 'bg-gray-200'
          }`}
        />
      )}

      {/* Icon */}
      <div className="relative z-10">
        <div
          className={`
          flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm
          transition-all duration-300 shadow-lg
          ${isCompleted
            ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-500 text-white scale-110'
            : isActive
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 text-white animate-pulse'
            : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'}
        `}
        >
          {isCompleted ? (
            <CheckCircle className="w-5 h-5" />
          ) : isActive ? (
            <Clock className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className={`
          bg-white rounded-xl p-4 shadow-sm border transition-all duration-300
          ${isCompleted
            ? 'border-green-200 bg-gradient-to-r from-green-50 to-green-25'
            : isActive
            ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-25 shadow-md'
            : 'border-gray-100 hover:shadow-sm'}
        `}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl" role="img" aria-label={title}>
              {icon}
            </span>
            <h3
              className={`font-semibold text-lg transition-colors duration-300 ${
                isCompleted
                  ? 'text-green-700'
                  : isActive
                  ? 'text-blue-700'
                  : 'text-gray-600'
              }`}
            >
              {title}
            </h3>
          </div>

          {timestamp ? (
            <div
              className={`
              inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
              ${
                isCompleted
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700'
              }
            `}
            >
              <Clock className="w-4 h-4" />
              <span>{timestamp}</span>
            </div>
          ) : (
            isActive && (
              <div className="w-full mt-2 flex justify-start">
                <input
                  aria-label="Date and time"
                  type="datetime-local"
                  onChange={(e) => formatDatetime(e)}
                  id={key}
                  name={key}
                  className="text-center w-100 p-3 border border-blue-200 rounded-md text-xs 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  bg-white shadow-sm transition-all duration-200"
                  placeholder="เลือกวันที่และเวลา"
                />
              </div>
            )
          )}

          {/* Image upload เฉพาะกรณีสถานะที่กำหนด */}
          {shouldShowImageUpload && (
            <Card className="mt-4 bg-gray-50 shadow-md border-0 ring-1 ring-gray-200/50 hover:ring-gray-300/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <ImagePlus className="h-5 w-5" />
                  <span>แนบเอกสารรูปภาพ</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
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
                          className="absolute top-1 right-1 bg-white bg-opacity-70 text-red-500 rounded-full p-1 shadow"
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
          )}
        </div>
      </div>
    </div>
  )
}

export default TimelineStep
