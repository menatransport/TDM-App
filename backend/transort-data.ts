
export interface TransportJob {
  JWT: string;
  Id_load: string;
  Status: string;
  H_plate: string;
  T_plate: string;
  Ori_locat: string;
  Des_locat: string;
  Recv_date: string;
  Recv_time: string;
  unload_date: string;
  unload_time: string;
  Pallet_pl: number;
  Pallet_act: string;
  Cost_pd: number;
  Rmk_job: string;
  DO: Array<{
    Timestamp_start?: string;
    Timestamp_ori?: string;
    Timestamp_strecv?: string;
    Timestamp_enrecv?: string;
    Timestamp_intran?: string;
    Timestamp_des?: string;
    Timestamp_stload?: string;
    Timestamp_enload?: string;
    Timestamp_ended?: string;
    Pallet_tran?: number;
    Pallet_change?: number;
    Pallet_drop?: number;
    Pallet_return?: number;
    Attachment?: string;
  }>;
}

// Mock data ตัวอย่าง
export const mockTransportJobs: TransportJob[] = [
  {
    JWT: "jwt_user_001",
    Id_load: "TDM-25617-001",
    Status: "พร้อมรับงาน",
    H_plate: "71-0428",
    T_plate: "71-0081",
    Ori_locat: "DC ขอนแก่น",
    Des_locat: "DC โพธาราม",
    Recv_date: "2025-06-17",
    Recv_time: "06:00",
    unload_date: "2025-06-17",
    unload_time: "18:00",
    Pallet_pl: 30,
    Pallet_act: "โอน",
    Cost_pd: 1800,
    Rmk_job: "ทอยขวด 2",
    DO: [
      {
        Timestamp_start: "",
        Timestamp_ori: "",
        Timestamp_strecv: "",
        Timestamp_enrecv: "",
        Timestamp_intran: "",
        Timestamp_des: "",
        Timestamp_stload: "",
        Timestamp_enload: "",
        Timestamp_ended: ""
      },
      {
        Pallet_tran: 0,
        Pallet_change: 0,
        Pallet_drop: 0,
        Pallet_return: 0
      }
    ]
  },
  {
    JWT: "jwt_user_001",
    Id_load: "TDM-25617-002",
    Status: "รับงานแล้ว",
    H_plate: "71-0428",
    T_plate: "71-0081",
    Ori_locat: "DC ขอนแก่น",
    Des_locat: "DC โพธาราม",
    Recv_date: "2025-06-17",
    Recv_time: "06:00",
    unload_date: "2025-06-17",
    unload_time: "18:00",
    Pallet_pl: 30,
    Pallet_act: "โอน",
    Cost_pd: 1800,
    Rmk_job: "ทอยขวด 2",
    DO: [
      {
        Timestamp_start: "16/6/2025, 10:00",
        Timestamp_ori: "",
        Timestamp_strecv: "",
        Timestamp_enrecv: "",
        Timestamp_intran: "",
        Timestamp_des: "",
        Timestamp_stload: "",
        Timestamp_enload: "",
        Timestamp_ended: ""
      },
      {
        Pallet_tran: 0,
        Pallet_change: 0,
        Pallet_drop: 0,
        Pallet_return: 0
      }
    ]
  },
  {
    JWT: "jwt_user_001",
    Id_load: "TDM-25617-003",
    Status: "ถึงต้นทาง",
    H_plate: "72-9871",
    T_plate: "73-0072",
    Ori_locat: "สหพัฒน์ ชลบุรี",
    Des_locat: "คาราบาว บางปะกง",
    Recv_date: "2025-06-15",
    Recv_time: "08:30",
    unload_date:"2025-06-15",
    unload_time: "14:00",
    Pallet_pl: 20,
    Pallet_act: "แลกเปลี่ยน",
    Cost_pd: 1200,
    Rmk_job: "เตรียมพาเลทเปล่า 26 ตัวติดรถไปด้วย",
    DO: [
      {
        Timestamp_start: "16/6/2025, 10:00",
        Timestamp_ori: "16/6/2025, 11:00",
        Timestamp_strecv: "",
        Timestamp_enrecv: "",
        Timestamp_intran: "",
        Timestamp_des: "",
        Timestamp_stload: "",
        Timestamp_enload: "",
        Timestamp_ended: ""
      },
      {
        Pallet_tran: 0,
        Pallet_change: 26,
        Pallet_drop: 0,
        Pallet_return: 0
      },
      {
        Attachment: ""
      }
    ]
  },
  {
    JWT: "jwt_user_001",
    Id_load: "TDM-25617-004",
    Status: "เริ่มขึ้นสินค้า",
    H_plate: "72-9871",
    T_plate: "73-0072",
    Ori_locat: "สหพัฒน์ ชลบุรี",
    Des_locat: "คาราบาว บางปะกง",
    Recv_date: "2025-06-15",
    Recv_time: "08:30",
    unload_date:"2025-06-15",
    unload_time: "14:00",
    Pallet_pl: 20,
    Pallet_act: "แลกเปลี่ยน",
    Cost_pd: 1200,
    Rmk_job: "เตรียมพาเลทเปล่า 26 ตัวติดรถไปด้วย",
    DO: [
      {
        Timestamp_start: "16/6/2025, 10:00",
        Timestamp_ori: "16/6/2025, 11:00",
        Timestamp_strecv: "16/6/2025, 12:00",
        Timestamp_enrecv: "",
        Timestamp_intran: "",
        Timestamp_des: "",
        Timestamp_stload: "",
        Timestamp_enload: "",
        Timestamp_ended: ""
      },
      {
        Pallet_tran: 0,
        Pallet_change: 26,
        Pallet_drop: 0,
        Pallet_return: 0
      },
      {
        Attachment: ""
      }
    ]
  },
  {
    JWT: "jwt_user_001",
    Id_load: "TDM-25617-005",
    Status: "ขึ้นสินค้าเสร็จ",
    H_plate: "72-9871",
    T_plate: "73-0072",
    Ori_locat: "สหพัฒน์ ชลบุรี",
    Des_locat: "คาราบาว บางปะกง",
    Recv_date: "2025-06-15",
    Recv_time: "08:30",
    unload_date:"2025-06-15",
    unload_time: "14:00",
    Pallet_pl: 20,
    Pallet_act: "แลกเปลี่ยน",
    Cost_pd: 1200,
    Rmk_job: "เตรียมพาเลทเปล่า 26 ตัวติดรถไปด้วย",
    DO: [
      {
        Timestamp_start: "16/6/2025, 10:00",
        Timestamp_ori: "16/6/2025, 11:00",
        Timestamp_strecv: "16/6/2025, 12:00",
        Timestamp_enrecv: "16/6/2025, 13:00",
        Timestamp_intran: "",
        Timestamp_des: "",
        Timestamp_stload: "",
        Timestamp_enload: "",
        Timestamp_ended: ""
      },
      {
        Pallet_tran: 0,
        Pallet_change: 26,
        Pallet_drop: 0,
        Pallet_return: 0
      },
      {
        Attachment: ""
      }
    ]
  },
  {
    JWT: "jwt_user_001",
    Id_load: "TDM-25617-006",
    Status: "เริ่มขนส่ง",
    H_plate: "72-9871",
    T_plate: "73-0072",
    Ori_locat: "สหพัฒน์ ชลบุรี",
    Des_locat: "คาราบาว บางปะกง",
    Recv_date: "2025-06-15",
    Recv_time: "08:30",
    unload_date:"2025-06-15",
    unload_time: "14:00",
    Pallet_pl: 20,
    Pallet_act: "แลกเปลี่ยน",
    Cost_pd: 1200,
    Rmk_job: "เตรียมพาเลทเปล่า 26 ตัวติดรถไปด้วย",
    DO: [
      {
        Timestamp_start: "16/6/2025, 10:00",
        Timestamp_ori: "16/6/2025, 11:00",
        Timestamp_strecv: "16/6/2025, 12:00",
        Timestamp_enrecv: "16/6/2025, 13:00",
        Timestamp_intran: "16/6/2025, 14:00",
        Timestamp_des: "",
        Timestamp_stload: "",
        Timestamp_enload: "",
        Timestamp_ended: ""
      },
      {
        Pallet_tran: 0,
        Pallet_change: 26,
        Pallet_drop: 0,
        Pallet_return: 0
      },
      {
        Attachment: ""
      }
    ]
  },
  {
    JWT: "jwt_user_001",
    Id_load: "TDM-25617-007",
    Status: "ถึงปลายทาง",
    H_plate: "72-9871",
    T_plate: "73-0072",
    Ori_locat: "สหพัฒน์ ชลบุรี",
    Des_locat: "คาราบาว บางปะกง",
    Recv_date: "2025-06-15",
    Recv_time: "08:30",
    unload_date:"2025-06-15",
    unload_time: "14:00",
    Pallet_pl: 20,
    Pallet_act: "แลกเปลี่ยน",
    Cost_pd: 1200,
    Rmk_job: "เตรียมพาเลทเปล่า 26 ตัวติดรถไปด้วย",
    DO: [
      {
        Timestamp_start: "16/6/2025, 10:00",
        Timestamp_ori: "16/6/2025, 11:00",
        Timestamp_strecv: "16/6/2025, 12:00",
        Timestamp_enrecv: "16/6/2025, 13:00",
        Timestamp_intran: "16/6/2025, 14:00",
        Timestamp_des: "16/6/2025, 15:00",
        Timestamp_stload: "",
        Timestamp_enload: "",
        Timestamp_ended: ""
      },
      {
        Pallet_tran: 0,
        Pallet_change: 26,
        Pallet_drop: 0,
        Pallet_return: 0
      },
      {
        Attachment: ""
      }
    ]
  },
  {
    JWT: "jwt_user_001",
    Id_load: "TDM-25617-008",
    Status: "เริ่มลงสินค้า",
    H_plate: "72-9871",
    T_plate: "73-0072",
    Ori_locat: "สหพัฒน์ ชลบุรี",
    Des_locat: "คาราบาว บางปะกง",
    Recv_date: "2025-06-15",
    Recv_time: "08:30",
    unload_date:"2025-06-15",
    unload_time: "14:00",
    Pallet_pl: 20,
    Pallet_act: "แลกเปลี่ยน",
    Cost_pd: 1200,
    Rmk_job: "เตรียมพาเลทเปล่า 26 ตัวติดรถไปด้วย",
    DO: [
      {
        Timestamp_start: "16/6/2025, 10:00",
        Timestamp_ori: "16/6/2025, 11:00",
        Timestamp_strecv: "16/6/2025, 12:00",
        Timestamp_enrecv: "16/6/2025, 13:00",
        Timestamp_intran: "16/6/2025, 14:00",
        Timestamp_des: "16/6/2025, 15:00",
        Timestamp_stload: "16/6/2025, 16:00",
        Timestamp_enload: "",
        Timestamp_ended: ""
      },
      {
        Pallet_tran: 0,
        Pallet_change: 26,
        Pallet_drop: 0,
        Pallet_return: 0
      },
      {
        Attachment: ""
      }
    ]
  },
  {
    JWT: "jwt_user_001",
    Id_load: "TDM-25617-009",
    Status: "ลงสินค้าเสร็จ",
    H_plate: "72-9871",
    T_plate: "73-0072",
    Ori_locat: "สหพัฒน์ ชลบุรี",
    Des_locat: "คาราบาว บางปะกง",
    Recv_date: "2025-06-15",
    Recv_time: "08:30",
    unload_date:"2025-06-15",
    unload_time: "14:00",
    Pallet_pl: 20,
    Pallet_act: "แลกเปลี่ยน",
    Cost_pd: 1200,
    Rmk_job: "เตรียมพาเลทเปล่า 26 ตัวติดรถไปด้วย",
    DO: [
      {
        Timestamp_start: "16/6/2025, 10:00",
        Timestamp_ori: "16/6/2025, 11:00",
        Timestamp_strecv: "16/6/2025, 12:00",
        Timestamp_enrecv: "16/6/2025, 13:00",
        Timestamp_intran: "16/6/2025, 14:00",
        Timestamp_des: "16/6/2025, 15:00",
        Timestamp_stload: "16/6/2025, 16:00",
        Timestamp_enload: "16/6/2025, 17:00",
        Timestamp_ended: ""
      },
      {
        Pallet_tran: 0,
        Pallet_change: 26,
        Pallet_drop: 0,
        Pallet_return: 0
      },
      {
        Attachment: ""
      }
    ]
  },
  {
    JWT: "jwt_user_001",
    Id_load: "TDM-25617-010",
    Status: "ขนส่งสำเร็จ",
    H_plate: "71-0163",
    T_plate: "73-1867",
    Ori_locat: "โรงเหล้าชัยนาท",
    Des_locat: "DC บางวัว 1",
    Recv_date: "2025-06-15",
    Recv_time: "09:00",
    unload_date: "2025-06-15",
    unload_time: "15:30",
    Pallet_pl: 15,
    Pallet_act: "โอน",
    Cost_pd: 1500,
    Rmk_job: "ลงงานเสร็จแล้ว ขึ้นงานคืนโรงเบียร์ต่อ",
    DO: [
      {
        Timestamp_start: "16/6/2025, 10:00",
        Timestamp_ori: "16/6/2025, 11:00",
        Timestamp_strecv: "16/6/2025, 12:00",
        Timestamp_enrecv: "16/6/2025, 13:00",
        Timestamp_intran: "16/6/2025, 14:00",
        Timestamp_des: "16/6/2025, 15:00",
        Timestamp_stload: "16/6/2025, 16:00",
        Timestamp_enload: "16/6/2025, 17:00",
        Timestamp_ended: "16/6/2025, 18:00"
      },
      {
        Pallet_tran: 0,
        Pallet_change: 15,
        Pallet_drop: 0,
        Pallet_return: 0
      }
    ]
  }
];

