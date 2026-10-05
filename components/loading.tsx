import React from 'react'

// Skeleton แบบเบา: ใช้ animation เดียว (pulse) ไม่มีรูป/ไอคอน ไม่กิน GPU บนมือถือรุ่นเล็ก
type LoadingProps = {
  variant?: 'list' | 'detail' | 'grid'
}

const Bar = ({ className = '' }: { className?: string }) => (
  <div className={`rounded-lg bg-gray-200 ${className}`} />
)

const ListSkeleton = () => (
  <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
    <div className="grid grid-cols-2 gap-3">
      <Bar className="h-20 rounded-2xl bg-white" />
      <Bar className="h-20 rounded-2xl bg-white" />
    </div>
    <Bar className="h-14 rounded-2xl" />
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="space-y-3 rounded-xl bg-white p-4">
        <div className="flex justify-between">
          <Bar className="h-5 w-1/3" />
          <Bar className="h-5 w-1/4 rounded-full" />
        </div>
        <Bar className="h-4 w-2/3" />
        <Bar className="h-4 w-full" />
      </div>
    ))}
  </div>
)

const DetailSkeleton = () => (
  <div className="mx-auto max-w-2xl space-y-4 p-5">
    <div className="flex items-center justify-between">
      <Bar className="h-10 w-24 bg-white" />
      <Bar className="h-14 w-14 rounded-full" />
    </div>
    <div className="space-y-3 rounded-xl bg-white p-5">
      <Bar className="h-6 w-1/2" />
      <Bar className="h-4 w-1/3" />
      <Bar className="h-4 w-full" />
      <Bar className="h-4 w-5/6" />
    </div>
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-4">
        <Bar className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bar className="h-4 w-1/2" />
          <Bar className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
)

const GridSkeleton = () => (
  <div className="mx-auto max-w-2xl space-y-4 p-5">
    <Bar className="h-10 w-32 bg-white" />
    <div className="space-y-4 rounded-2xl bg-white p-6">
      <Bar className="h-6 w-1/3" />
      <Bar className="h-32 w-full rounded-xl" />
    </div>
    <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-6">
      {[0, 1, 2, 3].map((i) => (
        <Bar key={i} className="aspect-square w-full rounded-xl" />
      ))}
    </div>
  </div>
)

export const Loading = ({ variant = 'list' }: LoadingProps) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="กำลังโหลดข้อมูล"
      className="min-h-screen animate-pulse bg-gradient-to-br from-green-50 to-emerald-100 pb-28"
    >
      {variant === 'list' && <ListSkeleton />}
      {variant === 'detail' && <DetailSkeleton />}
      {variant === 'grid' && <GridSkeleton />}
    </div>
  )
}
