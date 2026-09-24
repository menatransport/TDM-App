"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IBM_Plex_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import { CarFront, Cctv, Check, ChevronDown, CirclePause, MapPin, Info, LogOut, Navigation2, Newspaper, Pencil, RefreshCw, Search, Settings2, SquareParking, Trash2, X, type LucideIcon } from "lucide-react";
import { useUserStore } from "@/lib/userStore";
import type { FleetVehicle } from "@/app/api/external-tracking/route";
import type { FleetDestination } from "@/app/api/external-tracking/destinations/shared";

declare global {
  interface Window {
    longdo: any;
  }
}

const plexThai = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"] });

const LONGDO_SRC = "https://api.longdo.com/map3/?key=657049216c4c370977197048c841a727";
const REFRESH_MS = 5 * 60 * 1000; // รีเฟรชรอบถัดไป = GPS ล่าสุด + 5 นาที
const RETRY_MS = 30_000; // ครบ 5 นาทีแล้วแต่ GPS ใหม่ยังไม่มา / โหลดพลาด → ลองใหม่ใน 30 วิ
const GPS_STALE_MS = 20 * 60 * 1000; // GPS ไม่อัปเดตเกิน 20 นาที = จอดนาน
const LONG_PARK_MS = 30 * 60 * 1000; // ไม่ขยับเกิน 30 นาที = จอดนาน
const MOVE_M = 50; // ขยับเกิน 50 ม. ระหว่างรอบ poll → อัปเดตทิศลูกศร
const AVERAGE_SPEED_KMH = 50; // ETA = ระยะทางตามเส้นทาง ÷ ความเร็วเฉลี่ยรถบรรทุก

// วิ่ง = status "วิ่ง" จาก backend, หยุด/จอดนาน = แยกจากเวลาที่ไม่ขยับ
type Status = "moving" | "stopped" | "parked";
const ST: Record<Status, { c: string; l: string }> = {
  moving: { c: "#12925a", l: "Moving" },
  stopped: { c: "#d9a406", l: "Stopped" },
  parked: { c: "#8a958f", l: "Parked" },
};

// ชั้นข้อมูลเสริมจาก Longdo: สภาพจราจร / ข่าวเหตุการณ์ / กล้อง CCTV (popup เล่นวิดีโอสดในตัว)
type MapLayer = "traffic" | "events" | "cameras";
const MAP_LAYERS: { k: MapLayer; icon: LucideIcon; tip: string }[] = [
  { k: "traffic", icon: CarFront, tip: "สภาพจราจร" },
  { k: "events", icon: Newspaper, tip: "ข่าวสาร / เหตุการณ์บนถนน" },
  { k: "cameras", icon: Cctv, tip: "กล้อง CCTV" },
];

type TrackedVehicle = FleetVehicle & { state: Status; bearing: number };
interface Track {
  lat: number;
  lng: number;
  stillSince: number;
  bearing: number;
}

