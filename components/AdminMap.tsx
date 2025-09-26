"use client";
import { useEffect, useState } from "react";
import { Layers, MapPin, X } from "lucide-react";
import { TransportItem } from "@/lib/type";
import { useRouter, useSearchParams } from "next/navigation";
declare global {
  interface Window {
    longdo: any;
  }
}
const MockData = [
  {
    origin: "บริษัท นีโอ แฟคทอรี่ จำกัด",
    status: "เริ่มขนส่ง",
    origin_latlng: "14.032724166617289,100.8945183647243",
    destination: "Makro บางนา",
    destination_latlng: "13.595060174396597,100.79556850955248",
    current_latlng: "13.614195122768754,100.75269703909746", // ปัจจุบัน
    // Timeline data
    ticketdata: [
      {
        start_datetime: "16/9/2025, 14:33:00",
        start_latlng: "14.076278051437182, 100.89104955149347",
        origin_datetime: "16/9/2025, 14:33:00",
        origin_latlng: "14.032724166617289,100.8945183647243",
        start_recive_datetime: "16/9/2025, 14:33:00",
        start_recive_latlng: "14.009331803994895, 100.89458095877524",
        end_recive_datetime: "16/9/2025, 14:33:00",
        end_recive_latlng: "13.98417883316822, 100.89542778771171",
        intransit_datetime: "16/9/2025, 15:00:00",
        intransit_latlng: "13.898678204027698, 100.88832007993699",
        desination_datetime: "16/9/2025, 14:33:00",
        destination_latlng: "13.595060174396597,100.79556850955248",
        docs_submitted_datetime: "16/9/2025, 18:00:00",
        docs_submitted_latlng: "13.595060174396597,100.79556850955248",
        start_unload_datetime: "16/9/2025, 16:30:00",
        start_unload_latlng: "13.595060174396597,100.79556850955248",
        docs_returned_datetime: "16/9/2025, 14:33:00",
        docs_returned_latlng: "13.595060174396597,100.79556850955248",
        end_unload_datetime: "16/9/2025, 14:33:00",
        end_unload_latlng: "13.595060174396597,100.79556850955248",
        complete_datetime: "16/9/2025, 17:00:00",
        complete_latlng: "13.594238506183327, 100.80722420686782",
      },
    ],
  },
];

interface AdminMapProps {
  jobView: TransportItem | null;
  closeModal: (close: boolean) => void;
  refreshTable: () => void;
}

