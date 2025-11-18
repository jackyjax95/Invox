import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Item interface for invoices and quotes
export interface InvoiceItem {
  description: string
  quantity: number
  price: number
}

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      invoices: {
        Row: {
          id: string
          invoice_number: string
          user_id: string
          client_name: string
          client_email: string
          items: InvoiceItem[]
          total: number
          status: string
          created_at: string
          due_date: string | null
          description?: string
        }
        Insert: {
          id?: string
          invoice_number: string
          user_id: string
          client_name: string
          client_email?: string
          items?: InvoiceItem[]
          total: number
          status?: string
          created_at?: string
          due_date?: string | null
          description?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          user_id?: string
          client_name?: string
          client_email?: string
          items?: InvoiceItem[]
          total?: number
          status?: string
          created_at?: string
          due_date?: string | null
          description?: string
        }
      }
      quotes: {
        Row: {
          id: string
          user_id: string
          client_name: string
          client_email: string
          items: InvoiceItem[]
          total: number
          status: string
          created_at: string
          valid_until: string
          description?: string
        }
        Insert: {
          id?: string
          user_id: string
          client_name: string
          client_email?: string
          items?: InvoiceItem[]
          total: number
          status?: string
          created_at?: string
          valid_until: string
          description?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_name?: string
          client_email?: string
          items?: InvoiceItem[]
          total?: number
          status?: string
          created_at?: string
          valid_until?: string
          description?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          company?: string
          phone?: string
          address?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          company?: string
          phone?: string
          address?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          company?: string
          phone?: string
          address?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          vendor: string
          invoice_number: string
          description: string
          quantity: number
          amount: number
          category: string
          date: string
          vat_included: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vendor: string
          invoice_number: string
          description: string
          quantity: number
          amount: number
          category: string
          date: string
          vat_included?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vendor?: string
          invoice_number?: string
          description?: string
          quantity?: number
          amount?: number
          category?: string
          date?: string
          vat_included?: boolean
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name?: string
          company?: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string
          company?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          company?: string
          created_at?: string
        }
      }
    }
  }
}