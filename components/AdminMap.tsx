"use client";
import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
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
    origin_latlng: "14.032724166617289, 100.8945183647243",
    destination: "Makro บางนา",
    destination_latlng: "13.595060174396597, 100.79556850955248",
    current_latlng: "13.614195122768754, 100.75269703909746", // ปัจจุบัน
    // Timeline data
    ticketdata: [
      {
        start_datetime: "16/9/2025, 14:33:00",
        start_latlng: "14.032724166617289, 100.8945183647243",
        origin_datetime: "16/9/2025, 14:33:00",
        origin_latlng: "14.032724166617289, 100.8945183647243",
        start_recive_datetime: "16/9/2025, 14:33:00",
        start_recive_latlng: "14.032724166617289, 100.8945183647243",
        end_recive_datetime: "16/9/2025, 14:33:00",
        end_recive_latlng: "14.032724166617289, 100.8945183647243",
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
    script.src ="https://api.longdo.com/map3/?key=657049216c4c370977197048c841a727";
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
    const [lat, lng] = latlngStr.split(',').map(s => parseFloat(s.trim()));
    return { lat, lon: lng };
  };

  // ฟังก์ชันคำนวณระยะทาง (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // รัศมีของโลกในกิโลเมตร
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // ฟังก์ชันสร้าง Pulsing Dot (สำหรับใช้งานง่าย)
  const createPulsingDot = (color: string = 'blue', size: number = 200) => {
    const colors: { [key: string]: { inner: string; outer: string } } = {
      blue: { inner: 'rgba(59, 130, 246, 1)', outer: 'rgba(59, 130, 246,' },
      red: { inner: 'rgba(239, 68, 68, 1)', outer: 'rgba(239, 68, 68,' },
      green: { inner: 'rgba(34, 197, 94, 1)', outer: 'rgba(34, 197, 94,' },
      orange: { inner: 'rgba(249, 115, 22, 1)', outer: 'rgba(249, 115, 22,' },
      purple: { inner: 'rgba(168, 85, 247, 1)', outer: 'rgba(168, 85, 247,' },
    };

    const selectedColor = colors[color] || colors.blue;

    return {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),
      context: null as CanvasRenderingContext2D | null,

      onAdd: function () {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.context = canvas.getContext('2d');
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
        context.fillStyle = selectedColor.outer + (1 - t) + ')';
        context.fill();

        // draw inner circle (solid)
        context.beginPath();
        context.arc(
          this.width / 2,
          this.height / 2,
          radius,
          0,
          Math.PI * 2
        );
        context.fillStyle = selectedColor.inner;
        context.strokeStyle = 'white';
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
      }
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

      // ใช้ข้อมูล MockData
      const data = jobView || MockData[0];
      
      if (!data) {
        console.log("⚠️ No data available for map");
        return;
      }

      console.log("📊 Map data:", data);

      // แปลง coordinates
      let originLatlng, destLatlng, currentLatlng;
      
      if (jobView) {
        // สำหรับข้อมูลจริงจาก database - ใช้ MockData เป็น fallback
        originLatlng = MockData[0].origin_latlng;
        destLatlng = MockData[0].destination_latlng;
        currentLatlng = MockData[0].current_latlng;
      } else {
        // สำหรับ MockData
        const mockData = data as typeof MockData[0];
        originLatlng = mockData.origin_latlng;
        destLatlng = mockData.destination_latlng;
        currentLatlng = mockData.current_latlng;
      }
      
      const originCoords = parseLatLng(originLatlng);
      const destCoords = parseLatLng(destLatlng);
      const currentCoords = parseLatLng(currentLatlng);

      console.log("📍 Coordinates:", { originCoords, destCoords, currentCoords });

      // สร้างแผนที่
      const map = new window.longdo.Map({
        placeholder: mapElement,
        language: "th",
        lastView: false,
        zoom: 7
      });

      console.log("✅ Map created successfully");

      // ====== ตั้งค่า Event Listener สำหรับ Routing ======
      map.Event.bind("ready", function () {
        console.log("🗺️ Map ready, setting up pulsing dot and routing...");

        try {
          // สร้าง Route Placeholder (div สำหรับแสดงผลเส้นทาง)
          const routeResultDiv = document.createElement('div');
          routeResultDiv.id = 'route-result';
          routeResultDiv.style.display = 'none';
          document.body.appendChild(routeResultDiv);

          // ตั้งค่า Route placeholder
          if (map.Route && map.Route.placeholder) {
            map.Route.placeholder(routeResultDiv);
          }
          
          // ====== สร้าง Pulsing Dot สำหรับตำแหน่งปัจจุบัน ======
          if (map.Renderer && map.Renderer.addImage) {
            const bluePulsingDot = createPulsingDot('blue', 100);
            
            // เพิ่ม Pulsing Dot image
            map.Renderer.addImage('pulsing-dot-blue', bluePulsingDot, { pixelRatio: 2 });
            
            // สร้าง GeoJSON source สำหรับตำแหน่งปัจจุบัน
            map.Renderer.addSource('current-location', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [currentCoords.lon, currentCoords.lat]
                    },
                    properties: {
                      title: "🚛 ตำแหน่งปัจจุบัน",
                      description: `สถานะ: ${jobView?.status || MockData[0].status}`
                    }
                  }
                ]
              }
            });
            
            // เพิ่ม Layer สำหรับ Pulsing Dot
            map.Renderer.addLayer({
              id: 'current-location-pulse',
              type: 'symbol',
              source: 'current-location',
              layout: {
                'icon-image': 'pulsing-dot-blue'
              }
            });
            
            console.log("✅ Pulsing dot added successfully");
          } else {
            console.warn("⚠️ Renderer not available, using regular marker for current location");
          }
          
          // ====== สร้าง Markers อื่นๆ ======
          // Marker ต้นทาง
          const originMarker = new window.longdo.Marker(originCoords, {
            title: "� ต้นทาง",
            detail: jobView ? (jobView as any).locat_recive || "ต้นทาง" : MockData[0].origin,
          });

          // Marker ปลายทาง  
          const destMarker = new window.longdo.Marker(destCoords, {
            title: "🎯 ปลายทาง",
            detail: jobView ? (jobView as any).locat_deliver || "ปลายทาง" : MockData[0].destination,
          });

          // เพิ่ม Markers ลงแผนที่ (ไม่รวม current marker เพราะใช้ pulsing dot แล้ว)
          map.Overlays.add(originMarker);
          map.Overlays.add(destMarker);

          
          // ตรวจสอบว่า Route API พร้อมใช้งานหรือไม่
          if (map.Route && typeof map.Route.add === 'function') {
            try {
              // เคลียร์ route เก่า
              if (typeof map.Route.clear === 'function') {
                map.Route.clear();
              }
              // เพิ่มจุดเริ่มต้น (ต้นทาง)
              map.Route.add(originCoords);
              // เพิ่มจุดปลายทาง
              map.Route.add(destCoords);
              

              // ====== Event Listener สำหรับ Route (ถ้ามี) ======
              if (map.Route.Event && typeof map.Route.Event.bind === 'function') {
                
                map.Route.Event.bind('result', function(data: any) {
                  console.log("✅ Route found successfully:", data);
                  
                  if (data && data.length > 0) {
                    const route = data[0];
                    const distanceKm = route.distance / 1000; // แปลงจากเมตรเป็นกิโลเมตร
                    const timeMinutes = Math.round(route.time / 60); // แปลงจากวินาทีเป็นนาที
                    
                    console.log(`📏 Route distance: ${distanceKm.toFixed(1)} km`);
                    console.log(`⏱️ Estimated time: ${timeMinutes} minutes`);
                    
                    // คำนวณระยะทางตามสถานะ
                    const currentStatus = jobView?.status || MockData[0].status;
                    let distanceLabel = `ระยะทางรวม: ${distanceKm.toFixed(1)} กม. (${timeMinutes} นาที)`;
                    
                    if (currentStatus === "รับงาน") {
                      const distanceToOrigin = calculateDistance(
                        currentCoords.lat, currentCoords.lon,
                        originCoords.lat, originCoords.lon
                      );
                      distanceLabel = `ระยะทางไปต้นทาง: ${distanceToOrigin.toFixed(1)} กม. | เส้นทางรวม: ${distanceKm.toFixed(1)} กม.`;
                    } else if (currentStatus === "เริ่มขนส่ง") {
                      const distanceToDest = calculateDistance(
                        currentCoords.lat, currentCoords.lon,
                        destCoords.lat, destCoords.lon
                      );
                      distanceLabel = `ระยะทางไปปลายทาง: ${distanceToDest.toFixed(1)} กม. | เส้นทางรวม: ${distanceKm.toFixed(1)} กม.`;
                    }
                    
                    setDistance(distanceLabel);
                  }
                });

                map.Route.Event.bind('error', function(error: any) {
                  console.error("❌ Route search failed:", error);
                  // Fallback: ใช้เส้นตรง
                  createFallbackRoute();
                });

                // ค้นหาเส้นทาง
                map.Route.search();
                
              } else {
                console.warn("⚠️ Route Event binding not available, using fallback");
                createFallbackRoute();
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
            
            // สร้างเส้นตรง
            // const routeLine = new window.longdo.Polyline([originCoords, destCoords], {
            //   lineColor: '#F59E0B',
            //   lineWidth: 4,
            //   lineOpacity: 0.8
            // });
            // map.Overlays.add(routeLine);
            
            // คำนวณระยะทางโดยตรง

            const distanceKm = calculateDistance(
              originCoords.lat, originCoords.lon,
              destCoords.lat, destCoords.lon
            );
            
            const currentStatus = jobView?.status || MockData[0].status;
            let distanceLabel = `ระยะทางโดยตรง: ${distanceKm.toFixed(1)} กม.`;
            
            if (currentStatus === "รับงาน") {
              const distanceToOrigin = calculateDistance(
                currentCoords.lat, currentCoords.lon,
                originCoords.lat, originCoords.lon
              );
              distanceLabel = `ไปต้นทาง: ${distanceToOrigin.toFixed(1)} กม. | รวม: ${distanceKm.toFixed(1)} กม.`;
            } else if (currentStatus === "เริ่มขนส่ง") {
              const distanceToDest = calculateDistance(
                currentCoords.lat, currentCoords.lon,
                destCoords.lat, destCoords.lon
              );
              distanceLabel = `ไปปลายทาง: ${distanceToDest.toFixed(1)} กม. | รวม: ${distanceKm.toFixed(1)} กม.`;
            }
            
            setDistance(distanceLabel);
          }

          // ====== ปรับ view ให้เห็นทุกจุด ======
          try {
            const bounds = [originCoords, destCoords, currentCoords];
            const minLon = Math.min(...bounds.map(p => p.lon)) - 0.01;
            const maxLon = Math.max(...bounds.map(p => p.lon)) + 0.01;
            const minLat = Math.min(...bounds.map(p => p.lat)) - 0.01;
            const maxLat = Math.max(...bounds.map(p => p.lat)) + 0.01;

            map.bound({ minLon, maxLon, minLat, maxLat });
            
            console.log("✅ Map bounds set successfully");
          } catch (boundError) {
            console.error("❌ Error setting bounds:", boundError);
            // Fallback: center on origin
            map.location(originCoords, true);
            map.zoom(12, true);
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
          style={{ height: "calc(100% - 120px)" }}
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

          {/* Loading Overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg font-medium">กำลังโหลดแผนที่...</p>
                <p className="text-gray-500 text-sm mt-1">Longdo Map API</p>
                <p className="text-gray-400 text-xs mt-2">
                  {jobView ? `Data: ${jobView.load_id}` : "Using MockData"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------ Other Files ------------------
