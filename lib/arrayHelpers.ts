// utils/arrayHelpers.ts

/**
 * ตรวจสอบว่าข้อมูลเป็น array หรือไม่ และคืนค่าเป็น array เสมอ
 */
export const ensureArray = <T>(data: any): T[] => {
  if (Array.isArray(data)) {
    return data;
  }
  
  // ถ้าเป็น null หรือ undefined
  if (data == null) {
    console.warn('Data is null or undefined, returning empty array');
    return [];
  }
  
  // ถ้าเป็น object แต่ไม่ใช่ array
  if (typeof data === 'object') {
    console.warn('Data is object but not array:', data);
    return [];
  }
  
  // ถ้าเป็น primitive value อื่นๆ
  console.warn('Data is not iterable:', typeof data, data);
  return [];
};

/**
 * Safe map operation - ตรวจสอบว่าเป็น array ก่อนทำ map
 */
export const safeMap = <T, U>(
  data: any,
  callback: (item: T, index: number, array: T[]) => U
): U[] => {
  const safeArray = ensureArray<T>(data);
  return safeArray.map(callback);
};

/**
 * Safe filter operation
 */
export const safeFilter = <T>(
  data: any,
  callback: (item: T, index: number, array: T[]) => boolean
): T[] => {
  const safeArray = ensureArray<T>(data);
  return safeArray.filter(callback);
};

/**
 * Safe find operation
 */
export const safeFind = <T>(
  data: any,
  callback: (item: T, index: number, array: T[]) => boolean
): T | undefined => {
  const safeArray = ensureArray<T>(data);
  return safeArray.find(callback);
};

/**
 * Safe length getter
 */
export const safeLength = (data: any): number => {
  const safeArray = ensureArray(data);
  return safeArray.length;
};

/**
 * ตรวจสอบและแปลงข้อมูล API response ให้เป็นรูปแบบที่ถูกต้อง
 */
export const normalizeApiResponse = (response: any) => {
  // ถ้า response เป็น array โดยตรง
  if (Array.isArray(response)) {
    return { jobs: response, success: true };
  }
  
  // ถ้า response เป็น object และมี jobs property
  if (response && typeof response === 'object') {
    if (Array.isArray(response.jobs)) {
      return response;
    }
    
    // ถ้ามี data property แทน jobs
    if (Array.isArray(response.data)) {
      return { jobs: response.data, success: true };
    }
    
    // ถ้ามี items property
    if (Array.isArray(response.items)) {
      return { jobs: response.items, success: true };
    }
    
    // ถ้าเป็น object เดี่ยวๆ ให้ห่อด้วย array
    if (response.load_id || response.id) {
      return { jobs: [response], success: true };
    }
  }
  
  // กรณีอื่นๆ คืนค่า empty array
  console.warn('Unable to normalize API response:', response);
  return { jobs: [], success: false };
};