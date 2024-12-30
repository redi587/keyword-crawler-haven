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
          url: string
          title: string | null
          content: string | null
          crawled_at: string
          source: string | null
        }
        Insert: {
          id?: number
          url: string
          title?: string | null
          content?: string | null
          crawled_at?: string
          source?: string | null
        }
        Update: {
          id?: number
          url?: string
          title?: string | null
          content?: string | null
          crawled_at?: string
          source?: string | null
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
        }
        Insert: {
          id?: number
          url: string
          start_time?: string | null
          end_time?: string | null
          check_interval?: number | null
          active?: boolean
        }
        Update: {
          id?: number
          url?: string
          start_time?: string | null
          end_time?: string | null
          check_interval?: number | null
          active?: boolean
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
          matched_at: string
        }
        Insert: {
          id?: number
          article_id: number
          keyword_id: number
          matched_at?: string
        }
        Update: {
          id?: number
          article_id?: number
          keyword_id?: number
          matched_at?: string
        }
      }
    }
  }
}