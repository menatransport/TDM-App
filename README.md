# Mena FastTrack - ระบบติดตามสถานะขนส่ง

## 📋 ภาพรวมโปรเจค

**Mena FastTrack** เป็นระบบ Progressive Web Application (PWA) สำหรับการจัดการและติดตามสถานะการขนส่ง พัฒนาด้วย Next.js 15 และ React 19 โดยทีม Process Improvement

### 🎯 วัตถุประสงค์หลัก
- จัดการข้อมูลการขนส่งและงานต่างๆ
- ติดตามสถานะงานแบบ Real-time
- แสดงผล Dashboard และ Analytics
- รองรับการใช้งานบนมือถือ (Mobile-first Design)
- ระบบ Authentication และ Authorization

---

## 🏗️ โครงสร้างโปรเจค

### 📁 โฟลเดอร์หลัก

```
my-app/
├── app/                    # App Router (Next.js 13+)
│   ├── globals.css         # Global CSS styles
│   ├── layout.tsx          # Root layout component
│   ├── page.tsx           # หน้าแรก
│   ├── admin/             # หน้า Admin Dashboard
│   │   └── page.tsx
│   ├── job/               # หน้าจัดการงาน
│   │   └── page.tsx
│   ├── login/             # หน้า Login
│   │   └── page.tsx
│   ├── picture/           # หน้าจัดการรูปภาพ
│   │   └── page.tsx
│   ├── ticket/            # หน้าจัดการ Ticket
│   │   └── page.tsx
│   └── api/               # API Routes
│       ├── admin/         # API สำหรับ Admin
│       ├── auth/          # API Authentication
│       ├── jobs/          # API จัดการงาน
│       ├── pallet/        # API จัดการ Pallet
│       ├── tickets/       # API จัดการ Ticket
│       └── upload/        # API Upload ไฟล์
├── components/            # React Components
├── lib/                   # Utility functions และ Types
├── hooks/                 # Custom React Hooks
└── public/               # Static files
```

### 🔧 Components หลัก

| Component | ความรับผิดชอบ |
|-----------|---------------|
| `Admin.tsx` | หน้าหลักการจัดการงานสำหรับ Admin |
| `AdminDashboard.tsx` | Dashboard แสดงสถิติและกราฟ |
| `AdminView.tsx` | Modal ดูรายละเอียดและแก้ไขงาน |
| `AdminCreateNew.tsx` | Modal สร้างงานใหม่ |
| `AdminMap.tsx` | แสดงแผนที่ตำแหน่งงาน |
| `Job.tsx` | หน้าสำหรับพนักงานดูงาน |
| `Login.tsx` | หน้า Login |
| `ticket.tsx` | จัดการ Ticket และสถานะงาน |
| `picture.tsx` | จัดการรูปภาพ |
| `Timeline.tsx` | แสดง Timeline ของงาน |
| `Navbars.tsx` | Navigation Bar |

### 📊 Dashboard Features

- **สถิติรวม**: จำนวนงานทั้งหมด, งานที่สำเร็จ, งานที่ล่าช้า
- **กราฟแสดงผล**: Performance by Date, Driver Performance
- **Pie Chart**: แสดง Reason Codes สำหรับ Origin/Destination
- **ตารางข้อมูล**: แสดงรายละเอียดงานพร้อม Filter และ Sort
- **แผนที่**: แสดงตำแหน่ง Real-time

---

## 🛠️ เทคโนโลยีที่ใช้

### Frontend Framework
- **Next.js 15.3.3** - React Framework พร้อม App Router
- **React 19** - UI Library
- **TypeScript 5.8.3** - Type Safety
- **Tailwind CSS 4** - Styling Framework

### UI Components & Charts
- **Recharts 3.2.1** - Data Visualization
- **Radix UI** - Headless UI Components
- **Lucide React** - Icon Library
- **Material Tailwind** - UI Components

### Data Management
- **Zustand 5.0.7** - State Management
- **SWR/Fetch** - Data Fetching

### Database & APIs
- **MongoDB 6.17.0** - NoSQL Database
- **PostgreSQL (pg 8.16.3)** - Relational Database
- **AWS SDK** - Cloud Services Integration

### Authentication & Security
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **bcrypt 6.0.0** - Password Hashing

