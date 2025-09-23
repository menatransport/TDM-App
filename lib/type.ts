import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

// lib/type.ts
export interface TransportItem {
  load_id: string;
  date_plan: string;
  h_plate: string;
  t_plate: string;
  fuel_type: string;
  height: string;
  weight: string;
  driver_name: string;
  phone: string;
  status: string;
  remark: string;
  job_type: string;
  locat_recive: string;
  locat_deliver: string;
  date_recive: string;
  date_deliver: string;
  latlng_deliver: string;
  latlng_recive: string;
  pallet_type: string;
  pallet_plan: number;
  unload_cost: string;
  create_by: string;
  create_at: string;
  update_by: string;
  update_at: string;
  driver_info: {
    latlng_current: string;
    timestamp_login: string;
  };
  ticket_info?: {
    start_datetime?: string;
    origin_datetime?: string;
    start_recive_datetime?: string;
    end_recive_datetime?: string;
    intransit_datetime?: string;
    destination_datetime?: string;
    docs_submitted_datetime?: string;
    start_unload_datetime?: string;
    docs_returned_datetime?: string;
    end_unload_datetime?: string;
    complete_datetime?: string;
  };
}
