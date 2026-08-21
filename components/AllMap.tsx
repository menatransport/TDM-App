"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TransportItem } from "@/lib/type";
import { Truck, Navigation, X, MapPin } from "lucide-react";

declare global {
  interface Window {
    longdo: any;
  }
}

interface AllMapProps {
  data: TransportItem[];
}

interface LatLon {
  lat: number;
  lon: number;
}

interface TruckPoint {
  item: TransportItem;
  coords: LatLon;
}

interface TruckCluster {
  center: LatLon;
  items: TruckPoint[];
}

interface RouteInfo {
  distance: number; // km
  duration: number; // minutes
}

// รัศมี geofence (หน่วยองศา ~500 เมตร)
const GEOFENCE_RADIUS = 0.005;

// ระยะรวมกลุ่ม marker (~60px บนจอ)
const CLUSTER_PX = 60;

// zoom ขั้นต่ำที่เริ่มแสดงป้ายชื่อคลังสินค้า (ต้องซูมใกล้จริงๆ)
const WAREHOUSE_LABEL_ZOOM = 15;

// สถานะที่มุ่งหน้าไป "ปลายทาง" (นอกนั้นถือว่ามุ่งหน้าไป "ต้นทาง")
const DESTINATION_STATUSES = [
  "ถึงต้นทาง",
  "เริ่มขึ้นสินค้า",
  "ขึ้นสินค้าเสร็จ",
  "เริ่มขนส่ง",
  "ถึงปลายทาง",
  "ยื่นเอกสาร",
  "ได้รับเอกสารคืน",
  "เริ่มลงสินค้า",
  "ลงสินค้าเสร็จ",
];

const parseLatLng = (value?: string): LatLon | null => {
  if (!value || value === "#N/A") return null;
  const [lat, lon] = value.split(",").map((s) => parseFloat(s.trim()));
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
};

// จุดหมายที่รถกำลังมุ่งไปตามสถานะปัจจุบัน
const getTarget = (item: TransportItem) => {
  if (DESTINATION_STATUSES.includes(item.status)) {
    return {
      latLng: item.latlng_deliver,
      name: item.locat_deliver,
      type: "destination" as const,
    };
  }
  return {
    latLng: item.latlng_recive,
    name: item.locat_recive,
    type: "origin" as const,
  };
};

const getStatusColor = (status: string, gpsOutdated: boolean) => {
  if (gpsOutdated) return "#9CA3AF"; // gray — GPS ขาดการติดต่อ
  switch (status) {
    case "พร้อมรับงาน":
    case "รับงาน":
      return "#EAB308"; // yellow
    case "ถึงต้นทาง":
    case "เริ่มขึ้นสินค้า":
    case "ขึ้นสินค้าเสร็จ":
      return "#3B82F6"; // blue
    case "เริ่มขนส่ง":
      return "#8B5CF6"; // purple
    case "ถึงปลายทาง":
    case "เริ่มลงสินค้า":
    case "ลงสินค้าเสร็จ":
      return "#F97316"; // orange
    case "จัดส่งแล้ว (POD)":
      return "#22C55E"; // green
    default:
      return "#6B7280";
  }
};

const isGpsOutdated = (item: TransportItem) => {
  const updated = new Date(item.vehicle_info.gps_updated_at).getTime();
  return Date.now() - updated > 20 * 60 * 1000; // 20 นาที
};

// ไล่ระดับสี + ขนาด cluster ตามความหนาแน่นของทะเบียน
const getClusterStyle = (count: number) => {
  if (count >= 20)
    return { bg: "#DC2626", ring: "rgba(220,38,38,0.25)", size: 56 }; // แดง
  if (count >= 10)
    return { bg: "#F97316", ring: "rgba(249,115,22,0.25)", size: 50 }; // ส้ม
  if (count >= 5)
    return { bg: "#EAB308", ring: "rgba(234,179,8,0.25)", size: 45 }; // เหลือง
  return { bg: "#22C55E", ring: "rgba(34,197,94,0.25)", size: 40 }; // เขียว
};

