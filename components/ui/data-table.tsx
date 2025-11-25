"use client";

import * as React from "react";
import { TransportItem } from "@/lib/type";
import { format, parseISO } from "date-fns";

interface DataTableProps {
  data: TransportItem[];
  title: string;
}

export function DataTable({ data, title }: DataTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'd/M/yyyy, HH:mm');
    } catch {
      return dateString;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'จัดส่งแล้ว (POD)':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getKpiStyle = (kpi: string) => {
    switch (kpi) {
      case 'on time':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'delay':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {data.length} แถว
          </span>
        </div>
      </div>
      
      {/* Mobile View - Cards */}
      <div className="block lg:hidden space-y-3">
        {data.map((item) => (
          <div key={item.load_id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{item.load_id}</h4>
                <p className="text-sm text-gray-600">{item.driver_name}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                {item.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block">วันที่ลงแผน</span>
                <span className="font-medium">{item.date_plan}</span>
              </div>
              <div>
                <span className="text-gray-500 block">แผนวันที่รับ</span>
                <span className="font-medium">{formatDateTime(item.date_recive)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">แผนวันที่ส่ง</span>
                <span className="font-medium">{formatDateTime(item.date_deliver)}</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-sm text-gray-600 mb-2">ต้นทาง: {item.locat_recive}</div>
              <div className="text-sm text-gray-600 mb-3">ปลายทาง: {item.locat_deliver}</div>
              
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">ต้นทาง KPI:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getKpiStyle(item.dw_jobdata_info?.client_kpi_origin || '')}`}>
                    {item.dw_jobdata_info?.client_kpi_origin || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500"> ต้นทาง เหตุผล:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200`}>
                    {item.reason_kpi_origin || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">ปลายทาง KPI:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getKpiStyle(item.dw_jobdata_info?.client_kpi_destination || '')}`}>
                    {item.dw_jobdata_info?.client_kpi_destination || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500"> ปลายทาง เหตุผล:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200`}>
                    {item.reason_kpi_destination || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden lg:block">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Shipment ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่ลงแผน
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      พจส.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ต้นทาง
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ปลายทาง
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      แผนวันที่รับ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      แผนวันที่ส่ง
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่ถึงต้นทาง
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่ถึงปลายทาง
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ต้นทาง KPI
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ต้นทาง เหตุผล
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ปลายทาง KPI
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ปลายทาง เหตุผล
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr 
                      key={item.load_id} 
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.load_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.date_plan)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.driver_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px]">
                        <div className="truncate" title={item.locat_recive}>
                          {item.locat_recive}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px]">
                        <div className="truncate" title={item.locat_deliver}>
                          {item.locat_deliver}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(item.date_recive)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(item.date_deliver)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.ticket_info?.origin_datetime || '')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.ticket_info?.desination_datetime || '')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getKpiStyle(item.dw_jobdata_info?.client_kpi_origin || '')}`}>
                          {item.dw_jobdata_info?.client_kpi_origin || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200`}>
                          {item.reason_kpi_origin}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getKpiStyle(item.dw_jobdata_info?.client_kpi_destination || '')}`}>
                          {item.dw_jobdata_info?.client_kpi_destination || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200`}>
                          {item.reason_kpi_destination}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Empty State */}
      {data.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
            <p className="text-gray-500">There are no records to display for the selected criteria.</p>
          </div>
        </div>
      )}
    </div>
  );
}