import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ibgmvprphhdtxnlexkgz.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          password: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          password: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<{
          id: string
          email: string
          name: string
          password: string
          created_at: string
          updated_at: string
        }>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          category: string
          description: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: string
          category: string
          description: string
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<{
          id: string
          user_id: string
          amount: number
          type: string
          category: string
          description: string
          date: string
          created_at: string
          updated_at: string
        }>
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          amount: number
          period: string
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          amount: number
          period: string
          start_date: string
          end_date: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<{
          id: string
          user_id: string
          category: string
          amount: number
          period: string
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
        }>
      }
    }
  }
}