// 1 ทะเบียน = 1 คัน โดยยึด "งานล่าสุดที่กำลังดำเนินการ"
// (งานที่ยังไม่ POD มาก่อน ถ้าเท่ากันใช้งานที่ date_recive ล่าสุด)
const dedupeByPlate = (data: TransportItem[]): TruckPoint[] => {
  const byPlate = new Map<string, TransportItem>();

  for (const item of data) {
    const prev = byPlate.get(item.h_plate);
    if (!prev) {
      byPlate.set(item.h_plate, item);
      continue;
    }

    const prevActive = prev.status !== "จัดส่งแล้ว (POD)";
    const currActive = item.status !== "จัดส่งแล้ว (POD)";

    if (currActive && !prevActive) {
      byPlate.set(item.h_plate, item);
    } else if (currActive === prevActive) {
      const prevTime = new Date(prev.date_recive).getTime() || 0;
      const currTime = new Date(item.date_recive).getTime() || 0;
      if (currTime > prevTime) byPlate.set(item.h_plate, item);
    }
  }

  const trucks: TruckPoint[] = [];
  byPlate.forEach((item) => {
    const coords = parseLatLng(item.vehicle_info.current_latlng);
    if (coords) trucks.push({ item, coords });
  });
  return trucks;
};

// รวมกลุ่มรถตามระยะบนจอ (ขึ้นกับ zoom)
const clusterTrucks = (trucks: TruckPoint[], zoom: number): TruckCluster[] => {
  const threshold = (360 / Math.pow(2, zoom)) * (CLUSTER_PX / 256);
  const clusters: TruckCluster[] = [];

  for (const truck of trucks) {
    let found: TruckCluster | null = null;
    for (const cluster of clusters) {
      if (
        Math.abs(cluster.center.lat - truck.coords.lat) < threshold &&
        Math.abs(cluster.center.lon - truck.coords.lon) < threshold
      ) {
        found = cluster;
        break;
      }
    }

    if (found) {
      found.items.push(truck);
      found.center = {
        lat:
          found.items.reduce((s, t) => s + t.coords.lat, 0) /
          found.items.length,
        lon:
          found.items.reduce((s, t) => s + t.coords.lon, 0) /
          found.items.length,
      };
    } else {
      clusters.push({ center: { ...truck.coords }, items: [truck] });
    }
  }

  return clusters;
};

