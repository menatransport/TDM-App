"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight,
  Check,
  MapPin,
} from "lucide-react";
import { useUserStore , useListName } from "@/lib/userStore";


export const Logincomponent = () => {
  const { setLoginData, setCredentials, username: storedUsername, password: storedPassword, isRemembered } = useUserStore()
  const { setListname: storeListname } = useListName();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gpsPermission, setGpsPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [currentLocation, setCurrentLocation] = useState<{latlng_current: string} | null>(null);
  const [gpsError, setGpsError] = useState(""); 
  
  const [listname, setListname] = useState<string[]>([]);


  const router = useRouter();
  const requestGPSPermission = () => {
    return new Promise<{lat: number, lng: number}>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation ไม่รองรับในเบราว์เซอร์นี้'));
        return "denied";
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 
      };

      setGpsError("");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setCurrentLocation({latlng_current: `${coords.lat},${coords.lng}`});
          setGpsPermission('granted');
          // setIsLoading(false);
          resolve(coords);
        },
        (error) => {
          console.error('❌ GPS Error:', error);
          let errorMessage = '';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'การอนุญาตใช้ตำแหน่งถูกปฏิเสธ กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์';
              setGpsPermission('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบการเชื่อมต่อ GPS';
              break;
            case error.TIMEOUT:
              errorMessage = 'การขอตำแหน่งใช้เวลานานเกินไป กรุณาลองใหม่';
              break;
            default:
              errorMessage = 'เกิดข้อผิดพลาดในการขอตำแหน่ง';
              break;
          }
          
          setGpsError(errorMessage);
          setIsLoading(false);
          reject(new Error(errorMessage));
        },
        options
      );
    });
  };

  // useEffect(() => {
  //   const checkGPSStatus = async () => {
  //     try {
  //       if (!navigator.geolocation) {
  //         setGpsPermission('denied');
  //         return;
  //       }

  //       if ('permissions' in navigator) {
  //         const permission = await navigator.permissions.query({name: 'geolocation'});
          
  //         if (permission.state === 'granted') {
  //           // ถ้ามี permission แล้ว ให้ขอ location เลย
  //           try {
  //             // await requestGPSPermission();
  //           } catch (error) {
  //             console.log('GPS permission granted but failed to get location');
  //           }
  //         } else if (permission.state === 'denied') {
  //           setGpsPermission('denied');
  //           setGpsError('การใช้ตำแหน่งถูกปฏิเสธ กรุณาเปิดการอนุญาตในการตั้งค่าเบราว์เซอร์');
  //         }
  //       }
  //     } catch (error) {
  //       console.log('Permission API not supported, will request on login');
  //     }
  //   };
  //   // requestGPSPermission();
  //   checkGPSStatus();
  // }, []);

  const local_remember = () => {
    if (typeof window !== "undefined") {
      if (isChecked) {
        localStorage.setItem("user", username);
        localStorage.setItem("pass", password);
        localStorage.setItem("checked", "true");
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("pass");
        localStorage.removeItem("checked");
      }
    }
  };