const bearingOf = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const t = (x: number) => (x * Math.PI) / 180;
  const y = Math.sin(t(b.lng - a.lng)) * Math.cos(t(b.lat));
  const x = Math.cos(t(a.lat)) * Math.sin(t(b.lat)) - Math.sin(t(a.lat)) * Math.cos(t(b.lat)) * Math.cos(t(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};
const gpsTime = (v: FleetVehicle) => {
  const d = new Date(v.updatedAt);
  if (isNaN(d.getTime())) return "—";
  return d.toDateString() === new Date().toDateString()
    ? d.toTimeString().slice(0, 5)
    : d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};

const hav = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371, t = (x: number) => (x * Math.PI) / 180;
  const dLa = t(b.lat - a.lat), dLo = t(b.lng - a.lng);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const hhmm = (ms: number) => new Date(ms).toTimeString().slice(0, 5);
const fmtEta = (mins: number) => (mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const vehicleIcon = (v: TrackedVehicle, selected: boolean, font: string) => {
  const c = ST[v.state].c;
  if (!selected) {
    return {
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${c};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);box-sizing:border-box;cursor:pointer"></div>`,
    };
  }
  // ลูกศรตามทิศ (วิ่ง) / ขีดคู่ (หยุด) / P (จอดนาน) — ให้ตรงกับไอคอนในรายการ
  const glyph =
    v.state === "moving"
      ? `<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid #fff;margin-top:-2px;transform:rotate(${Math.round(v.bearing)}deg)"></div>`
      : v.state === "stopped"
        ? `<div style="display:flex;gap:3px"><span style="width:3px;height:10px;background:#fff;border-radius:1px"></span><span style="width:3px;height:10px;background:#fff;border-radius:1px"></span></div>`
        : `<span style="color:#fff;font:700 13px/1 ${font}">P</span>`;
  return {
    html: `<div style="position:relative;width:56px;height:56px;cursor:pointer">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(10,107,71,.22);animation:xt-pulse 2s ease-out infinite"></div>
      <div style="position:absolute;left:13px;top:13px;width:30px;height:30px;border-radius:50%;background:${c};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);box-sizing:border-box;display:flex;align-items:center;justify-content:center">${glyph}</div>
      <div style="position:absolute;left:50%;top:-22px;transform:translateX(-50%);white-space:nowrap;background:#0f1f17;color:#fff;font:600 11px ${font};padding:3px 8px;border-radius:5px">${esc(v.plate)}</div>
    </div>`,
  };
};

const destinationIcon = (d: FleetDestination, font: string) => ({
  html: `<div style="position:relative;width:24px;height:24px">
    <div style="position:absolute;left:3px;top:3px;width:18px;height:18px;background:#064d33;border:3px solid #fff;border-radius:4px;transform:rotate(45deg);box-sizing:border-box;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>
    <div style="position:absolute;left:30px;top:50%;transform:translateY(-50%);white-space:nowrap;background:#fff;color:#0f1f17;font:600 12px ${font};padding:4px 9px;border-radius:6px;box-shadow:0 2px 8px rgba(15,31,23,.18)">${esc(d.name)}</div>
  </div>`,
});

const distanceIcon = (km: number, font: string) => ({
  html: `<div style="white-space:nowrap;background:#0a6b47;color:#fff;font:600 12px ${font};padding:4px 10px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.25)">${km.toFixed(1)} km</div>`,
});

// นับถอยหลังถึงรอบรีเฟรชถัดไป — แยก component ให้ tick ทุกวิไม่ re-render ทั้งหน้า
// dropdown ปลายทางแบบพิมพ์ค้นหาได้ (เปิดขึ้นด้านบน เพราะอยู่ท้าย panel)
function DestinationPicker({ destinations, value, onChange }: { destinations: FleetDestination[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [hi, setHi] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = destinations.find((d) => d.id === value);

  const options = useMemo(() => {
    const t = text.trim().toLowerCase();
    return t ? destinations.filter((d) => d.name.toLowerCase().includes(t)) : destinations;
  }, [text, destinations]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    listRef.current?.children[hi]?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  const show = () => {
    setText("");
    setHi(Math.max(0, destinations.findIndex((d) => d.id === value)));
    setOpen(true);
  };
  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    inputRef.current?.blur();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") show();
      return;
    }
    if (e.key === "ArrowDown") setHi((i) => Math.min(i + 1, options.length - 1));
    else if (e.key === "ArrowUp") setHi((i) => Math.max(i - 1, 0));
    else if (e.key === "Enter" && options[hi]) pick(options[hi].id);
    else if (e.key === "Escape") setOpen(false);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={boxRef} className="relative flex-1">
      <MapPin size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0a6b47]" />
      <input
        ref={inputRef}
        role="combobox"
        aria-controls="destination-listbox"
        aria-expanded={open}
        value={open ? text : selected?.name ?? ""}
        placeholder={open ? selected?.name ?? "ค้นหาปลายทาง" : "เลือกปลายทาง"}
        onFocus={show}
        onClick={() => !open && show()}
        onChange={(e) => {
          setText(e.target.value);
          setHi(0);
          setOpen(true);
        }}
        onKeyDown={onKey}
        className={`h-[42px] w-full cursor-pointer truncate rounded-lg border bg-white pl-9 pr-9 text-sm font-medium outline-none placeholder:font-normal placeholder:text-[#8a958f] ${open ? "cursor-text border-[#0a6b47] ring-2 ring-[#0a6b47]/15" : "border-[#d5dfd9] hover:border-[#b9c9c0]"}`}
      />
      <ChevronDown
        size={16}
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5b6b63] transition-transform ${open ? "rotate-180" : ""}`}
      />
      {open && (
        <ul
          ref={listRef}
          id="destination-listbox"
          role="listbox"
          className="absolute bottom-full left-0 right-0 z-20 mb-1.5 max-h-60 overflow-auto rounded-lg border border-[#d5dfd9] bg-white p-1 shadow-[0_8px_24px_rgba(16,40,28,0.14)]"
        >
          {options.map((d, i) => (
            <li
              key={d.id}
              role="option"
              aria-selected={d.id === value}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(d.id)}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm ${i === hi ? "bg-[#f0f5f2]" : ""} ${d.id === value ? "font-semibold text-[#0a6b47]" : "text-[#1f2a24]"}`}
            >
              <span className="flex-1 truncate">{d.name}</span>
              {d.id === value && <Check size={15} className="flex-none" />}
            </li>
          ))}
          {!options.length && <li className="px-2.5 py-3 text-center text-sm text-[#8a958f]">ไม่พบปลายทาง</li>}
        </ul>
      )}
    </div>
  );
}

// "13.086, 100.883" (copy จาก Google Maps ได้เลย) → { lat, lng }
const parseLatLng = (s: string) => {
  const [lat, lng] = s.split(/[,\s]+/).filter(Boolean).map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
};

