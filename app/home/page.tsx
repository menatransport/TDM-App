"use client";
import React, { useState } from "react";
import { Navbars } from "@/components/Navbars";
import { Jobcards, Jobcount } from "@/components/Jobcards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { useRouter } from "next/navigation";
import { Funnel, Inbox } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const Home = () => {
  // const router = useRouter();
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด");
  const handledropdown = (val: string) => {
    console.log('val : ',val)
  };
  const count = Jobcount();
  console.log("count", count);
  return (
    <>
      <Navbars />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex justify-center px-4 py-3 relative overflow-hidden">
        {/* Background Bubbles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-200 bg-opacity-30 rounded-full animate-pulse"></div>
          <div className="absolute top-1/4 -right-16 w-32 h-32 bg-emerald-200 bg-opacity-20 rounded-full "></div>
          <div className="absolute bottom-1/4 -left-12 w-24 h-24 bg-green-300 bg-opacity-25 rounded-full "></div>
          <div className="absolute bottom-20 right-1/4 w-16 h-16 bg-emerald-300 bg-opacity-30 rounded-full "></div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col z-10 w-full space-y-4">
          {/* Heading + Top Buttons */}
          <div className="flex justify-between items-center gap-2">
            <p className="text-xl sm:text-xl text-center font-semibold text-gray-800">
              งานขนส่งของฉัน
            </p>

            <div className="flex gap-2 flex-reverse sm:flex-row flex-col">
              {/* <Button
                variant="outline"
                onClick={() => router.push("/home")}
                className="flex items-center bg-white space-x-2 hover:shadow-lg hover:-translate-y-1"
              >
                <RefreshCcw className="h-4 w-4" />
                <span>รีเฟรช</span>
              </Button> */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center bg-white border border-gray-500 space-x-2 hover:shadow-lg hover:-translate-y-1">
                    <Inbox className="h-4 w-4" />
                    <span>ระบบพาเลท</span>
                  </Button>
                </DialogTrigger>
                <DialogContent  
                  onInteractOutside={(e) => e.preventDefault()}
                  className="bg-white border border-gray-500">
                  <DialogHeader>
                    <DialogTitle>ระบบพาเลท</DialogTitle>
                    <DialogDescription className="text-[11px] text-gray-700">
                      กรอกข้อมูลเกี่ยวกับพาเลทที่มีการเบิกเข้า-เบิกออก พื้นที่ ออฟฟิศ TDM
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-row items-center gap-2">
                  <Badge className="text-center bg-green-200 p-1.5">เลือกรายการ</Badge>
                  <select className="w-50 border text-[13px] p-1 text-center border-gray-300 rounded-md"
                  onChange={(value)=>handledropdown}
                  ><option value=""></option>
                  <option value="เบิกเข้า">เบิกเข้า</option>
                  <option value="เบิกออก">เบิกออก</option>
                  </select>
                  </div>
                  <div className="grid grid-cols-3 gap-10 ml-4">
                  <p>Hello</p>
                  <p>Hello</p>
                  <p>Hello</p>
                  </div>
                  <DialogFooter className="sm:justify-start">
                   {/* Button Submit and close ยกเลิก */}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <Funnel />
            <button
              onClick={() => setFilterStatus("ทั้งหมด")}
              className={`inline-flex items-center gap-x-2 p-2 px-2 text-sm rounded-xl border font-medium hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === "ทั้งหมด"
                  ? "bg-black text-white"
                  : "bg-white border-gray-200"
              }`}
            >
              <span>ทั้งหมด</span>
              <span className="bg-gray-100 text-black rounded-full px-2 text-sm">
                {count.totalCount}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus("รอดำเนินงาน")}
              className={`inline-flex items-center gap-x-2 p-2 px-2 text-sm rounded-xl border font-medium hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === "รอดำเนินงาน"
                  ? "bg-black text-white"
                  : "bg-white border-gray-200"
              }`}
            >
              <span>รอดำเนินงาน</span>
              <span className="bg-gray-100 text-black rounded-full px-2 text-sm">
                {count.inProgressCount}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus("ขนส่งสำเร็จ")}
              className={`inline-flex items-center gap-x-2 p-2 px-2 text-sm rounded-xl border font-medium hover:shadow-lg hover:-translate-y-1 ${
                filterStatus === "ขนส่งสำเร็จ"
                  ? "bg-black text-white"
                  : "bg-white border-gray-200"
              }`}
            >
              <span>สำเร็จ</span>
              <span className="bg-gray-100 text-black rounded-full px-2 text-sm">
                {count.completedCount}
              </span>
            </button>
          </div>

          {/* Job Cards */}
          <Jobcards filterStatus={filterStatus} />
        </div>
      </div>
    </>
  );
};

export default Home;
