export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          full_name: string
          initials: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          full_name: string
          initials: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          full_name?: string
          initials?: string
          created_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      brands: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          is_active: boolean
          is_pinned: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          is_active?: boolean
          is_pinned?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          is_active?: boolean
          is_pinned?: boolean
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      items: {
        Row: {
          id: string
          name: string
          product_id: string
          image_url: string | null
          brand_id: string
          is_shared: boolean
          is_active: boolean
          original_quantity: number
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          product_id: string
          image_url?: string | null
          brand_id: string
          is_shared?: boolean
          is_active?: boolean
          original_quantity: number
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          product_id?: string
          image_url?: string | null
          brand_id?: string
          is_shared?: boolean
          is_active?: boolean
          original_quantity?: number
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_brand_id_fkey"
            columns: ["brand_id"]
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      item_sizes: {
        Row: {
          id: string
          item_id: string
          size: string
          original_quantity: number
          available_quantity: number
          in_circulation: number
        }
        Insert: {
          id?: string
          item_id: string
          size: string
          original_quantity: number
          available_quantity: number
          in_circulation?: number
        }
        Update: {
          id?: string
          item_id?: string
          size?: string
          original_quantity?: number
          available_quantity?: number
          in_circulation?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_sizes_item_id_fkey"
            columns: ["item_id"]
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
      shared_items: {
        Row: {
          id: string
          item_id: string
          brand_id: string
        }
        Insert: {
          id?: string
          item_id: string
          brand_id: string
        }
        Update: {
          id?: string
          item_id?: string
          brand_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_items_item_id_fkey"
            columns: ["item_id"]
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_items_brand_id_fkey"
            columns: ["brand_id"]
            referencedRelation: "brands"
            referencedColumns: ["id"]
          }
        ]
      }
      promoters: {
        Row: {
          id: string
          name: string
          photo_url: string | null
          address: string | null
          clothing_size: string | null
          phone_number: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          photo_url?: string | null
          address?: string | null
          clothing_size?: string | null
          phone_number?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          photo_url?: string | null
          address?: string | null
          clothing_size?: string | null
          phone_number?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promoters_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          transaction_type: Database['public']['Enums']['transaction_type']
          item_id: string
          item_size_id: string
          quantity: number
          promoter_id: string | null
          employee_id: string
          timestamp: string
          notes: string | null
        }
        Insert: {
          id?: string
          transaction_type: Database['public']['Enums']['transaction_type']
          item_id: string
          item_size_id: string
          quantity: number
          promoter_id?: string | null
          employee_id: string
          timestamp?: string
          notes?: string | null
        }
        Update: {
          id?: string
          transaction_type?: Database['public']['Enums']['transaction_type']
          item_id?: string
          item_size_id?: string
          quantity?: number
          promoter_id?: string | null
          employee_id?: string
          timestamp?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_item_id_fkey"
            columns: ["item_id"]
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_item_size_id_fkey"
            columns: ["item_size_id"]
            referencedRelation: "item_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_promoter_id_fkey"
            columns: ["promoter_id"]
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      transaction_type: 'take_out' | 'return' | 'burn' | 'restock'
    }
  }
} 