useEffect(() => {
  const fetchLogin = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.USER_XAPI || "", 
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const usernames = data.users.map((user: { username: string }) => user.username);
      setListname(usernames)
      storeListname(usernames)
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  fetchLogin();
}, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const rememberedUser = localStorage.getItem("user") || "";
      const rememberedPass = localStorage.getItem("pass") || "";
      const rememberedCheck = localStorage.getItem("checked") === "true";

      setUsername(rememberedUser);
      setPassword(rememberedPass);
      setIsChecked(rememberedCheck);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const filteredNames = useMemo(() => {
    if (username.length < 3) return [];
    
    return listname.filter(name => 
      name.toLowerCase().includes(username.toLowerCase())
    );
  }, [username]);

    const handleUsernameChange = (e:any) => {
    const value = e.target.value;
    setUsername(value);
    setShowSuggestions(value.length >= 3);
    if (error) setError(''); 
  };

  const handleNameSelect = (name:string) => {
    setUsername(name);
    setShowSuggestions(false);
  };

  const handleUsernameFocus = () => {
    if (username.length >= 3) {
      setShowSuggestions(true);
    }
  };

  const handleUsernameBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    setGpsError("");

    try {
      if (username === "" || password === "") {
        setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'latlng-current': currentLocation ? currentLocation.latlng_current : "",
        },
        body: JSON.stringify({ 
          username, 
          password,
        }),
      });
      
      const data = await res.json();

      if (data.access_token) {
        if (data.role === 'user') {
          if (!currentLocation || gpsPermission !== 'granted') {
            try {
              setIsLoading(true);
              const result_gps = await requestGPSPermission();
              
              if (!result_gps.lat || !result_gps.lng) {
                setError('ไม่สามารถรับตำแหน่ง GPS ได้ กรุณาเปิดใช้งาน GPS และลองใหม่อีกครั้ง');
                setIsLoading(false);
                return;
              }
            } catch (error) {
              console.error('Failed to get GPS during login:', error);
              setError('จำเป็นต้องเปิด GPS เพื่อเข้าสู่ระบบสำหรับผู้ใช้งาน');
              setIsLoading(false);
              return;
            }
          }
        }

        localStorage.setItem('userLocation', JSON.stringify(currentLocation));
        localStorage.setItem('locationTimestamp', new Date().toISOString());
        
        setLoginData({
          username,
          password,
          jwtToken: data.jwtToken,
          accessToken: data.access_token,
          role: data.role,
          remember: isChecked
        });
        
        local_remember();
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("jwtToken", data.jwtToken);
        localStorage.setItem("access_token", data.access_token);
        
        // Redirect ตาม role
        if(data.role === 'user') return router.push("/job");
        if(data.role === 'admin') return router.push("/admin");
      } else {
        setError(data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ :" + err);
      setIsLoading(false);
      return;
    } finally {
      setIsLoading(false);
    }
  };


