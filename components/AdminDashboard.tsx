"use client";

import { useState, useEffect, useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { 
  TrendingUp, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  AlertTriangle,
  X
} from 'lucide-react';
import { TransportItem } from "@/lib/type";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

interface AdminDashboardProps {
  transportData: TransportItem[];
}

interface ChartData {
  name: string;
  ontime: number;
  delay: number;
  ontimePercentage: number;
}

interface ModalData {
  isOpen: boolean;
  title: string;
  data: TransportItem[];
}

// Colors configuration
const COLORS = {
  GREEN: {
    main: "#095822",
    secondary: "#749b75"
  },
  RED: {
    main: "#870303",
    secondary: "#c67c7c"
  }
};

// Pie chart colors
const PIE_COLORS = [
 "#870303", "#b8221dff", "#A52A2A", "#f74020ff", "#E36E6E", "#FF7C7C",
  "#FFC658", "#82CA9D", "#8DD1E1", "#D084D0", "#FBEBD8"
];

export const AdminDashboard = ({ transportData }: AdminDashboardProps) => {
  const [modalData, setModalData] = useState<ModalData>({
    isOpen: false,
    title: '',
    data: []
  });

  // Adjust viewport for mobile devices
  useEffect(() => {
    const isMobile = window.innerWidth <= 640; // sm breakpoint
    if (isMobile) {
      // Store original viewport
      const originalViewport = document.querySelector('meta[name="viewport"]');
      const originalContent = originalViewport?.getAttribute('content');
      
      // Set new viewport for dashboard
      if (originalViewport) {
        originalViewport.setAttribute('content', 'width=1024, initial-scale=0.5, maximum-scale=2, user-scalable=yes');
      }
      
      // Restore original viewport on cleanup
      return () => {
        if (originalViewport && originalContent) {
          originalViewport.setAttribute('content', originalContent);
        }
      };
    }
  }, []);
  
  const filteredTransportData = useMemo(() => {
    return transportData.filter(item => item.status === 'จัดส่งแล้ว (POD)');
  }, [transportData]);
  
  const calculateOnTimePerformance = (item: TransportItem, type: 'origin' | 'destination') => {
    const kpiField = type === 'origin' ? 'client_kpi_origin' : 'client_kpi_destination';
    const kpiValue = item.dw_jobdata_info?.[kpiField];
    
    if (!kpiValue || kpiValue === 'no_data') {
      return null;
    }
    
    return kpiValue;
  };

  const originByDate = useMemo(() => {
    const grouped: { [key: string]: { ontime: number; delay: number; total: number } } = {};
    
    filteredTransportData.forEach(item => {
      const receiveDate = item.date_recive;

      if (!receiveDate) return;
      
      try {
        const dateKey = format(parseISO(receiveDate), 'yyyy-MM-dd');
        const performance = calculateOnTimePerformance(item, 'origin');
        
        // Skip items with no_data KPI
        if (performance === null) return;
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = { ontime: 0, delay: 0, total: 0 };
        }
        
        if (performance === 'on time') {
          grouped[dateKey].ontime++;
        } else if (performance === 'delay') {
          grouped[dateKey].delay++;
        }
        grouped[dateKey].total = grouped[dateKey].ontime + grouped[dateKey].delay;
      } catch (error) {
        console.error('Error processing date:', receiveDate, error);
      }
    });
    
    return Object.entries(grouped)
      .map(([date, data]) => ({
        name: format(parseISO(date), 'MMM dd'),
        ontime: data.ontime,
        delay: data.delay,
        ontimePercentage: data.total > 0 ? (data.ontime / data.total) * 100 : 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTransportData]);

  const destinationByDate = useMemo(() => {
    const grouped: { [key: string]: { ontime: number; delay: number; total: number } } = {};
    
    filteredTransportData.forEach(item => {
      const deliverDate = item.date_deliver;
      if (!deliverDate) return;
      
      try {
        const dateKey = format(parseISO(deliverDate), 'yyyy-MM-dd');
        const performance = calculateOnTimePerformance(item, 'destination');
        
        // Skip items with no_data KPI
        if (performance === null) return;
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = { ontime: 0, delay: 0, total: 0 };
        }
        
        if (performance === 'on time') {
          grouped[dateKey].ontime++;
        } else if (performance === 'delay') {
          grouped[dateKey].delay++;
        }
        grouped[dateKey].total = grouped[dateKey].ontime + grouped[dateKey].delay;
      } catch (error) {
        console.error('Error processing date:', deliverDate, error);
      }
    });
    
    return Object.entries(grouped)
      .map(([date, data]) => ({
        name: format(parseISO(date), 'MMM dd'),
        ontime: data.ontime,
        delay: data.delay,
        ontimePercentage: data.total > 0 ? (data.ontime / data.total) * 100 : 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTransportData]);

  // Process data for Origin Drivers Falling Below Target
  const originDriversBelowTarget = useMemo(() => {
    const grouped: { [key: string]: { ontime: number; delay: number; total: number } } = {};
    
    filteredTransportData.forEach(item => {
      const driverName = item.driver_name;
      if (!driverName) return;
      
      const performance = calculateOnTimePerformance(item, 'origin');
      
      // Skip items with no_data KPI
      if (performance === null) return;
      
      if (!grouped[driverName]) {
        grouped[driverName] = { ontime: 0, delay: 0, total: 0 };
      }
      
      if (performance === 'on time') {
        grouped[driverName].ontime++;
      } else if (performance === 'delay') {
        grouped[driverName].delay++;
      }
      grouped[driverName].total = grouped[driverName].ontime + grouped[driverName].delay;
    });
    
    return Object.entries(grouped)
      .map(([driver, data]) => ({
        name: driver,
        ontime: data.ontime,
        delay: data.delay,
        ontimePercentage: data.total > 0 ? (data.ontime / data.total) * 100 : 0
      }))
      .filter(item => item.ontimePercentage < 95) // Only show drivers below 95%
      .sort((a, b) => a.ontimePercentage - b.ontimePercentage);
  }, [filteredTransportData]);

  // Process data for Destination Drivers Falling Below Target
  const destinationDriversBelowTarget = useMemo(() => {
    const grouped: { [key: string]: { ontime: number; delay: number; total: number } } = {};
    
    filteredTransportData.forEach(item => {
      const driverName = item.driver_name;
      if (!driverName) return;
      
      const performance = calculateOnTimePerformance(item, 'destination');
      
      // Skip items with no_data KPI
      if (performance === null) return;
      
      if (!grouped[driverName]) {
        grouped[driverName] = { ontime: 0, delay: 0, total: 0 };
      }
      
      if (performance === 'on time') {
        grouped[driverName].ontime++;
      } else if (performance === 'delay') {
        grouped[driverName].delay++;
      }
      grouped[driverName].total = grouped[driverName].ontime + grouped[driverName].delay;
    });
    
    return Object.entries(grouped)
      .map(([driver, data]) => ({
        name: driver,
        ontime: data.ontime,
        delay: data.delay,
        ontimePercentage: data.total > 0 ? (data.ontime / data.total) * 100 : 0
      }))
      .filter(item => item.ontimePercentage < 95) // Only show drivers below 95%
      .sort((a, b) => a.ontimePercentage - b.ontimePercentage);
  }, [filteredTransportData]);

  // Process data for Origin Drivers Above Target
  const originDriversAboveTarget = useMemo(() => {
    const grouped: { [key: string]: { ontime: number; delay: number; total: number } } = {};
    
    filteredTransportData.forEach(item => {
      const driverName = item.driver_name;
      if (!driverName) return;
      
      const performance = calculateOnTimePerformance(item, 'origin');
      
      // Skip items with no_data KPI
      if (performance === null) return;
      
      if (!grouped[driverName]) {
        grouped[driverName] = { ontime: 0, delay: 0, total: 0 };
      }
      
      if (performance === 'on time') {
        grouped[driverName].ontime++;
      } else if (performance === 'delay') {
        grouped[driverName].delay++;
      }
      grouped[driverName].total = grouped[driverName].ontime + grouped[driverName].delay;
    });
    
    return Object.entries(grouped)
      .map(([driver, data]) => ({
        name: driver,
        ontime: data.ontime,
        delay: data.delay,
        ontimePercentage: data.total > 0 ? (data.ontime / data.total) * 100 : 0
      }))
      .filter(item => item.ontimePercentage >= 95) // Only show drivers above 95%
      .sort((a, b) => b.ontimePercentage - a.ontimePercentage);
  }, [filteredTransportData]);

  // Process data for Destination Drivers Above Target
  const destinationDriversAboveTarget = useMemo(() => {
    const grouped: { [key: string]: { ontime: number; delay: number; total: number } } = {};
    
    filteredTransportData.forEach(item => {
      const driverName = item.driver_name;
      if (!driverName) return;
      
      const performance = calculateOnTimePerformance(item, 'destination');
      
      // Skip items with no_data KPI
      if (performance === null) return;
      
      if (!grouped[driverName]) {
        grouped[driverName] = { ontime: 0, delay: 0, total: 0 };
      }
      
      if (performance === 'on time') {
        grouped[driverName].ontime++;
      } else if (performance === 'delay') {
        grouped[driverName].delay++;
      }
      grouped[driverName].total = grouped[driverName].ontime + grouped[driverName].delay;
    });
    
    return Object.entries(grouped)
      .map(([driver, data]) => ({
        name: driver,
        ontime: data.ontime,
        delay: data.delay,
        ontimePercentage: data.total > 0 ? (data.ontime / data.total) * 100 : 0
      }))
      .filter(item => item.ontimePercentage >= 95) // Only show drivers above 95%
      .sort((a, b) => b.ontimePercentage - a.ontimePercentage);
  }, [filteredTransportData]);

  // Process data for Origin Reason Codes
  const originReasonData = useMemo(() => {
    const reasonCounts: { [key: string]: number } = {};
    
    filteredTransportData.forEach(item => {
      const reasonCode = item.reason_kpi_origin;
      
        reasonCounts[reasonCode] = (reasonCounts[reasonCode] || 0) + 1;
      
    });
    
    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        name: reason,
        value: count
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransportData]);

  // Process data for Destination Reason Codes
  const destinationReasonData = useMemo(() => {
    const reasonCounts: { [key: string]: number } = {};
    
    filteredTransportData.forEach(item => {
      const reasonCode = item.reason_kpi_destination;
     
        reasonCounts[reasonCode] = (reasonCounts[reasonCode] || 0) + 1;
      
    });
    
    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        name: reason,
        value: count
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransportData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const validOriginData = filteredTransportData.filter(item => calculateOnTimePerformance(item, 'origin') !== null);
    const validDestinationData = filteredTransportData.filter(item => calculateOnTimePerformance(item, 'destination') !== null);
    
    const totalTrips = filteredTransportData.length;
    const originOntime = filteredTransportData.filter(item => calculateOnTimePerformance(item, 'origin') === 'on time').length;
    const destinationOntime = filteredTransportData.filter(item => calculateOnTimePerformance(item, 'destination') === 'on time').length;
    
    const originOntimePercentage = validOriginData.length > 0 ? (originOntime / validOriginData.length) * 100 : 0;
    const destinationOntimePercentage = validDestinationData.length > 0 ? (destinationOntime / validDestinationData.length) * 100 : 0;
  
    const uniqueDrivers = new Set(filteredTransportData.map(item => item.driver_name).filter(Boolean)).size;
    const driversAboveTarget = new Set([
      ...filteredTransportData.filter(item => {
        const driverName = item.driver_name;
        if (!driverName) return false;
        
        const driverData = filteredTransportData.filter(t => t.driver_name === driverName);
        const ontimeCount = driverData.filter(t => calculateOnTimePerformance(t, 'origin') === 'on time').length;
        const percentage = driverData.length > 0 ? (ontimeCount / driverData.length) * 100 : 0;
        return percentage >= 95;
      }).map(item => item.driver_name)
    ]).size;
    
    return {
      totalTrips,
      originOntime,
      originTotal: validOriginData.length,
      originOntimePercentage,
      destinationOntime,
      destinationTotal: validDestinationData.length,
      destinationOntimePercentage,
      uniqueDrivers,
      driversAboveTarget,
      driversBelowTarget: uniqueDrivers - driversAboveTarget
    };
  }, [filteredTransportData]);

  const CustomTooltip = ({ active, payload, label }: any) => {

    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.dataKey === 'ontimePercentage' ? `${entry.value.toFixed(2)}%` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Function to handle bar click and show modal with data
  const handleBarClick = (data: any, chartType: string) => {
    if (!data || !data.activeLabel) return;
    
    let filteredData: TransportItem[] = [];
    const label = data.activeLabel;
    
    if (chartType === 'originByDate') {
      // Filter data by receive date
      filteredData = filteredTransportData.filter(item => {
        if (!item.date_recive) return false;
        try {
          const dateLabel = format(parseISO(item.date_recive), 'MMM dd');
          return dateLabel === label && calculateOnTimePerformance(item, 'origin') !== null;
        } catch {
          return false;
        }
      });
    } else if (chartType === 'destinationByDate') {
      filteredData = filteredTransportData.filter(item => {
        if (!item.date_deliver) return false;
        try {
          const dateLabel = format(parseISO(item.date_deliver), 'MMM dd');
          return dateLabel === label && calculateOnTimePerformance(item, 'destination') !== null;
        } catch {
          return false;
        }
      });
    } else if (chartType === 'originDrivers') {
      filteredData = filteredTransportData.filter(item => 
        item.driver_name === label && calculateOnTimePerformance(item, 'origin') !== null
      );
    } else if (chartType === 'destinationDrivers') {
      filteredData = filteredTransportData.filter(item => 
        item.driver_name === label && calculateOnTimePerformance(item, 'destination') !== null
      );
    } else if (chartType === 'originDriversAbove') {
      filteredData = filteredTransportData.filter(item => 
        item.driver_name === label && calculateOnTimePerformance(item, 'origin') !== null
      );
    } else if (chartType === 'destinationDriversAbove') {
      filteredData = filteredTransportData.filter(item => 
        item.driver_name === label && calculateOnTimePerformance(item, 'destination') !== null
      );
    }
    
    setModalData({
      isOpen: true,
      title: `Data for ${label}`,
      data: filteredData
    });
  };

  // Function to handle pie chart click
  const handlePieClick = (data: any, chartType: string) => {
    if (!data || !data.name) return;
    
    let filteredData: TransportItem[] = [];
    const reasonCode = data.name === "null" ? null : data.name;

    if (chartType === 'originReason') {
      filteredData = filteredTransportData.filter(item => 
        item.reason_kpi_origin === reasonCode
      );
    } else if (chartType === 'destinationReason') {
      filteredData = filteredTransportData.filter(item => 
        item.reason_kpi_destination === reasonCode
      );
    }
    
    setModalData({
      isOpen: true,
      title: `Data for Reason: ${reasonCode}`,
      data: filteredData
    });
  };

  const renderChart = (data: ChartData[], title: string, colorScheme: 'green' | 'red', chartType: string) => {
    const colors = colorScheme === 'green' ? COLORS.GREEN : COLORS.RED;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <p className="text-xs text-gray-500">คลิกแท่งเทียน เพื่อดูรายละเอียด</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onClick={(data) => handleBarClick(data, chartType)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="trips" orientation="right" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="percentage" orientation="left" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Bar 
                yAxisId="trips" 
                dataKey="ontime" 
                stackId="trips" 
                fill={colors.main} 
                name="On-time"
                radius={[0, 0, 4, 4]}
                cursor="pointer"
              />
              <Bar 
                yAxisId="trips" 
                dataKey="delay" 
                stackId="trips" 
                fill={colors.secondary} 
                name="Delay"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
              />
              
              <Line 
                yAxisId="percentage" 
                type="monotone" 
                dataKey="ontimePercentage" 
                stroke="#0f52b1ff" 
                strokeWidth={3}
                dot={{ fill: "#ffffffff", strokeWidth: 2, r: 4 }}
                name="On-time %"
              />
              

              <ReferenceLine yAxisId="percentage" y={95} stroke="#8884d8" strokeDasharray="5 5" strokeWidth={2} label={{ value: "🎯95%", position: "insideBottomLeft", stroke: "#4e4a9fff" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderPieChart = (data: any[], title: string, chartType: string) => {
    if (data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-gray-500">No data available</p>
          </CardContent>
        </Card>
      );
    }

    const CustomPieTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0];
        return (
          <div className="bg-white p-3 border rounded shadow-lg">
            <p className="font-semibold">{data.name}</p>
            <p style={{ color: data.color }}>
              Count: {data.value}
            </p>
          </div>
        );
      }
      return null;
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <p className="text-xs text-gray-500">คลิกส่วนของ Pie Chart เพื่อดูรายละเอียด</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#af6528ff"
                dataKey="value"
                onClick={(data) => handlePieClick(data, chartType)}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{summaryStats.totalTrips} </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Arrival</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{summaryStats.originOntimePercentage.toFixed(1)}%</div>
            <p className="text-md text-muted-foreground">
              {summaryStats.originOntime} / {summaryStats.originTotal} trips
            </p>
            {/* <p className="text-xs text-muted-foreground">
              Target: 95%
            </p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
           <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{summaryStats.destinationOntimePercentage.toFixed(1)}%</div>
            <p className="text-md text-muted-foreground">
              {summaryStats.destinationOntime} / {summaryStats.destinationTotal} trips
            </p>
           
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drivers Below Target</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{summaryStats.driversBelowTarget}</div>
            <p className="text-md text-muted-foreground">
              Out of {summaryStats.uniqueDrivers} drivers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {renderChart(originByDate, "On-Time Arrival Performance by Date", "green", "originByDate")}
        {renderChart(destinationByDate, "On-Time Delivery Performance by Date", "green", "destinationByDate")}
      </div>

      {/* Driver Performance Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {originDriversBelowTarget.length > 0 && renderChart(
          originDriversBelowTarget, 
          "Arrival Drivers Falling Below Target", 
          "red",
          "originDrivers"
        )}
        {destinationDriversBelowTarget.length > 0 && renderChart(
          destinationDriversBelowTarget, 
          "Delivery Drivers Falling Below Target", 
          "red",
          "destinationDrivers"
        )}
      </div>

      {/* Driver Performance Charts - Above Target */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {originDriversAboveTarget.length > 0 && renderChart(
          originDriversAboveTarget, 
          "Arrival Drivers Above Target (≥95%)", 
          "green",
          "originDriversAbove"
        )}
        {destinationDriversAboveTarget.length > 0 && renderChart(
          destinationDriversAboveTarget, 
          "Delivery Drivers Above Target (≥95%)", 
          "green",
          "destinationDriversAbove"
        )}
      </div>
      
      {/* Reason code Pie Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {originReasonData.length > 0 && renderPieChart(
          originReasonData, 
          "Arrival Reason Codes", 
          "originReason"
        )}
        {destinationReasonData.length > 0 && renderPieChart(
          destinationReasonData, 
          "Delivery Reason Codes", 
          "destinationReason"
        )}
      </div>


      {/* No drivers below target message */}
      {originDriversBelowTarget.length === 0 && destinationDriversBelowTarget.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Excellent Performance!</h3>
              <p className="text-gray-500">All drivers are meeting the 95% on-time target.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No reason data message */}
      {originReasonData.length === 0 && destinationReasonData.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No Reason Data Available</h3>
              <p className="text-gray-500">No reason codes found for origin or destination delays.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Modal */}
      <Dialog open={modalData.isOpen} onOpenChange={(open) => setModalData(prev => ({...prev, isOpen: open}))}>
        <DialogContent className="min-w-5xl bg-white max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{modalData.title}</DialogTitle>
            {/* <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={() => setModalData(prev => ({...prev, isOpen: false}))}
            >
              <X className="h-4 w-4" />
            </Button> */}
          </DialogHeader>
          <div className="overflow-y-auto">
            <DataTable data={modalData.data} title="" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}