export function AdminMap({ jobView, closeModal, refreshTable }: AdminMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadid, setLoadid] = useState("");
  const [formData, setFormData] = useState<TransportItem | null>(null);
  const [distance, setDistance] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    console.log("Job View in AdminMap:", jobView);
    if (jobView) {
      setFormData(jobView);
      const currentId = searchParams.get("id");
      setLoadid(jobView.load_id);
      if (jobView.load_id && currentId !== jobView.load_id) {
        const url = new URL(window.location.href);
        url.searchParams.set("id", jobView.load_id);
        router.replace(url.toString());
      }
    }
  }, [jobView]);

  useEffect(() => {
    setIsClient(true);
    console.log("📋 Props jobView:", jobView);

    const timer = setTimeout(() => {
      loadLongdoMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      const script = document.querySelector('script[src*="api.longdo.com"]');
      if (script) {
        script.remove();
        console.log("🧹 Longdo script cleaned up");
      }
    };
  }, []);

  const loadLongdoMap = () => {
    console.log("🔄 loadLongdoMap called");

    if (window.longdo) {
      console.log("✅ Longdo already loaded, initializing map...");
      setTimeout(initializeMap, 100);
      return;
    }

    console.log("📥 Loading Longdo script...");

    const existingScript = document.querySelector(
      'script[src*="api.longdo.com"]'
    );
    if (existingScript) {
      console.log("🔄 Removing existing script");
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src =
      "https://api.longdo.com/map3/?key=657049216c4c370977197048c841a727";
    script.async = true;
    script.onload = () => {
      console.log("✅ Longdo Map script loaded successfully");
      setTimeout(initializeMap, 200);
    };
    script.onerror = (error) => {
      console.error("❌ Failed to load Longdo Map script:", error);
    };
    document.head.appendChild(script);
  };

  // ฟังก์ชันแปลง lat,lng string เป็น object
  const parseLatLng = (latlngStr: string) => {
    try {
    const [lat, lng] = latlngStr.split(",").map((s) => parseFloat(s.trim()));
    return { lat, lon: lng };
    } catch (error) {
      return { lat: 13.7563, lon: 100.5018 };
    }
  };

  // ฟังก์ชันคำนวณระยะทาง (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // รัศมีของโลกในกิโลเมตร
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // แปลงเป็นเมตร
    return distance;
  };

  // ฟังก์ชันตรวจสอบว่าจุดอยู่ใกล้จุดต้นทางหรือปลายทางหรือไม่
  const isNearLocation = (targetCoords: {lat: number, lon: number}, originCoords: {lat: number, lon: number}, destCoords: {lat: number, lon: number}) => {
    const distanceToOrigin = calculateDistance(
      targetCoords.lat, targetCoords.lon,
      originCoords.lat, originCoords.lon
    );
    const distanceToDest = calculateDistance(
      targetCoords.lat, targetCoords.lon,
      destCoords.lat, destCoords.lon
    );
    
    if (distanceToOrigin <= 500) {
      return { isNear: true, location: 'origin', distance: distanceToOrigin };
    }
    if (distanceToDest <= 500) {
      return { isNear: true, location: 'destination', distance: distanceToDest };
    }
    
    return { isNear: false, location: null, distance: null };
  };

  // ฟังก์ชันสร้าง Timeline markers จาก ticket_info
  const createTimelineMarkers = (map: any, data: any, originCoords: any, destCoords: any): { originDetails: string[], destDetails: string[] } => {
    if (!data.ticket_info) {
      console.log("⚠️ No ticket_info available");
      return { originDetails: [], destDetails: [] };
    }

    const ticket = data.ticket_info;
    const timelineEvents = [
      { 
        name: 'เริ่มงาน', 
        datetime: ticket.start_datetime, 
        latlng: ticket.start_latlng,
        icon: '-',
        color: '#b9103aff'
      },
      { 
        name: 'ถึงต้นทาง', 
        datetime: ticket.origin_datetime, 
        latlng: ticket.origin_latlng,
        icon: '-',
        color: '#3B82F6'
      },
      { 
        name: 'เริ่มขึ้นสินค้า', 
        datetime: ticket.start_recive_datetime, 
        latlng: ticket.start_recive_latlng,
        icon: '-',
        color: '#8B5CF6'
      },
      { 
        name: 'ขึ้นสินค้าเสร็จ', 
        datetime: ticket.end_recive_datetime, 
        latlng: ticket.end_recive_latlng,
        icon: '-',
        color: '#059669'
      },
      { 
        name: 'เริ่มขนส่ง', 
        datetime: ticket.intransit_datetime, 
        latlng: ticket.intransit_latlng,
        icon: '-',
        color: '#490bf5ff'
      },
      { 
        name: 'ถึงปลายทาง', 
        datetime: ticket.desination_datetime, 
        latlng: ticket.desination_latlng,
        icon: '-',
        color: '#f50bafff'
      },
      { 
        name: 'เริ่มลงสินค้า', 
        datetime: ticket.start_unload_datetime, 
        latlng: ticket.start_unload_latlng,
        icon: '-',
        color: '#e7b309ff'
      },
      { 
        name: 'ยื่นเอกสาร', 
        datetime: ticket.docs_submitted_datetime, 
        latlng: ticket.docs_submitted_latlng,
        icon: '-',
        color: '#510bf5ff'
      },
      { 
        name: 'ได้รับเอกสารคืน', 
        datetime: ticket.docs_returned_datetime, 
        latlng: ticket.docs_returned_latlng,
        icon: '-',
        color: '#23b8f3ff'
      },
      { 
        name: 'ลงสินค้าเสร็จ', 
        datetime: ticket.end_unload_datetime, 
        latlng: ticket.end_unload_latlng,
        icon: '-',
        color: '#725d00ff'
      },
      { 
        name: 'ส่งสินค้าเสร็จ', 
        datetime: ticket.complete_datetime, 
        latlng: ticket.complete_latlng,
        icon: '✅',
        color: '#0a7400ff'
      }
    ];

    let originDetails: string[] = [];
    let destDetails: string[] = [];

    timelineEvents.forEach((event) => {
      if (!event.datetime || !event.latlng) return;

      try {
        const eventCoords = parseLatLng(event.latlng);
        const nearCheck = isNearLocation(eventCoords, originCoords, destCoords);

        if (nearCheck.isNear) {
          // เพิ่มเข้าไปใน detail ของ marker หลัก
          const detailText = `${event.icon} ${event.name}: ${event.datetime}`;
          
          if (nearCheck.location === 'origin') {
            originDetails.push(detailText);
          } else if (nearCheck.location === 'destination') {
            destDetails.push(detailText);
          }
        } else {
          // สร้าง marker แยก
          const eventMarker = new window.longdo.Marker(eventCoords, {
            title: `${event.name}`,
            detail: `📅 ${event.datetime}`,
            icon: {
                url: "https://img.icons8.com/softteal-color/24/alarm-clock.png",
                size: { width: 24, height: 24 },
                anchor: { x: 22, y: 45 },
              },
          });
          map.Overlays.add(eventMarker);
        }
      } catch (error) {
        console.error(`Error processing timeline event ${event.name}:`, error);
      }
    });

    return { originDetails, destDetails };
  };

  // ฟังก์ชันสร้าง Pulsing Dot (สำหรับใช้งานง่าย)
  const createPulsingDot = (color: string = "blue", size: number = 200) => {
    const colors: { [key: string]: { inner: string; outer: string } } = {
      blue: { inner: "rgba(59, 130, 246, 1)", outer: "rgba(59, 130, 246," },
      red: { inner: "rgba(239, 68, 68, 1)", outer: "rgba(239, 68, 68," },
      green: { inner: "rgba(34, 197, 94, 1)", outer: "rgba(34, 197, 94," },
      orange: { inner: "rgba(249, 115, 22, 1)", outer: "rgba(249, 115, 22," },
      purple: { inner: "rgba(168, 85, 247, 1)", outer: "rgba(168, 85, 247," },
    };

    const selectedColor = colors[color] || colors.blue;

    return {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),
      context: null as CanvasRenderingContext2D | null,

      onAdd: function () {
        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext("2d");
      },

      render: function (map: any) {
        const duration = 1000;
        const t = (performance.now() % duration) / duration;

        const radius = (size / 2) * 0.3;
        const outerRadius = (size / 2) * 0.7 * t + radius;
        const context = this.context;

        if (!context) return false;

        // draw outer circle (pulsing effect)
        context.clearRect(0, 0, this.width, this.height);
        context.beginPath();
        context.arc(
          this.width / 2,
          this.height / 2,
          outerRadius,
          0,
          Math.PI * 2
        );
        context.fillStyle = selectedColor.outer + (1 - t) + ")";
        context.fill();

        // draw inner circle (solid)
        context.beginPath();
        context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
        context.fillStyle = selectedColor.inner;
        context.strokeStyle = "white";
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();

        // update image data
        const imageData = context.getImageData(0, 0, this.width, this.height);
        this.data = new Uint8Array(imageData.data);

        // trigger repaint for animation
        if (map && map.Renderer && map.Renderer.triggerRepaint) {
          map.Renderer.triggerRepaint();
        }

        return true;
      },
    };
  };

  const initializeMap = () => {
    if (!window.longdo) {
      console.log("⚠️ Longdo API not loaded yet, retrying...");
      setTimeout(initializeMap, 500);
      return;
    }

    try {
      console.log("🗺️ Initializing Longdo Map with Routing...");

      const mapElement = document.getElementById("longdo-map");
      if (!mapElement) {
        console.error("❌ Map element not found");
        return;
      }

      const data = jobView ;

      if (!data) {
        console.log("⚠️ No data available for map");
        return;
      }

      // แปลง coordinates
      let originLatlng, destLatlng, currentLatlng;
      if (data) {
        originLatlng = data.latlng_recive;
        destLatlng = data.latlng_deliver;
        currentLatlng = data.driver_info.latlng_current;
      } else {
        return
      }

      const originCoords = parseLatLng(originLatlng) || { lat: 13.7563, lon: 100.5018 }; // กรุงเทพฯ
      const destCoords = parseLatLng(destLatlng) || { lat: 13.7563, lon: 100.5018 }; // กรุงเทพฯ
      const currentCoords = parseLatLng(currentLatlng) || { lat: 13.7563, lon: 100.5018 }; // กรุงเทพฯ

      // สร้างแผนที่
      const map = new window.longdo.Map({
        placeholder: mapElement,
        language: "th",
        lastView: false,
        zoom: 7,
      });

      console.log("✅ Map created successfully");

      // ====== ตั้งค่า Event Listener สำหรับ Routing ======
      map.Event.bind("ready", function () {
         map.Layers.insert(1, window.longdo.Layers.TRAFFIC);
         map.Ui.Geolocation.visible(false);

        try {
          // สร้าง Route Placeholder (div สำหรับแสดงผลเส้นทาง)
          const routeResultDiv = document.createElement("div");
          routeResultDiv.id = "route-result";
          routeResultDiv.style.display = "none";
          document.body.appendChild(routeResultDiv);

          // ตั้งค่า Route placeholder
          if (map.Route && map.Route.placeholder) {
            map.Route.placeholder(routeResultDiv);
          }

          // ====== สร้าง Pulsing Dot สำหรับตำแหน่งปัจจุบัน ======
          if (map.Renderer && map.Renderer.addImage) {
            const bluePulsingDot = createPulsingDot("blue", 100);

            // เพิ่ม Pulsing Dot image
            map.Renderer.addImage("pulsing-dot-blue", bluePulsingDot, {
              pixelRatio: 2,
            });

            // สร้าง GeoJSON source สำหรับตำแหน่งปัจจุบัน
            map.Renderer.addSource("current-location", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: [currentCoords.lon, currentCoords.lat],
                    },
                    properties: {
                      title: "🚛 ตำแหน่งปัจจุบัน",
                      description: `สถานะ: ${
                        jobView?.status 
                      }`,
                    },
                  },
                ],
              },
            });

            // เพิ่ม Layer สำหรับ Pulsing Dot
            map.Renderer.addLayer({
              id: "current-location-pulse",
              type: "symbol",
              source: "current-location",
              layout: {
                "icon-image": "pulsing-dot-blue",
              },
            });

            console.log("✅ Pulsing dot added successfully");
          } else {
            console.warn(
              "⚠️ Renderer not available, using regular marker for current location"
            );

            // Fallback: ใช้ Marker ธรรมดาสำหรับตำแหน่งปัจจุบัน
            const currentMarker = new window.longdo.Marker(currentCoords, {
              title: "🚛 ตำแหน่งปัจจุบัน",
              detail: `สถานะ: ${jobView?.status }`,
              icon: {
                url: "https://img.icons8.com/color/48/000000/truck.png",
                size: { width: 45, height: 45 },
                anchor: { x: 22, y: 45 },
              },
            });
            map.Overlays.add(currentMarker);
          }

          // ====== สร้าง Timeline markers จาก ticket_info ======
          const timelineDetails = createTimelineMarkers(map, data, originCoords, destCoords);

          // ====== สร้าง Markers อื่นๆ ======
          // Marker ต้นทาง - ใช้ icon สีเขียว
          if(originCoords.lat === 13.7563 && originCoords.lon === 100.5018 && destCoords.lat === 13.7563 && destCoords.lon === 100.5018) {
            return;
          }
          const originDetailText = jobView
            ? (jobView as any).locat_recive || "ต้นทาง"
            : "unknown origin";
          
          const fullOriginDetail =
            timelineDetails.originDetails.length > 0
            ? `${originDetailText}<br>📄 Timeline:<ul><li>${timelineDetails.originDetails.join('</li><li>')}</li></ul>`
            : originDetailText;


            const originMarker = new window.longdo.Marker(originCoords, {
              title: "🚩 จุดต้นทาง",
              detail: fullOriginDetail,
              icon: {
                url: "https://img.icons8.com/ultraviolet/48/000000/marker.png",
                size: { width: 40, height: 40 },
                anchor: { x: 20, y: 40 },
              },
            });

          // Marker ปลายทาง - ใช้ icon สีแดง
          const destDetailText = jobView
            ? (jobView as any).locat_deliver || "ปลายทาง"
            : "unknown destination";
          
          const fullDestDetail = timelineDetails.destDetails.length > 0
            ? `${destDetailText}<br>📄 Timeline:<ul><li>${timelineDetails.destDetails.join('</li><li>')}</li></ul>`
            : destDetailText;

          const destMarker = new window.longdo.Marker(destCoords, {
            title: "🏁 จุดปลายทาง",
            detail: fullDestDetail,
            icon: {
              url: "https://img.icons8.com/color/48/000000/finish-flag.png",
              size: { width: 40, height: 40 },
              anchor: { x: 20, y: 40 },
            },
          });

          // เพิ่ม markers ลงแผนที่
          map.Overlays.add(originMarker);
          map.Overlays.add(destMarker);

          // ตรวจสอบว่า Route API พร้อมใช้งานหรือไม่
          if (map.Route && typeof map.Route.add === "function") {
            try {
              // เคลียร์ route เก่า
              if (typeof map.Route.clear === "function") {
                map.Route.clear();
              }
              // เพิ่มจุดเริ่มต้น (ต้นทาง)
              map.Route.add(originCoords);
              // เพิ่มจุดปลายทาง
              map.Route.add(destCoords);

              // ====== Event Listener สำหรับ Route (ถ้ามี) ======
              if (
                map.Route.Event &&
                typeof map.Route.Event.bind === "function"
              ) {
                map.Route.Event.bind("result", function (data: any) {
                  console.log("✅ Route found successfully:", data);

                  if (data && data.length > 0) {
                    const route = data[0];
                    const distanceKm = route.distance / 1000; // แปลงจากเมตรเป็นกิโลเมตร
                    const timeMinutes = Math.round(route.time / 60); // แปลงจากวินาทีเป็นนาที

                    console.log(
                      `📏 Route distance: ${distanceKm.toFixed(1)} km`
                    );
                    console.log(`⏱️ Estimated time: ${timeMinutes} minutes`);

                    // คำนวณระยะทางตามสถานะ
                    const currentStatus = jobView?.status
                    let distanceLabel = `ระยะทางรวม: ${distanceKm.toFixed(
                      1
                    )} กม. (${timeMinutes} นาที)`;

                    if (currentStatus === "รับงาน") {
                      const distanceToOrigin = calculateDistance(
                        currentCoords.lat,
                        currentCoords.lon,
                        originCoords.lat,
                        originCoords.lon
                      ) / 1000; // แปลงเป็น km
                      distanceLabel = `ระยะทางไปต้นทาง: ${distanceToOrigin.toFixed(
                        1
                      )} กม. | เส้นทางรวม: ${distanceKm.toFixed(1)} กม.`;
                    } else if (currentStatus === "เริ่มขนส่ง") {
                      const distanceToDest = calculateDistance(
                        currentCoords.lat,
                        currentCoords.lon,
                        destCoords.lat,
                        destCoords.lon
                      ) / 1000; // แปลงเป็น km
                      distanceLabel = `ระยะทางไปปลายทาง: ${distanceToDest.toFixed(
                        1
                      )} กม. | เส้นทางรวม: ${distanceKm.toFixed(1)} กม.`;
                    }

                    setDistance(distanceLabel);
                  }
                });

                map.Route.Event.bind("error", function (error: any) {
                  console.error("❌ Route search failed:", error);
                  // Fallback: ใช้เส้นตรง
                  createFallbackRoute();
                });

                // ค้นหาเส้นทาง
                map.Route.search();
              } else {
                console.warn(
                  "⚠️ Route Event binding not available, using fallback"
                );
                // createFallbackRoute();
              }
            } catch (routeError) {
              console.error("❌ Route API error:", routeError);
              createFallbackRoute();
            }
          } else {
            console.warn("⚠️ Route API not available, using fallback");
            createFallbackRoute();
          }

          // ฟังก์ชัน Fallback สำหรับเส้นทาง
          function createFallbackRoute() {
            console.log("📍 Creating fallback route...");

            // สร้างเส้นทางแสดงบนแผนที่
            const routeLine = new window.longdo.Polyline(
              [originCoords, destCoords],
              {
                lineColor: "#F59E0B", // สีส้ม
                lineWidth: 4,
                lineOpacity: 0.8,
                title: "เส้นทางการขนส่ง",
              }
            );

            // เพิ่มเส้นทางลงแผนที่
            map.Overlays.add(routeLine);

            // คำนวณระยะทางโดยตรง
            const distanceKm = calculateDistance(
              originCoords.lat,
              originCoords.lon,
              destCoords.lat,
              destCoords.lon
            ) / 1000; // แปลงเป็น km

            const currentStatus = jobView?.status 
            let distanceLabel = `ระยะทางโดยตรง: ${distanceKm.toFixed(1)} กม.`;

            if (currentStatus === "รับงาน") {
              const distanceToOrigin = calculateDistance(
                currentCoords.lat,
                currentCoords.lon,
                originCoords.lat,
                originCoords.lon
              ) / 1000; // แปลงเป็น km
              distanceLabel = `ไปต้นทาง: ${distanceToOrigin.toFixed(
                1
              )} กม. | รวม: ${distanceKm.toFixed(1)} กม.`;
            } else if (currentStatus === "เริ่มขนส่ง") {
              const distanceToDest = calculateDistance(
                currentCoords.lat,
                currentCoords.lon,
                destCoords.lat,
                destCoords.lon
              ) / 1000; // แปลงเป็น km
              distanceLabel = `ไปปลายทาง: ${distanceToDest.toFixed(
                1
              )} กม. | รวม: ${distanceKm.toFixed(1)} กม.`;
            }

            setDistance(distanceLabel);
            console.log("✅ Fallback route created with polyline");
          }

          // ====== ปรับ view ให้เห็นทุกจุด ======
          try {
            const bounds = [originCoords, destCoords, currentCoords];
            const minLon = Math.min(...bounds.map((p) => p.lon)) - 0.02;
            const maxLon = Math.max(...bounds.map((p) => p.lon)) + 0.02;
            const minLat = Math.min(...bounds.map((p) => p.lat)) - 0.02;
            const maxLat = Math.max(...bounds.map((p) => p.lat)) + 0.02;

            // ใช้ timeout เล็กน้อยเพื่อให้ markers โหลดเสร็จก่อน
            setTimeout(() => {
              map.bound({ minLon, maxLon, minLat, maxLat });
              console.log("✅ Map bounds set successfully", {
                minLon,
                maxLon,
                minLat,
                maxLat,
              });
            }, 500);
          } catch (boundError) {
            console.error("❌ Error setting bounds:", boundError);
            // Fallback: center on origin with appropriate zoom
            setTimeout(() => {
              map.location(originCoords, true);
              map.zoom(10, true);
            }, 500);
          }
        } catch (routingError) {
          console.error("❌ Error setting up routing:", routingError);
        }
      });

      setMapLoaded(true);
      console.log("🎉 Longdo Map with Routing initialized successfully!");
    } catch (error) {
      console.error("❌ Error initializing Longdo Map:", error);
      setMapLoaded(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-5/6 relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">แผนที่ติดตามงานขนส่ง</h2>
                <p className="text-emerald-100 text-sm">
                  Powered by Longdo Map API
                </p>
              </div>
            </div>
            <button
              onClick={() => closeModal(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="ปิด"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div
          className="relative flex-1 p-5"
          style={{ height: "calc(100% - 160px)" }}
        >
          <div
            id="longdo-map"
            className="w-full h-full"
            style={{
              minHeight: "400px",
              height: "100%",
              position: "relative",
            }}
          />

          {/* Map Legend */}
          <div className="absolute bottom-20 left-6 bg-indigo-50 bg-opacity-75 border-indigo-300 rounded-lg shadow-lg p-3 border-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              สัญลักษณ์บนแผนที่
            </h4>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-white">
                  🚩
                </div>
                <span>จุดต้นทาง (รับสินค้า)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-white">
                  🏁
                </div>
                <span>จุดปลายทาง (ส่งสินค้า)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white animate-pulse">
                  🚛
                </div>
                <span>ตำแหน่งปัจจุบัน</span>
              </div>
              <div className="border-t border-gray-300 mt-2 pt-2">
                <div className="text-xs font-medium text-gray-600 mb-1">Timeline Events:</div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="flex items-center gap-1">
                    <img src="https://img.icons8.com/softteal-color/24/alarm-clock.png" alt="เริ่มงาน" />
                    <span className="text-xs">Timestamp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Distance Info */}
          {distance && (
            <div className="absolute top-6 left-20 bg-white bg-opacity-95 rounded-lg shadow-lg p-3 border">
              <div className="text-sm font-medium text-gray-700">
                🚚 สรุปข้อมูล
              </div>
              <div className="text-xs text-gray-600 mt-1">{distance}</div>
            </div>
          )}

          {/* Loading Overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg font-medium">
                  กำลังโหลดแผนที่...
                </p>
                <p className="text-gray-500 text-sm mt-1">Longdo Map API</p>
                <p className="text-gray-400 text-xs mt-2">
                  {jobView ? `Data: ${jobView.load_id}` : "Using unknown data"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
