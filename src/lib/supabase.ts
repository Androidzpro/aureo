import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ibgmvprphhdtxnlexkgz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZ212cHJwaGhkdHhubGV4a2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzAyMTksImV4cCI6MjA5MTQwNjIxOX0.wDi6SST4rxDSfwNGj9pv4Ks4UD14bQEB4RdC6YMT2Aw'

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