export const getJobsByJWT = (jwt: string): TransportJob[] => {
  return mockTransportJobs.filter(job => job.JWT === jwt);
};

export const getAllJobs = (): TransportJob[] => {
  return mockTransportJobs;
};

export const getJobById = (id: string): TransportJob | undefined => {
  return mockTransportJobs.find(job => job.Id_load === id);
};

export const getStatusSteps = () => [
  { key: 'Timestamp_start', label: 'เริ่มงาน', icon: '🚀' },
  { key: 'Timestamp_ori', label: 'ถึงต้นทาง', icon: '📍' },
  { key: 'Timestamp_strecv', label: 'เริ่มขึ้นสินค้า', icon: '📤' },
  { key: 'Timestamp_enrecv', label: 'ขึ้นสินค้าเสร็จ', icon: '✅' },
  { key: 'Timestamp_intran', label: 'เริ่มขนส่ง', icon: '🚛' },
  { key: 'Timestamp_des', label: 'ถึงปลายทาง', icon: '🎯' },
  { key: 'Timestamp_stload', label: 'เริ่มลงสินค้า', icon: '📥' },
  { key: 'Timestamp_enload', label: 'ลงสินค้าเสร็จ', icon: '✅' },
  { key: 'Timestamp_ended', label: 'เสร็จงาน', icon: '🏁' }
];
