"use client";

import React, { useState, useMemo } from 'react';
import { X, Save, AlertTriangle, ChevronDown } from 'lucide-react';
import { TransportItem } from '@/lib/type';
import { format, parseISO } from "date-fns";
import { AdminView } from './AdminView';
import { DELAY_REASONS_BY_CATEGORY } from '@/lib/list';
interface DelayReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  transportData: TransportItem[];
  onSave: (updatedData: TransportItem[]) => void;
}


export const DelayReasonModal: React.FC<DelayReasonModalProps> = ({
  isOpen,
  onClose,
  transportData,
  onSave
}) => {
  const [filterMode, setFilterMode] = useState<'pending' | 'completed'>('pending');

  const filteredData = useMemo(() => {
    return transportData.filter(item => {
      const originDelay = item.dw_jobdata_info?.client_kpi_origin === "delay";
      const destinationDelay = item.dw_jobdata_info?.client_kpi_destination === "delay";
      const originReasonMissing = !item.reason_kpi_origin || item.reason_kpi_origin.trim() === "";
      const destinationReasonMissing = !item.reason_kpi_destination || item.reason_kpi_destination.trim() === "";
      
      const isPending = ((originDelay && originReasonMissing) || (destinationDelay && destinationReasonMissing)) && item.status == "จัดส่งแล้ว (POD)";
      const isCompleted = ((originDelay && !originReasonMissing) || (destinationDelay && !destinationReasonMissing)) && item.status == "จัดส่งแล้ว (POD)";
      
      if (filterMode === 'pending') {
        return isPending;
      } else {
        return isCompleted;
      }
    });
  }, [transportData, filterMode]);

  const [editedData, setEditedData] = useState<TransportItem[]>(filteredData);
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
  const [selectedItem, setSelectedItem] = useState<TransportItem | null>(null);
  const [showAdminView, setShowAdminView] = useState(false);

  React.useEffect(() => {
    setEditedData(filteredData);
  }, [filteredData]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      const isOutsideDropdown = !target.closest('.dropdown-container');
      
      if (isOutsideDropdown) {
        setShowSuggestions({});
      }
    };

    const hasOpenDropdown = Object.values(showSuggestions).some(Boolean);
    if (hasOpenDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleReasonChange = (loadId: string, field: 'origin' | 'destination', value: string) => {
    setEditedData(prev => prev.map(item => {
      if (item.load_id === loadId) {
        if (field === 'origin') {
          return { ...item, reason_kpi_origin: value };
        } else {
          return { ...item, reason_kpi_destination: value };
        }
      }
      return item;
    }));
  };

  const toggleSuggestions = (key: string) => {
    setShowSuggestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const closeSuggestions = (key: string) => {
    setShowSuggestions(prev => ({
      ...prev,
      [key]: false
    }));
  };

  const selectReason = (loadId: string, field: 'origin' | 'destination', reason: string) => {
    handleReasonChange(loadId, field, reason);
    closeSuggestions(`${loadId}-${field}`);
  };
  
   const formatDateTime = (dateString: string) => {
      if (!dateString) return '';
      try {
        return format(parseISO(dateString), 'd/M/yyyy, HH:mm');
      } catch {
        return dateString;
      }
    };

  const handleSave = () => {
    const modifiedItems = editedData.filter((editedItem, index) => {
    const originalItem = filteredData[index];
    const originChanged = editedItem.reason_kpi_origin !== (originalItem.reason_kpi_origin || null);
    const destinationChanged = editedItem.reason_kpi_destination !== (originalItem.reason_kpi_destination || null);
      
      return originChanged || destinationChanged;
    });

    onSave(modifiedItems);
    onClose();
  };

  const openAdminView = (item: TransportItem) => {
    setSelectedItem(item);
    setShowAdminView(true);
  };

  const closeAdminView = () => {
    setShowAdminView(false);
    setSelectedItem(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-1 sm:p-2">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[95vw] w-8xl max-h-[105vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 text-white p-3 flex items-center justify-between border-b-4 border-purple-400">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} />
            <div>
              <h2 className="text-xl font-bold">จัดการเหตุผลการล่าช้า</h2>
              <p className="text-purple-100 text-sm">
                {filterMode === 'pending' 
                  ? `พบข้อมูลที่ต้องระบุเหตุผล ${filteredData.length} รายการ`
                  : `ข้อมูลที่ระบุเหตุผลแล้ว ${filteredData.length} รายการ`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-20">
          <div className="flex gap-1 bg-purple-700 rounded-full p-1 border-2 border-white">
            <button 
              onClick={() => setFilterMode('pending')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterMode === 'pending' 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-white cursor-pointer transition-colors'
              }`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilterMode('completed')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterMode === 'completed' 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-white  cursor-pointer transition-colors'
              }`}
            >
              Completed
            </button>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-white hover:text-purple-200 transition-colors"
          >
            <X size={24} />
          </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-auto max-h-[75vh]">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">ไม่พบข้อมูลที่ต้องระบุเหตุผล</h3>
              <p className="text-gray-500">ข้อมูลทั้งหมดได้ระบุเหตุผลการล่าช้าแล้ว</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    รหัสขนส่ง
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    พนักงานขับรถ
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    ต้นทาง → ปลายทาง
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    วันที่ขึ้น → ลงสินค้า (แผน)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    ต้นทาง KPI
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    เหตุผลต้นทาง
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    ต้นทาง KPI
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    เหตุผลปลายทาง
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {editedData.map((item, index) => {
                  const originDelay = item.dw_jobdata_info?.client_kpi_origin === "delay";
                  const destinationDelay = item.dw_jobdata_info?.client_kpi_destination === "delay";
                  
                  return (
                    <tr key={item.load_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-xs font-semibold cursor-pointer text-blue-700"
                       title='เปิดดูข้อมูลเพิ่มเติม'
                       onClick={() => openAdminView(item)}
                      >
                        {item.load_id}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {item.driver_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div className="max-w-[100px]">
                          <div className="truncate" title={item.locat_recive}>
                            {item.locat_recive}
                          </div>
                          <div className="truncate text-xs text-gray-500" title={item.locat_deliver}>
                            {item.locat_deliver}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div className="max-w-[100px]">
                          <div className="truncate" title={item.date_recive}>
                            {formatDateTime(item.date_recive)}
                          </div>
                          <div className="truncate text-xs text-gray-500" title={item.date_deliver}>
                            {formatDateTime(item.date_deliver)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          originDelay 
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {item.dw_jobdata_info?.client_kpi_origin || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {originDelay ? (
                          <div className="relative min-w-[250px] dropdown-container">
                            {/* Input Field */}
                            <div className="flex">
                              <input
                                type="text"
                                value={item.reason_kpi_origin || ""}
                                onChange={(e) => handleReasonChange(item.load_id, 'origin', e.target.value)}
                                onFocus={() => toggleSuggestions(`${item.load_id}-origin`)}
                                placeholder="เลือกเหตุผล..."
                                className="w-full p-2 border border-gray-300 rounded-l-lg text-xs text-blue-600 focus:ring-2 placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => toggleSuggestions(`${item.load_id}-origin`)}
                                className="px-3 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                              >
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${
                                  showSuggestions[`${item.load_id}-origin`] ? 'rotate-180' : ''
                                }`} />
                              </button>
                            </div>
                            
                            {/* Suggestions Dropdown */}
                            {showSuggestions[`${item.load_id}-origin`] && (
                              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                                <div className="max-h-60 overflow-y-auto">
                                  {Object.entries(DELAY_REASONS_BY_CATEGORY).map(([category, reasons]) => (
                                    <div key={category} className="border-b border-gray-100 last:border-b-0">
                                      <div className="px-3 py-1.5 bg-gray-200 text-xs font-bold text-gray-700 border border-gray-300 sticky top-0">
                                        {category}
                                      </div>

                                      <div>
                                        {reasons.map((reason, idx) => (
                                          <div
                                            key={`${category}-${idx}`}
                                            onClick={() => selectReason(item.load_id, 'origin', reason)}
                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs transition-colors border-b border-gray-50 last:border-b-0"
                                          >
                                            <span className="text-gray-700 hover:text-blue-700 leading-tight">
                                              {reason}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 ">ไม่ต้องระบุ</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          destinationDelay 
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {item.dw_jobdata_info?.client_kpi_destination || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {destinationDelay ? (
                          <div className="relative min-w-[250px] dropdown-container">
                            {/* Input Field */}
                            <div className="flex">
                              <input
                                type="text"
                                value={item.reason_kpi_destination || ""}
                                onChange={(e) => handleReasonChange(item.load_id, 'destination', e.target.value)}
                                onFocus={() => toggleSuggestions(`${item.load_id}-destination`)}
                                placeholder="เลือกเหตุผล..."
                                className="w-full p-2 border border-gray-300 rounded-l-lg text-xs text-blue-600 focus:ring-2 placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => toggleSuggestions(`${item.load_id}-destination`)}
                                className="px-3 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                              >
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${
                                  showSuggestions[`${item.load_id}-destination`] ? 'rotate-180' : ''
                                }`} />
                              </button>
                            </div>
                            
                            {/* Suggestions Dropdown */}
                            {showSuggestions[`${item.load_id}-destination`] && (
                              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                                {/* Categorized Options */}
                                <div className="max-h-60 overflow-y-auto">
                                  {Object.entries(DELAY_REASONS_BY_CATEGORY).map(([category, reasons]) => (
                                    <div key={category} className="border-b border-gray-100 last:border-b-0">
                                      {/* Category Header */}
                                      <div className="px-3 py-1.5 bg-gray-100 text-xs font-medium text-gray-600 sticky top-0">
                                        {category} ({reasons.length})
                                      </div>
                                      
                                      {/* Category Items */}
                                      <div>
                                        {reasons.map((reason, idx) => (
                                          <div
                                            key={`${category}-${idx}`}
                                            onClick={() => selectReason(item.load_id, 'destination', reason)}
                                            className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-xs transition-colors border-b border-gray-50 last:border-b-0"
                                          >
                                            <span className="text-gray-700 hover:text-purple-700 leading-tight">
                                              {reason}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 ">ไม่ต้องระบุ</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={filteredData.length === 0}
              className="bg-purple-600 cursor-pointer hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save size={16} />
              บันทึก
            </button>
          </div>
        </div>
      </div>

      {/* AdminView Modal */}
      {showAdminView && selectedItem && (
        <AdminView
          jobView={selectedItem}
          closeModal={closeAdminView}
        />
      )}
    </div>
  );
};