export const AllMap = ({ data }: AllMapProps) => {
  const [mapReady, setMapReady] = useState(false);
  const [selected, setSelected] = useState<TransportItem | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [truckCount, setTruckCount] = useState(0);

  const mapRef = useRef<any>(null);
  const trucksRef = useRef<TruckPoint[]>([]);
  const truckOverlaysRef = useRef<any[]>([]);
  const markerItemsRef = useRef(new Map<any, TransportItem>());
  const clusterMarkersRef = useRef(new Map<any, TruckCluster>());
  const warehousesRef = useRef<{ coords: LatLon; name: string }[]>([]);
  const warehouseMarkersRef = useRef<any[]>([]);
  const warehouseSigRef = useRef<string | null>(null);
  const clusterCentersRef = useRef<LatLon[]>([]);
  const boundsFittedRef = useRef(false);
  const selectRef = useRef<(item: TransportItem) => void>(() => { });
  const renderTrucksRef = useRef<() => void>(() => { });
  const renderWarehousesRef = useRef<() => void>(() => { });

  // ====== วาดเส้นทางของรถคันที่เลือก ======
  const handleSelect = useCallback((item: TransportItem) => {
    const map = mapRef.current;
    if (!map) return;

    setSelected(item);
    setRouteInfo(null);

    const current = parseLatLng(item.vehicle_info.current_latlng);
    const targetCoords = parseLatLng(getTarget(item).latLng);

    if (!current || !targetCoords || !map.Route) return;

    try {
      map.Route.clear();
      map.Route.add(current);
      map.Route.add(targetCoords);
      map.Route.search();
    } catch (error) {
      console.error("Route error:", error);
    }
  }, []);
  selectRef.current = handleSelect;

  const clearSelection = useCallback(() => {
    setSelected(null);
    setRouteInfo(null);
    try {
      mapRef.current?.Route?.clear();
    } catch { }
  }, []);

  // ====== วาด marker คลังสินค้า ======
  // ซ่อนเฉพาะคลังที่อยู่ใกล้วงกลมตัวเลข cluster / แสดงป้ายชื่อเมื่อซูมใกล้เท่านั้น
  const renderWarehouses = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.longdo) return;

    const zoom = typeof map.zoom === "function" ? map.zoom() : 7;
    const showLabel = zoom >= WAREHOUSE_LABEL_ZOOM;

    // คลังที่อยู่ในรัศมี ~cluster bubble บนจอ ถือว่าโดนบัง → ไม่ต้องวาด
    const threshold = (360 / Math.pow(2, zoom)) * (CLUSTER_PX / 256);
    const visible = warehousesRef.current.filter(
      ({ coords }) =>
        !clusterCentersRef.current.some(
          (c) =>
            Math.abs(c.lat - coords.lat) < threshold &&
            Math.abs(c.lon - coords.lon) < threshold
        )
    );

    // ข้ามถ้าผลลัพธ์การแสดงผลไม่เปลี่ยน (กันวาดซ้ำทุกครั้งที่ zoom)
    const sig = `${showLabel}|${visible
      .map(({ coords }) => `${coords.lat},${coords.lon}`)
      .join(";")}`;
    if (warehouseSigRef.current === sig) return;
    warehouseSigRef.current = sig;

    warehouseMarkersRef.current.forEach((overlay) => {
      try {
        map.Overlays.remove(overlay);
      } catch { }
    });
    warehouseMarkersRef.current = [];

    visible.forEach(({ coords, name }) => {
      const icon = `<span style="font-size:26px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4));">🏭</span>`;
      const label = `<span style="background:#fff;border-radius:9999px;padding:2px 8px;box-shadow:0 1px 4px rgba(0,0,0,.3);font-family:sans-serif;font-size:10px;font-weight:600;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;">${name}</span>`;
      const marker = new window.longdo.Marker(coords, {
        title: "🏭 คลังสินค้า",
        detail: name,
        icon: {
          html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;width:130px;line-height:1;">${icon}${showLabel ? label : ""
            }</div>`,
          offset: { x: 65, y: 15 },
        },
      });
      map.Overlays.add(marker);
      warehouseMarkersRef.current.push(marker);
    });
  }, []);
  renderWarehousesRef.current = renderWarehouses;

  // ====== วาด marker รถ (cluster ตาม zoom) ======
  const renderTrucks = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.longdo) return;

    // ลบ marker รถชุดเดิม
    truckOverlaysRef.current.forEach((overlay) => {
      try {
        map.Overlays.remove(overlay);
      } catch { }
    });
    truckOverlaysRef.current = [];
    markerItemsRef.current.clear();
    clusterMarkersRef.current.clear();

    const zoom = typeof map.zoom === "function" ? map.zoom() : 7;
    const clusters = clusterTrucks(trucksRef.current, zoom);

    clusters.forEach((cluster) => {
      let marker: any;

      if (cluster.items.length === 1) {
        // รถเดี่ยว — แสดงป้ายทะเบียน
        const { item, coords } = cluster.items[0];
        const color = getStatusColor(item.status, isGpsOutdated(item));
        marker = new window.longdo.Marker(coords, {
          icon: {
            html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;width:90px;cursor:pointer;line-height:1;"><span style="font-size:17px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));">🚚</span><span style="display:flex;align-items:center;gap:3px;background:#fff;border-radius:9999px;padding:2px 7px;box-shadow:0 1px 3px rgba(0,0,0,.25);font-family:sans-serif;font-size:10px;font-weight:600;color:#1F2937;white-space:nowrap;"><span style="width:5px;height:5px;border-radius:50%;background:${color};flex-shrink:0;"></span>${item.h_plate}</span></div>`,
            offset: { x: 45, y: 17 },
          },
        });
        markerItemsRef.current.set(marker, item);
      } else {
        // กลุ่มรถ — ไล่สี/ขนาดตามความหนาแน่น กดเพื่อซูมแตกกลุ่ม
        const count = cluster.items.length;
        const { bg, ring, size } = getClusterStyle(count);
        const outer = size + 14;
        marker = new window.longdo.Marker(cluster.center, {
          icon: {
            html: `<div style="width:${outer}px;height:${outer}px;border-radius:50%;background:${ring};display:flex;align-items:center;justify-content:center;cursor:pointer;"><div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:#fff;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:${count >= 100 ? 13 : 15
              }px;font-weight:700;">${count}</div></div>`,
            offset: { x: outer / 2, y: outer / 2 },
          },
        });
        clusterMarkersRef.current.set(marker, cluster);
      }

      map.Overlays.add(marker);
      truckOverlaysRef.current.push(marker);
    });

    // ตำแหน่ง cluster ตัวเลข → ใช้ซ่อนไอคอนคลังสินค้าที่โดนบัง
    clusterCentersRef.current = clusters
      .filter((c) => c.items.length > 1)
      .map((c) => c.center);
    renderWarehousesRef.current();
  }, []);
  renderTrucksRef.current = renderTrucks;

  // ====== โหลด Longdo script + สร้างแผนที่ ======
  useEffect(() => {
    const init = () => {
      if (!window.longdo) {
        setTimeout(init, 300);
        return;
      }
      const el = document.getElementById("longdo-all-map");
      if (!el || mapRef.current) return;

      const map = new window.longdo.Map({
        placeholder: el,
        language: "th",
        lastView: false,
        zoom: 7,
      });
      mapRef.current = map;

      map.Event.bind("ready", () => {
        try {
          map.Ui.Geolocation.visible(false);
          map.Ui.DPad.visible(false);

          // placeholder ซ่อนผลลัพธ์ route (ไม่ให้ render ลงหน้า)
          let routeDiv = document.getElementById("allmap-route-result");
          if (!routeDiv) {
            routeDiv = document.createElement("div");
            routeDiv.id = "allmap-route-result";
            routeDiv.style.display = "none";
            document.body.appendChild(routeDiv);
          }
          if (map.Route?.placeholder) map.Route.placeholder(routeDiv);

          // ระยะทาง/เวลาเมื่อค้นหาเส้นทางสำเร็จ
          if (map.Route?.Event?.bind) {
            map.Route.Event.bind("result", (res: any) => {
              if (res && res.length > 0) {
                setRouteInfo({
                  distance: res[0].distance / 1000,
                  duration: Math.round(res[0].time / 60),
                });
              }
            });
          }

          // zoom เปลี่ยน → คำนวณกลุ่มใหม่ (แตก/รวม)
          // (renderTrucks จะอัปเดตการแสดงคลังสินค้าให้เอง)
          map.Event.bind("zoom", () => {
            renderTrucksRef.current();
          });

          // คลิก marker
          map.Event.bind("overlayClick", (overlay: any) => {
            // กดกลุ่ม → focus ครอบรถในกลุ่มพอดี แล้วแตกกลุ่ม
            const cluster = clusterMarkersRef.current.get(overlay);
            if (cluster) {
              const lats = cluster.items.map((t) => t.coords.lat);
              const lons = cluster.items.map((t) => t.coords.lon);
              const pad = 0.02;
              try {
                map.bound({
                  minLon: Math.min(...lons) - pad,
                  maxLon: Math.max(...lons) + pad,
                  minLat: Math.min(...lats) - pad,
                  maxLat: Math.max(...lats) + pad,
                });
              } catch {
                map.location(cluster.center, true);
              }
              return;
            }
            // กดรถ → วาดเส้นทาง
            const item = markerItemsRef.current.get(overlay);
            if (item) selectRef.current(item);
          });
        } catch (error) {
          console.error("Map ready setup error:", error);
        }
        setMapReady(true);
      });
    };

    if (window.longdo) {
      init();
    } else if (!document.querySelector('script[src*="api.longdo.com"]')) {
      const script = document.createElement("script");
      script.src =
        "https://api.longdo.com/map3/?key=657049216c4c370977197048c841a727";
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    } else {
      init();
    }

    return () => {
      mapRef.current = null;
    };
  }, []);

  // ====== วาดสถานที่ (คลังสินค้า) + รถทั้งหมด ======
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !window.longdo) return;

    map.Overlays.clear();
    truckOverlaysRef.current = [];
    markerItemsRef.current.clear();
    clusterMarkersRef.current.clear();
    warehouseMarkersRef.current = [];

    const bounds: LatLon[] = [];
    const seenLocations = new Set<string>();

    // คลังสินค้า (ต้นทาง/ปลายทาง) — วง geofence วาดค้างไว้ ส่วน marker วาดตาม zoom
    const warehouses: { coords: LatLon; name: string }[] = [];
    const addWarehouse = (latlngStr: string, name: string) => {
      const coords = parseLatLng(latlngStr);
      if (!coords || seenLocations.has(latlngStr)) return;
      seenLocations.add(latlngStr);

      const circle = new window.longdo.Circle(coords, GEOFENCE_RADIUS, {
        lineColor: "#94A3B8",
        lineWidth: 1,
        fillColor: "rgba(148,163,184,0.10)",
      });
      map.Overlays.add(circle);

      warehouses.push({ coords, name });
      bounds.push(coords);
    };

    data.forEach((item) => {
      addWarehouse(item.latlng_recive, item.locat_recive);
      addWarehouse(item.latlng_deliver, item.locat_deliver);
    });

    warehousesRef.current = warehouses;
    warehouseSigRef.current = null; // บังคับวาดคลังใหม่หลัง clear overlays

    // รถ: 1 ทะเบียน = 1 ตำแหน่งล่าสุด (งานที่กำลังดำเนินการ)
    trucksRef.current = dedupeByPlate(data);
    setTruckCount(trucksRef.current.length);
    trucksRef.current.forEach((t) => bounds.push(t.coords));

    renderTrucks();

    // ปรับมุมมองครั้งแรกให้เห็นครบทุกจุด
    if (!boundsFittedRef.current && bounds.length > 0) {
      boundsFittedRef.current = true;
      const minLon = Math.min(...bounds.map((p) => p.lon)) - 0.05;
      const maxLon = Math.max(...bounds.map((p) => p.lon)) + 0.05;
      const minLat = Math.min(...bounds.map((p) => p.lat)) - 0.05;
      const maxLat = Math.max(...bounds.map((p) => p.lat)) + 0.05;
      setTimeout(() => {
        try {
          map.bound({ minLon, maxLon, minLat, maxLat });
        } catch { }
      }, 300);
    }
  }, [data, mapReady, renderTrucks]);

  const selectedTarget = selected ? getTarget(selected) : null;

  return (
    <div className="relative w-full h-full min-h-[70vh]">
      <div id="longdo-all-map" className="w-full h-full min-h-[70vh]" />

      {/* จำนวนรถ */}
      {/* <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full shadow-md px-3 py-1.5 flex items-center gap-2">
        <Truck size={15} className="text-blue-600" />
        <span className="text-xs font-medium text-gray-700">
          {truckCount} คัน • แตะไอคอนรถเพื่อดูเส้นทาง
        </span>
      </div> */}

      {/* Legend */}
      <div className="absolute bottom-4 left-3 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md p-2.5">
        <div className="flex flex-col gap-1.5 text-[11px] text-gray-700">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center text-[13px]">
              🏭
            </span>
            คลังสินค้า (geofence)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex flex-col items-center justify-center leading-none">
              <span className="text-[11px]">🚚</span>
              <span className="text-[6px] font-bold text-gray-800">ทะเบียน</span>
            </span>
            รถ (จุดสีตามสถานะ)
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center -space-x-1">
              <span className="w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow" />
              <span className="w-5 h-5 rounded-full bg-yellow-500 border-2 border-white shadow" />
              <span className="w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow" />
              <span className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow" />
            </span>
            กลุ่มรถ น้อย→มาก (กด/ซูมเพื่อแตก)
          </div>
        </div>
      </div>

      {/* การ์ดรถที่เลือก */}
      {selected && (
        <div className="absolute top-3 right-3 z-10 w-64 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 text-white">
            <div className="flex items-center gap-2 min-w-0">
              <Truck size={15} className="flex-shrink-0" />
              <span className="text-sm font-semibold truncate">
                {selected.h_plate}
              </span>
            </div>
            <button
              onClick={clearSelection}
              className="p-1 hover:bg-white/20 rounded cursor-pointer flex-shrink-0"
              title="ปิด"
            >
              <X size={14} />
            </button>
          </div>
          <div className="p-3 space-y-2 text-xs text-gray-700">
            <div className="truncate font-medium text-gray-900">
              {selected.driver_name}
            </div>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[11px] text-white"
              style={{
                background: getStatusColor(
                  selected.status,
                  isGpsOutdated(selected)
                ),
              }}
            >
              {selected.status}
            </span>
            <div className="flex items-start gap-1.5">
              <Navigation
                size={13}
                className="text-blue-600 mt-0.5 flex-shrink-0"
              />
              <span className="leading-snug">
                มุ่งหน้า{" "}
                {selectedTarget?.type === "origin" ? "ต้นทาง" : "ปลายทาง"}:{" "}
                <span className="font-medium">{selectedTarget?.name}</span>
              </span>
            </div>
            {routeInfo ? (
              <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                <MapPin size={13} className="text-red-500 flex-shrink-0" />
                {routeInfo.distance.toFixed(1)} กม. • ~{routeInfo.duration} นาที
              </div>
            ) : (
              <div className="text-gray-400"></div>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {!mapReady && (
        <div className="absolute inset-0 z-20 bg-white/90 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">
              กำลังโหลดแผนที่...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
