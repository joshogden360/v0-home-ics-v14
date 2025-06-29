import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// User state
export const userAtom = atomWithStorage<{
  id: string
  email: string
  name: string
} | null>('user', null)

// Auth state
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null)

// Login form state
export const loginFormAtom = atom({
  email: '',
  password: '',
  phone: '',
  isSubmitting: false,
  error: null as string | null,
  method: 'email' as 'email' | 'phone' | 'oauth'
})

// Signup form state
export const signupFormAtom = atom({
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  isSubmitting: false,
  error: null as string | null,
  method: 'email' as 'email' | 'phone' | 'oauth'
})

// Auth loading state
export const authLoadingAtom = atom(false)

// Session token
export const sessionTokenAtom = atomWithStorage<string | null>('sessionToken', null) 