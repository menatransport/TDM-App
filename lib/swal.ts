import type { SweetAlertOptions, SweetAlertResult } from "sweetalert2";

// โหลด sweetalert2 ตอนเรียกใช้ครั้งแรก แทนการโหลดพร้อมหน้า (ลดขนาดไฟล์ฝั่งคนขับ)
export const Swal = {
  fire: async (options: SweetAlertOptions): Promise<SweetAlertResult> => {
    const { default: sweetalert } = await import("sweetalert2");
    return sweetalert.fire(options);
  },
};