const EMPTY_FORM = { name: "", coords: "" };

// เพิ่ม / แก้ไข / ลบ ปลายทาง (เก็บใน MongoDB ผ่าน /api/external-tracking/destinations)
// ลูกค้า (client) backend ใส่ให้เองจาก username ที่ login → ไม่ต้องกรอก
function DestinationManager({
  destinations,
  jwtToken,
  onClose,
  onChanged,
}: {
  destinations: FleetDestination[];
  jwtToken: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const call = async (url: string, method: string, body?: object) => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${jwtToken}`, "Content-Type": "application/json" },
        body: body && JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await onChanged();
      return true;
    } catch (e) {
      setErr((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setErr("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pos = parseLatLng(form.coords);
    if (!form.name.trim()) return setErr("กรุณากรอกชื่อปลายทาง");
    if (!pos) return setErr("พิกัดไม่ถูกต้อง — ตัวอย่าง 13.086, 100.883");
    const body = { name: form.name, ...pos };
    const ok = editId
      ? await call(`/api/external-tracking/destinations/${editId}`, "PUT", body)
      : await call("/api/external-tracking/destinations", "POST", body);
    if (ok) reset();
  };

  const edit = (d: FleetDestination) => {
    setEditId(d.id);
    setForm({ name: d.name, coords: `${d.lat}, ${d.lng}` });
    setErr("");
  };

  const remove = async (d: FleetDestination) => {
    if (!window.confirm(`ลบปลายทาง "${d.name}" ?`)) return;
    if ((await call(`/api/external-tracking/destinations/${d.id}`, "DELETE")) && editId === d.id) reset();
  };

  const input = "h-10 w-full rounded-lg border border-[#d5dfd9] bg-white px-3 text-sm outline-none focus:border-[#0a6b47] focus:ring-2 focus:ring-[#0a6b47]/15";

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0f1f17]/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="จัดการปลายทาง" className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-[0_16px_48px_rgba(15,31,23,.25)]">
        <div className="flex items-center justify-between border-b border-[#e6ece8] px-5 py-4">
          <span className="text-base font-semibold">จัดการปลายทาง</span>
          <button onClick={onClose} title="ปิด" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5b6b63] hover:bg-[#f0f5f2]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3 border-b border-[#e6ece8] bg-[#f6f9f7] px-5 py-4">
          <span className="text-xs font-semibold text-[#0a6b47]">{editId ? "แก้ไขปลายทาง" : "เพิ่มปลายทางใหม่"}</span>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#5b6b63]">ชื่อปลายทาง *</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น Lat Krabang ICD" autoFocus />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#5b6b63]">พิกัด (lat, lng) *</span>
            <input className={input} value={form.coords} onChange={(e) => setForm({ ...form, coords: e.target.value })} placeholder="13.724, 100.759" inputMode="decimal" />
            <span className="text-[11px] text-[#8a958f]">คลิกขวาที่จุดใน Google Maps แล้วคัดลอกพิกัดมาวางได้เลย</span>
          </label>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="h-10 flex-1 rounded-lg bg-[#0a6b47] text-sm font-semibold text-white hover:bg-[#064d33] disabled:opacity-50">
              {editId ? "บันทึกการแก้ไข" : "เพิ่มปลายทาง"}
            </button>
            {editId && (
              <button type="button" onClick={reset} disabled={busy} className="h-10 rounded-lg border border-[#d5dfd9] bg-white px-4 text-sm font-medium hover:bg-[#f0f5f2]">
                ยกเลิก
              </button>
            )}
          </div>
        </form>

        <ul className="flex-1 overflow-auto p-2">
          {destinations.map((d) => (
            <li key={d.id} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${d.id === editId ? "bg-[#e8f3ed]" : "hover:bg-[#f6f9f7]"}`}>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{d.name}</span>
                <span className={`${plexMono.className} truncate text-[11px] text-[#8a958f]`}>
                  {d.lat}, {d.lng}
                </span>
              </div>
              <button onClick={() => edit(d)} disabled={busy} title="แก้ไข" className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[#5b6b63] hover:bg-white hover:text-[#0a6b47]">
                <Pencil size={15} />
              </button>
              <button onClick={() => remove(d)} disabled={busy} title="ลบ" className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[#5b6b63] hover:bg-white hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
          {!destinations.length && <li className="px-3 py-6 text-center text-sm text-[#8a958f]">ยังไม่มีปลายทาง</li>}
        </ul>
      </div>
    </div>
  );
}

function RefreshCountdown({ nextAt, loading, font }: { nextAt: number | null; loading: boolean; font: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const sec = nextAt === null ? null : Math.max(0, Math.ceil((nextAt - now) / 1000));
  return (
    <div
      title={`รีเฟรชอัตโนมัติ — นับจากเวลา GPS ล่าสุด + ${REFRESH_MS / 60_000} นาที`}
      className="flex h-7 items-center gap-1.5 px-1 text-[#5b6b63]"
    >
      <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
      <span className="text-[11px] tabular-nums" style={{ fontFamily: font }}>
        {loading || sec === null ? "…" : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`}
      </span>
    </div>
  );
}

export default function ExternalTrackingPage() {
  const router = useRouter();
  const role = useUserStore((s) => s.role);
  const jwtToken = useUserStore((s) => s.jwtToken);
  const accessToken = useUserStore((s) => s.accessToken);
  const logout = useUserStore((s) => s.logout);
  const [authChecked, setAuthChecked] = useState(false);

  const [vehicles, setVehicles] = useState<TrackedVehicle[]>([]);
  const tracksRef = useRef(new Map<string, Track>());
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(Date.now());
  const [nextAt, setNextAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [selV, setSelV] = useState("");
  const [selD, setSelD] = useState("");
  const [destinations, setDestinations] = useState<FleetDestination[]>([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [active, setActive] = useState<{ v: string; d: string } | null>(null);
  const [roadKm, setRoadKm] = useState<number | null>(null);
  const [routePath, setRoutePath] = useState<{ lon: number; lat: number }[] | null>(null);
  const [routeFailed, setRouteFailed] = useState(false);

  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [layers, setLayers] = useState<Record<MapLayer, boolean>>({ traffic: false, events: false, cameras: false });
  const overlaysRef = useRef<any[]>([]);
  const markerVehicleRef = useRef(new Map<any, string>());
  const pickRef = useRef<(id: string) => void>(() => {});
  const fitReqRef = useRef(true);

  // ====== เข้าได้เฉพาะ role external ======
  // ตอน hydrate ครั้งแรก selector ยังคืนค่า initial (role = "") → อ่านจาก store ที่ persist แล้วโดยตรง
  useEffect(() => {
    if (useUserStore.getState().role !== "external") router.replace("/login");
    else setAuthChecked(true);
  }, [role, router]);

  // ====== โหลดรถ (รอบถัดไปนับจากเวลา GPS ล่าสุด + 5 นาที) ======
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/external-tracking", {
        headers: { Authorization: `Bearer ${jwtToken}`, "x-access-token": accessToken },
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const now = Date.now();
      setVehicles(
        (data.vehicles as FleetVehicle[]).map((v) => {
          const prev = tracksRef.current.get(v.id);
          let tr: Track;
          let moved = false;
          if (!prev) {
            tr = { lat: v.lat, lng: v.lng, stillSince: now, bearing: 0 };
          } else if (hav(prev, v) * 1000 > MOVE_M) {
            tr = { lat: v.lat, lng: v.lng, stillSince: now, bearing: bearingOf(prev, v) };
            moved = true;
          } else {
            tr = prev;
          }
          tracksRef.current.set(v.id, tr);
          const stale = now - new Date(v.updatedAt).getTime() > GPS_STALE_MS;
          // วิ่งหรือไม่ ยึด status จาก backend ("วิ่ง") — ตำแหน่งที่ขยับใช้แค่หาทิศลูกศร
          const running = !stale && v.status.includes("วิ่ง");
          if (running && !moved) tracksRef.current.set(v.id, { ...tr, stillSince: now });
          const state: Status = running ? "moving" : stale || now - tr.stillSince > LONG_PARK_MS ? "parked" : "stopped";
          return { ...v, state, bearing: tr.bearing };
        }),
      );
      setUpdatedAt(Date.now());
      setError("");
      // GPS ล่าสุดของทั้งกอง (ไม่เกินเวลาปัจจุบัน กันนาฬิกาเครื่องเพี้ยน)
      const latest = Math.min(
        now,
        Math.max(0, ...(data.vehicles as FleetVehicle[]).map((v) => new Date(v.updatedAt).getTime()).filter((t) => !isNaN(t))),
      );
      const due = latest + REFRESH_MS;
      // ยังไม่ถึงรอบ → รอถึง GPS+5 นาที, เพิ่งเลยรอบ (GPS ใหม่น่าจะใกล้มา) → ลองใหม่ 30 วิ, GPS เก่ามาก → ทุก 5 นาที
      setNextAt(due > now ? due : now + (now - latest < 2 * REFRESH_MS ? RETRY_MS : REFRESH_MS));
    } catch (e) {
      setError(`โหลดข้อมูลรถไม่สำเร็จ: ${(e as Error).message}`);
      setNextAt(Date.now() + RETRY_MS);
    } finally {
      setLoading(false);
    }
  }, [jwtToken, accessToken, logout, router]);

  useEffect(() => {
    if (authChecked) load();
  }, [authChecked, load]);

  // ตั้งเวลารีเฟรชตาม nextAt (กดรีเฟรชเองก็ได้ nextAt ใหม่ → timer เดิมถูกยกเลิก)
  useEffect(() => {
    if (!authChecked || nextAt === null) return;
    const t = setTimeout(load, Math.max(0, nextAt - Date.now()));
    return () => clearTimeout(t);
  }, [authChecked, nextAt, load]);

  // ====== ปลายทาง (MongoDB) ======
  const loadDestinations = useCallback(async () => {
    try {
      const res = await fetch("/api/external-tracking/destinations", {
        headers: { Authorization: `Bearer ${jwtToken}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const list: FleetDestination[] = data.destinations;
      setDestinations(list);
      // ปลายทางที่เลือกไว้ถูกลบ → ล้างค่าที่เลือก
      setSelD((id) => (list.some((d) => d.id === id) ? id : ""));
    } catch (e) {
      setError(`โหลดปลายทางไม่สำเร็จ: ${(e as Error).message}`);
    }
  }, [jwtToken]);

  useEffect(() => {
    if (authChecked) loadDestinations();
  }, [authChecked, loadDestinations]);

  // ค่าเริ่มต้น: รถคันแรก → ปลายทางแรก
  useEffect(() => {
    if (active || !vehicles.length || !destinations.length) return;
    setSelV(vehicles[0].id);
    setSelD(destinations[0].id);
    setActive({ v: vehicles[0].id, d: destinations[0].id });
  }, [vehicles, destinations, active]);

  const activeV = vehicles.find((x) => x.id === active?.v);
  const activeD = destinations.find((x) => x.id === active?.d);
  const selectedV = vehicles.find((x) => x.id === selV);

  // ====== เส้นทางตามถนน + ระยะทางจาก Longdo (ผ่าน /api/external-tracking/route-path) ======
  useEffect(() => {
    if (!activeV || !activeD) return;
    setRoadKm(null);
    setRoutePath(null);
    setRouteFailed(false);
    const ctrl = new AbortController();
    const params = new URLSearchParams({
      flat: String(activeV.lat),
      flon: String(activeV.lng),
      tlat: String(activeD.lat),
      tlon: String(activeD.lng),
    });
    fetch(`/api/external-tracking/route-path?${params}`, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: { Authorization: `Bearer ${jwtToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { distance?: number; path?: [number, number][] } | null) => {
        if (typeof d?.distance !== "number" || !d.path?.length) {
          setRouteFailed(true);
          return;
        }
        setRoadKm(d.distance / 1000);
        // Longdo เริ่ม/จบที่ถนนใกล้สุด → ต่อปลายให้ถึงตัวรถและปลายทางจริง
        setRoutePath([
          { lon: activeV.lng, lat: activeV.lat },
          ...d.path.map(([lon, lat]) => ({ lon, lat })),
          { lon: activeD.lng, lat: activeD.lat },
        ]);
        fitReqRef.current = true; // ได้เส้นทางแล้ว → ซูมให้เห็นทั้งเส้น
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setRouteFailed(true);
      });
    return () => ctrl.abort();
    // คำนวณใหม่เมื่อกด Measure (active เปลี่ยน) หรือแก้พิกัดปลายทาง ไม่ใช่ทุกครั้งที่ poll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, Boolean(activeV && activeD), activeD?.lat, activeD?.lng]);

  // ====== Longdo map ======
  useEffect(() => {
    if (!authChecked) return;
    const init = () => {
      const el = document.getElementById("external-tracking-map");
      if (!window.longdo || !el || mapRef.current) return;
      const map = new window.longdo.Map({ placeholder: el, language: "th", lastView: false, zoom: 9, location: { lon: 100.9, lat: 13.35 } });
      mapRef.current = map;
      map.Event.bind("ready", () => {
        try {
          map.Ui.Geolocation.visible(false);
          map.Ui.DPad.visible(false);
          map.Ui.Zoombar.visible(false);
          map.Ui.Crosshair?.visible(false);
          map.Ui.Toolbar?.visible(false);
          map.Ui.LayerSelector?.visible(false);
          map.Event.bind("overlayClick", (overlay: any) => {
            const id = markerVehicleRef.current.get(overlay);
            if (id) pickRef.current(id);
          });
        } catch (e) {
          console.error("Map ready setup error:", e);
        }
        setMapReady(true);
      });
    };

    if (window.longdo) init();
    else {
      let script = document.querySelector<HTMLScriptElement>('script[src*="api.longdo.com/map3"]');
      if (!script) {
        script = document.createElement("script");
        script.src = LONGDO_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", init);
    }
    return () => {
      mapRef.current = null;
      setMapReady(false);
    };
  }, [authChecked]);

  const fitActive = useCallback(() => {
    const map = mapRef.current;
    if (!map || !activeV || !activeD) return;
    const pts = routePath ?? [{ lon: activeV.lng, lat: activeV.lat }, { lon: activeD.lng, lat: activeD.lat }];
    const lats = pts.map((p) => p.lat), lons = pts.map((p) => p.lon);
    const [minLat, maxLat, minLon, maxLon] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
    const padLat = Math.max(0.02, (maxLat - minLat) * 0.15);
    const padLon = Math.max(0.02, (maxLon - minLon) * 0.15);
    map.bound({ minLat: minLat - padLat, maxLat: maxLat + padLat, minLon: minLon - padLon, maxLon: maxLon + padLon });
  }, [activeV, activeD, routePath]);

  // ====== ชั้นข้อมูลเสริม (แยก effect ต่อชั้น กัน insert/load ซ้ำ) ======
  useEffect(() => {
    const map = mapRef.current, L = window.longdo;
    if (!mapReady || !map || !L) return;
    try {
      if (layers.traffic) map.Layers.insert(1, L.Layers.TRAFFIC);
      else map.Layers.remove(L.Layers.TRAFFIC);
    } catch (e) {
      console.error("Traffic layer error:", e);
    }
  }, [mapReady, layers.traffic]);

  useEffect(() => {
    const map = mapRef.current, L = window.longdo;
    if (!mapReady || !map || !L) return;
    if (layers.events) map.Overlays.load(L.Overlays.events);
    else map.Overlays.unload(L.Overlays.events);
  }, [mapReady, layers.events]);

  useEffect(() => {
    const map = mapRef.current, L = window.longdo;
    if (!mapReady || !map || !L) return;
    if (layers.cameras) {
      // ค่าเริ่มต้น Longdo โชว์กล้อง motion (ทุกตัวใน feed) ที่ zoom ≥ 12 → แผนที่เปิดที่ zoom 9 เลยไม่เห็น ลดให้เห็นตั้งแต่ zoom 8
      const range: Record<string, { min: number }> | undefined = L.Overlays.cameras.theme?.range;
      if (range) Object.values(range).forEach((r) => (r.min = Math.min(r.min, 8)));
      map.Overlays.load(L.Overlays.cameras);
    } else map.Overlays.unload(L.Overlays.cameras);
  }, [mapReady, layers.cameras]);

  const font = plexThai.style.fontFamily;

  useEffect(() => {
    const map = mapRef.current;
    const L = window.longdo;
    if (!mapReady || !map || !L) return;

    overlaysRef.current.forEach((o) => map.Overlays.remove(o));
    overlaysRef.current = [];
    markerVehicleRef.current.clear();
    const add = (o: any) => {
      map.Overlays.add(o);
      overlaysRef.current.push(o);
    };

    vehicles.forEach((v) => {
      if (v.id === active?.v) return; // วาดคันที่เลือกทีหลังให้อยู่ด้านบน
      const mk = new L.Marker({ lon: v.lng, lat: v.lat }, { icon: vehicleIcon(v, false, font), title: v.plate });
      markerVehicleRef.current.set(mk, v.id);
      add(mk);
    });

    if (activeV && activeD) {
      if (routePath) {
        // เส้นทางตามถนน: ขอบขาว + เส้นเขียว ให้เด่นบนแผนที่
        add(new L.Polyline(routePath, { lineColor: "#ffffff", lineWidth: 8, clickable: false }));
        add(new L.Polyline(routePath, { lineColor: "#0a6b47", lineWidth: 5, clickable: false }));
      }
      add(new L.Marker({ lon: activeD.lng, lat: activeD.lat }, { icon: destinationIcon(activeD, font), title: activeD.name }));
      if (routePath && roadKm !== null) {
        add(new L.Marker(routePath[Math.floor(routePath.length / 2)], { icon: distanceIcon(roadKm, font), clickable: false }));
      }
      const mk = new L.Marker({ lon: activeV.lng, lat: activeV.lat }, { icon: vehicleIcon(activeV, true, font), title: activeV.plate });
      markerVehicleRef.current.set(mk, activeV.id);
      add(mk);
    }

    if (fitReqRef.current && activeV && activeD) {
      fitReqRef.current = false;
      fitActive();
    }
  }, [mapReady, vehicles, active, activeV, activeD, roadKm, routePath, font, fitActive]);

  const pickVehicle = useCallback((id: string) => {
    fitReqRef.current = true;
    setSelV(id);
    setActive((a) => ({ v: id, d: a?.d ?? selD }));
  }, [selD]);
  pickRef.current = pickVehicle;

  const closeManage = useCallback(() => setManageOpen(false), []);

  const measure = () => {
    if (!selV || !selD) return;
    fitReqRef.current = true;
    setActive({ v: selV, d: selD });
  };

  const onLogout = () => {
    logout();
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("access_token");
    router.replace("/login");
  };

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return vehicles.filter((x) => !k || x.plate.toLowerCase().includes(k) || x.address.includes(k));
  }, [vehicles, q]);

  const mins = roadKm !== null ? Math.max(1, Math.round((roadKm / AVERAGE_SPEED_KMH) * 60)) : null;
  const routeText = roadKm !== null ? `${roadKm.toFixed(1)} km` : routeFailed ? "—" : activeV && activeD ? "…" : "—";
  const etaTip = [
    `ETA = ระยะทางตามเส้นทาง ÷ ความเร็วเฉลี่ย ${AVERAGE_SPEED_KMH} km/h`,
  ].join("\n");

  if (!authChecked) return null;

  return (
    <div className={`${plexThai.className} fixed inset-0 overflow-hidden bg-[#e9eeeb] text-[#0f1f17]`}>
      {/* ซ่อนปุ่ม Enable terrain และแถบมาตราส่วน (scale) ของ Longdo (maplibre) — ไม่มี API ปิด จึงซ่อนด้วย CSS */}
      <style>{`@keyframes xt-pulse{0%{transform:scale(.5);opacity:.9}100%{transform:scale(1.4);opacity:0}}
#external-tracking-map .maplibregl-ctrl-group:has(> .maplibregl-ctrl-terrain),#external-tracking-map .maplibregl-ctrl-terrain,#external-tracking-map .maplibregl-ctrl-scale{display:none!important}`}</style>

      {/* แผนที่: เว้นที่ให้ panel ด้านขวา (desktop) / ด้านล่าง (mobile) */}
      {/* Longdo เขียนทับ position ของ placeholder → ใช้ wrapper จัดตำแหน่งแทน */}
      <div className="absolute inset-x-0 top-0 bottom-[52vh] lg:bottom-0 lg:right-[400px]">
        <div id="external-tracking-map" className="h-full w-full" />
      </div>

      {/* Brand */}
      <div className="absolute left-3 top-3 lg:left-5 lg:top-5 z-[1000] flex h-14 items-center gap-3 rounded-xl bg-white px-3 shadow-[0_6px_20px_rgba(15,31,23,.12),0_1px_2px_rgba(15,31,23,.08)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a6b47]">
          <div className="h-[11px] w-[11px] rotate-45 rounded-[2px] bg-white" />
        </div>
        <div className="flex flex-col gap-px leading-tight">
          <span className="text-sm font-semibold">MENA Transport</span>
          <span className="text-xs text-[#5b6b63]">FastTrack</span>
        </div>
        <div className="h-7 w-px bg-[#e3e9e5]" />
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f3ed] text-[11px] font-semibold text-[#0a6b47]">EX</div>
          <span className="hidden text-xs font-medium sm:inline">External</span>
        </div>
        <button
          onClick={onLogout}
          title="ออกจากระบบ"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5b6b63] hover:bg-[#f0f5f2] hover:text-[#0f1f17]"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Layers (traffic / news / CCTV) + Zoom / fit */}
      <div className="absolute left-3 bottom-[calc(52vh+12px)] lg:left-5 lg:bottom-5 z-[1000] flex flex-col gap-2">
      <div className="flex flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_6px_20px_rgba(15,31,23,.12)]">
        {MAP_LAYERS.map(({ k, icon: Icon, tip }, i) => (
          <div key={k} className="contents">
            {i > 0 && <div className="h-px bg-[#e6ece8]" />}
            <button
              onClick={() => setLayers((s) => ({ ...s, [k]: !s[k] }))}
              title={tip}
              aria-pressed={layers[k]}
              className={`flex h-10 w-10 items-center justify-center ${layers[k] ? "bg-[#e8f3ed] text-[#0a6b47]" : "text-[#5b6b63] hover:bg-[#f0f5f2]"}`}
            >
              <Icon size={18} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_6px_20px_rgba(15,31,23,.12)]">
        <button onClick={() => mapRef.current?.zoom(true, true)} className="h-10 w-10 text-xl font-medium hover:bg-[#f0f5f2]">+</button>
        <div className="h-px bg-[#e6ece8]" />
        <button onClick={() => mapRef.current?.zoom(false, true)} className="h-10 w-10 text-xl font-medium hover:bg-[#f0f5f2]">−</button>
        <div className="h-px bg-[#e6ece8]" />
        <button onClick={fitActive} title="Fit vehicle & destination" className="flex h-10 w-10 items-center justify-center hover:bg-[#f0f5f2]">
          <span className="h-3 w-3 rounded-full border-2 border-[#0a6b47]" />
        </button>
      </div>
      </div>

      {/* Docked fleet panel */}
      <aside className="absolute inset-x-0 bottom-0 h-[52vh] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-[400px] z-[1000] flex flex-col bg-white border-t lg:border-t-0 lg:border-l border-[#dfe6e2] shadow-[-8px_0_28px_rgba(15,31,23,.08)]">
        <div className="flex flex-col gap-3 border-b border-[#e6ece8] px-5 pb-3.5 pt-5">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold">Vehicles</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[#5b6b63]">{vehicles.length} assigned</span>
              <span className="h-3.5 w-px bg-[#e3e9e5]" />
              <RefreshCountdown nextAt={nextAt} loading={loading} font={plexMono.style.fontFamily} />
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-[13px] text-[#5b6b63]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาทะเบียนหรือที่อยู่"
              className="h-10 w-full rounded-lg border border-[#d5dfd9] bg-[#f6f9f7] pl-9 pr-3 text-sm outline-none focus:border-[#0a6b47]"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex flex-1 flex-col gap-0.5 overflow-auto px-2.5 py-2">
          {list.map((v) => {
            const st = ST[v.state];
            const sel = v.id === selV;
            return (
              <button
                key={v.id}
                onClick={() => pickVehicle(v.id)}
                className={`flex items-center gap-3 rounded-[10px] p-3 text-left hover:bg-[#f0f5f2] ${sel ? "bg-[#e8f3ed] outline outline-1 outline-[#b9dcc8]" : ""}`}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">{v.plate}</span>
                  <div className="flex min-w-0 items-baseline gap-1.5">
                    {/* ที่อยู่ยาวเกิน → ตัดด้วย … และโชว์เต็มเป็น tooltip ตอน hover (เฉพาะตอนถูกตัด) */}
                    <span
                      className="truncate text-xs text-[#5b6b63]"
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        el.title = el.scrollWidth > el.clientWidth ? v.address : "";
                      }}
                    >
                      {v.address || "—"}
                    </span>
                    <span className={`${plexMono.className} flex-none text-[10px] text-[#8a958f]`}>{gpsTime(v)}</span>
                  </div>
                </div>
                <div className="flex w-14 flex-none flex-col items-center gap-0.5">
                  <div className="relative flex">
                    {/* ความเร็วอยู่ซ้ายของ icon ระดับกึ่งกลาง icon (เฉพาะรถที่กำลังวิ่ง) */}
                    {v.state === "moving" && v.speed != null && (
                      <span
                        className={`${plexMono.className} absolute right-full top-1/2 mr-1 -translate-y-1/2 whitespace-nowrap text-[11px] font-semibold`}
                        style={{ color: st.c }}
                      >
                        {v.speed} km/h
                      </span>
                    )}
                    {v.state === "moving" ? (
                      <Navigation2
                        size={20}
                        fill={st.c}
                        stroke={st.c}
                        style={{ transform: `rotate(${Math.round(v.bearing)}deg)` }}
                      />
                    ) : v.state === "stopped" ? (
                      <CirclePause size={20} stroke={st.c} strokeWidth={2.2} />
                    ) : (
                      <SquareParking size={20} stroke={st.c} strokeWidth={2.2} />
                    )}
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: st.c }}>{st.l}</span>
                </div>
              </button>
            );
          })}
          {!list.length && !error && (
            <p className="px-3 py-6 text-center text-sm text-[#5b6b63]">{vehicles.length ? "No vehicles match your search" : "Loading vehicles…"}</p>
          )}
        </div>

        <div className="flex flex-col gap-3.5 border-t border-[#e6ece8] bg-[#f6f9f7] px-5 pb-5 pt-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#5b6b63]">Destination for {selectedV?.plate ?? "—"}</span>
              <button
                onClick={() => setManageOpen(true)}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-[#0a6b47] hover:bg-[#e8f3ed]"
              >
                <Settings2 size={13} />
                จัดการปลายทาง
              </button>
            </div>
            <div className="flex gap-2">
              <DestinationPicker destinations={destinations} value={selD} onChange={setSelD} />
              <button
                onClick={measure}
                disabled={!selV || !selD}
                className="h-[42px] rounded-lg bg-[#0a6b47] px-[18px] text-sm font-semibold text-white hover:bg-[#064d33] disabled:opacity-50"
              >
                Measure
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 rounded-[10px] border border-[#dfe6e2] bg-white">
            <div className="flex flex-col gap-[3px] px-3.5 py-3" title={routeFailed ? "คำนวณเส้นทางจาก Longdo ไม่สำเร็จ" : "ระยะทางตามเส้นทางถนนจริง (Longdo)"}>
              <span className="text-[11px] text-[#5b6b63]">Distance</span>
              <span className="text-[22px] font-semibold leading-[1.1] text-[#0a6b47] tabular-nums">{routeText}</span>
            </div>
            <div className="flex cursor-help flex-col gap-[3px] border-l border-[#e6ece8] px-3.5 py-3" title={etaTip}>
              <span className="flex items-center gap-1 text-[11px] text-[#5b6b63]">
                ETA{mins !== null ? ` · ถึง ${hhmm(updatedAt + mins * 60_000)}` : ""}
                <Info size={12} />
              </span>
              <span className="text-[22px] font-semibold leading-[1.1] tabular-nums">{mins !== null ? fmtEta(mins) : routeText === "…" ? "…" : "—"}</span>
            </div>
          </div>
        </div>
      </aside>

      {manageOpen && (
        <DestinationManager destinations={destinations} jwtToken={jwtToken} onClose={closeManage} onChanged={loadDestinations} />
      )}
    </div>
  );
}
