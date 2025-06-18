// store/useJobStore.ts
import { create } from 'zustand'

type Job = any // หรือกำหนด type ตามจริง

interface JobStore {
  selectedJob: Job | null
  setJob: (job: Job) => void
}

export const useJobStore = create<JobStore>((set) => ({
  selectedJob: null,
  setJob: (job) => set({ selectedJob: job })
}))