### Utilities & Tools
- **date-fns 4.1.0** - Date Manipulation
- **XLSX 0.18.5** - Excel File Processing
- **html2canvas & jsPDF** - PDF Generation
- **SweetAlert2** - Beautiful Alerts

### Progressive Web App
- **next-pwa 5.6.0** - PWA Support
- **Service Worker** - Offline Functionality

---

## 📱 API Routes

### Authentication
- `GET/POST /api/auth` - Login/Authentication
- User management และ token validation

### Jobs Management  
- `GET /api/jobs` - ดึงข้อมูลงานทั้งหมด
- `POST /api/jobs` - สร้างงานใหม่ (Bulk Create)
- `PUT /api/jobs` - อัพเดทข้อมูลงาน
- `DELETE /api/jobs` - ลบงาน

### Admin Functions
- `GET /api/admin` - ดึงข้อมูลสำหรับ Admin (limited results)
- `POST /api/admin` - Reset Password

### Tickets System
- `GET /api/tickets` - ดึงข้อมูล Ticket ตาม load_id
- `POST /api/tickets` - สร้าง/อัพเดท Ticket

### File Management
- `POST /api/upload` - อัพโหลดไฟล์รูปภาพ
- `GET/POST /api/pallet` - จัดการข้อมูล Pallet

---

## 🎨 UI/UX Features

### Responsive Design
- **Mobile-first** approach
- รองรับทุกขนาดหน้าจอ (320px - 4K)
- Touch-friendly interface

### Progressive Web App
- **Service Worker** สำหรับ Offline support
- **App Manifest** สำหรับ Install to Home Screen
- **Push Notifications** (ถ้ามี)

### User Experience
- **Loading States** และ Skeleton UI
- **Error Boundaries** สำหรับ Error Handling
- **Toast Notifications** และ Sweet Alerts
- **Real-time Updates** 

### Accessibility
- **Keyboard Navigation** support
- **Screen Reader** friendly
- **ARIA Labels** และ Semantic HTML

---

## 🔒 Security Features

### Authentication
- **JWT Token** based authentication
- **Secure HTTP Headers**
- **API Key** protection สำหรับ External APIs

### Data Protection
- **bcrypt** password hashing
- **Input Validation** และ Sanitization
- **CORS** configuration

---

## 📊 Data Models

### TransportItem Interface
```typescript
interface TransportItem {
  load_id: string;              // รหัสงาน
  date_plan: string;            // วันที่วางแผน
  h_plate: string;              // ทะเบียนหัวรถ
  t_plate: string;              // ทะเบียนพ่วง
  driver_name: string;          // ชื่อคนขับ
  status: string;               // สถานะงาน
  job_type: string;             // ประเภทงาน
  locat_recive: string;         // สถานที่รับสินค้า
  locat_deliver: string;        // สถานที่ส่งสินค้า
  reason_kpi_origin: string;    // เหตุผล KPI ต้นทาง
  reason_kpi_destination: string; // เหตุผล KPI ปลายทาง
  dw_jobdata_info: {
    client_kpi_origin: string;    // KPI ลูกค้าต้นทาง
    client_kpi_destination: string; // KPI ลูกค้าปลายทาง
  };
  ticket_info?: {               // ข้อมูล Timeline
    start_datetime?: string;
    origin_datetime?: string;
    // ... และอื่นๆ
  };
  // ... fields อื่นๆ
}
```

---

## 🚀 การติดตั้งและใช้งาน

### ความต้องการระบบ
- Node.js 18+ 
- npm หรือ yarn
- MongoDB / PostgreSQL Database

### การติดตั้ง
```bash
# Clone project
git clone [repository-url]
cd my-app

# ติดตั้ง dependencies
npm install

# ตั้งค่า Environment Variables
cp .env.example .env.local
# แก้ไข .env.local ตามความต้องการ

# รันโปรเจค Development
npm run dev

# Build สำหรับ Production
npm run build
npm start
```
---

## 👥 Team & Contact

**พัฒนาโดย**: Process Improvement Team  
**บริษัท**: Mena Transport  
**Version**: 0.1.0  

### สำหรับการพัฒนาต่อ
- ใช้ **TypeScript** สำหรับ Type Safety
- ทำตามรูปแบบ **Component-driven Development**
- เขียน **Tests** สำหรับ Functions สำคัญ
- ใช้ **Git Flow** สำหรับ Version Control

---


*อัพเดทล่าสุด: ตุลาคม 2025*