return (
<div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200 bg-opacity-30 rounded-full animate-pulse"></div>
        <div
          className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200 bg-opacity-20 rounded-full animate-bounce"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300 bg-opacity-25 rounded-full animate-ping"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300 bg-opacity-30 rounded-full animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      <div
        className={`w-full max-w-md transform transition-all duration-1000 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="text-center mb-2">
          <div
            className={`inline-flex items-center justify-center w-50 h-25 bg-gradient-to-br from-white-400 to-white-500 rounded-2xl mb-4  transform transition-all duration-700 ease-out ${
              isVisible ? "scale-100 rotate-0" : "scale-0 rotate-45"
            }`}
          >
            <img src="/mena.png" alt="Logo" className="w-40 h-25" />
          </div>
          <h1
            className={`text-2xl font-bold text-gray-800 mb-1 transform transition-all duration-700 ease-out delay-200 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            ระบบติดตามสถานะขนส่ง 
          </h1>
          <p
            className={`text-gray-500 text-sm transform transition-all duration-700 ease-out delay-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            Mena FastTrack
          </p>
        </div>


        <div
          className={`bg-white rounded-3xl shadow-xl p-5 backdrop-blur-sm bg-opacity-95 transform transition-all duration-700 ease-out delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="text-center mb-3">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              เข้าสู่ระบบ
            </h2>
          </div>

         
          <div className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-green-500">
                <User className="h-5 w-5 text-gray-400 group-focus-within:text-green-500" />
              </div>
              <input
                type="text"
                placeholder="ชื่อผู้ใช้ (พิมพ์อย่างน้อย 3 ตัวอักษร)"
                value={username}
                onChange={handleUsernameChange}
                  onFocus={handleUsernameFocus}
                  onBlur={handleUsernameBlur}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400"
              />
            </div>

            
              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute m-4 top-28 left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-10 max-h-40 overflow-y-auto">
                  {filteredNames.length > 0 ? (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                        พบ {filteredNames.length} รายการ
                      </div>
                      {filteredNames.map((name, index) => (
                        <div
                          key={index}
                          onClick={() => handleNameSelect(name)}
                          className="px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors duration-150 flex items-center space-x-3 border-b border-gray-50 last:border-b-0"
                        >
                          <User className="h-4 w-4 text-green-500" />
                          <span className="text-gray-800">{name}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500">
                      <p>ไม่พบชื่อที่ตรงกับการค้นหา</p>
                      <p className="text-sm text-gray-400 mt-1">"{username}"</p>
                    </div>
                  )}
                </div>
              )}

               {/* Search status info */}
              {username.length > 0 && username.length < 3 && (
                <div className="mt-1 text-xs text-orange-500">
                  พิมพ์อีก {3 - username.length} ตัวอักษรเพื่อค้นหา
                </div>
              )}
              
         

            {/* Password field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-green-500">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-500 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Remember me */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 mt-3 pl-3 flex items-center transition-colors duration-200 group-focus-within:text-green-500">
                <div
                  onClick={() => setIsChecked(!isChecked)}
                  className={`relative w-5 h-5 rounded-md border-2 cursor-pointer transition-all duration-200 ${
                    isChecked
                      ? "bg-green-500 border-green-500"
                      : "bg-white border-gray-300 hover:border-green-400"
                  }`}
                >
                  <Check
                    className={`w-3 h-3 text-white absolute top-0.5 left-0.5 transform transition-all duration-200 ${
                      isChecked ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}
                  />
                </div>
                <label
                  onClick={() => setIsChecked(!isChecked)}
                  className="text-sm ml-3 text-gray-600 cursor-pointer select-none hover:text-green-600 transition-colors duration-200"
                >
                  จดจำเข้าใช้งาน
                </label>
              </div>
            </div>

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={isLoading || gpsPermission === 'denied'}
              className={`w-full mt-10 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group ${
                (gpsPermission === 'granted' && currentLocation) || gpsPermission === 'pending'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
              }`}
            >
              <div className="flex items-center justify-center">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {gpsPermission === 'pending' || !currentLocation? 'กำลังขอ GPS...' : 'กำลังเข้าสู่ระบบ...'}
                  </>
                ) : gpsPermission === 'denied' ? (
                  <>
                    จำเป็นต้องเปิด GPS
                  </>
                ) : (
                  <>
                    เข้าสู่ระบบ
                    <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </div>
            </button>

            {/* GPS requirement note */}
            <div className="mt-2">
              {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg transform animate-pulse">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* GPS Error message */}
          {gpsError && (
            <div className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
              <p className="text-orange-700 text-sm font-medium">🌍 GPS Required</p>
              <p className="text-orange-600 text-sm mt-1">{gpsError}</p>
              {gpsPermission === 'denied' && (
                <button
                  onClick={requestGPSPermission}
                  className="mt-2 text-xs bg-orange-500 text-white px-3 py-1 rounded-md hover:bg-orange-600 transition-colors"
                >
                  ลองขอ GPS อีกครั้ง
                </button>
              )}
            </div>
          )}

{/* GPS Status Display */}
{gpsPermission === 'granted' && (
  <div className="mb-4 p-3 rounded-lg border border-gray-200 bg-green-50">
    <div className="flex items-start space-x-2">
      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
      <span className="text-sm font-medium text-green-700">
        สถานะ GPS: เชื่อมต่อแล้ว 
      </span>
    </div>
    {currentLocation && (
      <div className="mt-2 text-xs text-gray-500">
        📍 Lat: {currentLocation.latlng_current.split(",")[0]}, Lng: {currentLocation.latlng_current.split(",")[1]}
      </div>
    )}
  </div>
)}

{gpsPermission === 'pending' && !currentLocation && (
  <div className="hidden mb-4 p-3 rounded-lg border border-gray-200 bg-blue-50">
    {/* <div className="flex items-center space-x-2 mb-2">
      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm text-blue-700">กำลังตรวจสอบ GPS...</span>
    </div> */}
    <button
      onClick={requestGPSPermission}
      disabled={isLoading}
      className="w-full text-sm bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
    >
       เปิดใช้งาน GPS
    </button>
  </div>
)}
            </div>

            {/* Forgot password */}
            {/* <div className="text-center">
              <button className="text-sm text-gray-500 hover:text-green-600 transition-colors duration-200 hover:underline">
                ลืมรหัสผ่าน?
              </button>
            </div> */}
          </div>

          {/* Demo credentials */}
          <div className="hidden mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-sm text-green-800 font-medium mb-2">
              ข้อมูลสำหรับทดสอบ:
            </p>
            <div className="text-xs space-y-1">
              <p className="text-green-700 flex items-center">
                <span className="w-16">ชื่อผู้ใช้:</span>
                <code className="bg-green-100 px-2 py-1 rounded text-green-800">
                  ชื่อจริง
                </code>
              </p>
              <p className="text-green-700 flex items-center">
                <span className="w-16">รหัสผ่าน:</span>
                <code className="bg-green-100 px-2 py-1 rounded text-green-800">
                  1234 (ใช้สำหรับทดสอบก่อน UAT)
                </code>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`text-center mt-6 text-gray-500 text-sm transform transition-all duration-700 ease-out delay-600 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <p className="font-semibold" >Version 3.6.1</p>
          <p>© 2025 MENA TRANSPORT PUBLIC.CO.,LTD</p>
        </div>
      </div>
    </div>
    );
}