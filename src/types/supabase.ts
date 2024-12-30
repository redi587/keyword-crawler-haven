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
      articles: {
        Row: {
          id: number
          title: string
          content: string | null
          url: string
          source: string
          crawled_at: string
          created_at: string
        }
        Insert: {
          id?: number
          title: string
          content?: string | null
          url: string
          source: string
          crawled_at?: string
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string | null
          url?: string
          source?: string
          crawled_at?: string
          created_at?: string
        }
      }
      crawler_configs: {
        Row: {
          id: number
          url: string
          start_time: string | null
          end_time: string | null
          check_interval: number | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          url: string
          start_time?: string | null
          end_time?: string | null
          check_interval?: number | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          url?: string
          start_time?: string | null
          end_time?: string | null
          check_interval?: number | null
          active?: boolean
          created_at?: string
        }
      }
      keywords: {
        Row: {
          id: number
          term: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          term: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          term?: string
          active?: boolean
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: number
          article_id: number
          keyword_id: number
          created_at: string
        }
        Insert: {
          id?: number
          article_id: number
          keyword_id: number
          created_at?: string
        }
        Update: {
          id?: number
          article_id?: number
          keyword_id?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}