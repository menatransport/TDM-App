import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  username: string
  password: string
  isLoggedIn: boolean
  jwtToken: string
  accessToken: string
  role: string
  isRemembered: boolean
}

interface UserActions {
  setUser: (userData: Partial<UserState>) => void
  setCredentials: (username: string, password: string, remember?: boolean) => void
  setLoginData: (data: {
    username: string
    password: string
    jwtToken: string
    accessToken: string
    role: string
    remember?: boolean
  }) => void
  updateProfile: (username?: string, newPassword?: string) => void
  logout: () => void
  clearCredentials: () => void
}

type UserStore = UserState & UserActions

const initialState: UserState = {
  username: '',
  password: '',
  isLoggedIn: false,
  jwtToken: '',
  accessToken: '',
  role: '',
  isRemembered: false
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (userData) => set((state) => ({
        ...state,
        ...userData
      })),

      setCredentials: (username, password, remember = false) => set((state) => ({
        ...state,
        username,
        password: remember ? password : '',
        isRemembered: remember
      })),

      setLoginData: (data) => set((state) => ({
        ...state,
        username: data.username,
        password: data.password,
        jwtToken: data.jwtToken,
        accessToken: data.accessToken,
        role: data.role,
        isLoggedIn: true,
        isRemembered: data.remember || false
      })),

      updateProfile: (username, newPassword) => set((state) => ({
        ...state,
        username: username || state.username,
        password: newPassword || state.password
      })),

      logout: () => set(() => ({
        ...initialState
      })),

      clearCredentials: () => set((state) => ({
        ...state,
        password: '',
        isRemembered: false
      }))
    }),
    {
      name: 'user-storage',
      // เลือกเฉพาะข้อมูลที่ต้องการ persist
      partialize: (state) => ({
        username: state.isRemembered ? state.username : '',
        password: state.isRemembered ? state.password : '',
        isLoggedIn: state.isLoggedIn,
        jwtToken: state.jwtToken,
        accessToken: state.accessToken,
        role: state.role,
        isRemembered: state.isRemembered
      })
    }
  )
)

// Selectors สำหรับใช้งานง่ายขึ้น
export const useUsername = () => useUserStore((state) => state.username)
export const usePassword = () => useUserStore((state) => state.password)
export const useIsLoggedIn = () => useUserStore((state) => state.isLoggedIn)
export const useUserRole = () => useUserStore((state) => state.role)
export const useIsRemembered = () => useUserStore((state) => state.isRemembered)

interface ListNameStore {
  listname: string[]
  setListname: (name: string[]) => void
}

export const useListName = create<ListNameStore>()((set) => ({
  listname: [],
  setListname: (name: string[]) => set({ listname: name })
}))

export const usegetListName = () => useListName((state) => state.listname)
