export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          first_name: string | null
          id: string
          intention: string | null
          last_name: string | null
          linkedin_url: string | null // NEW: Added linkedin_url
          organization: string | null
          sociability: number | null
          updated_at: string | null
          host_code: string | null // NEW: Added host_code
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          first_name?: string | null
          id: string
          intention?: string | null
          last_name?: string | null
          linkedin_url?: string | null // NEW: Added linkedin_url
          organization?: string | null
          sociability?: number | null
          updated_at?: string | null
          host_code?: string | null // NEW: Added host_code
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          first_name?: string | null
          id?: string
          intention?: string | null
          last_name?: string | null
          linkedin_url?: string | null // NEW: Added linkedin_url
          organization?: string | null
          sociability?: number | null
          updated_at?: string | null
          host_code?: string | null // NEW: Added host_code
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          active_asks: Json | null // NEW: Added active_asks column
          break_duration_seconds: number
          coworker_count: number
          created_at: string | null
          focus_duration_seconds: number
          id: string
          notes: string | null
          session_end_time: string
          session_start_time: string
          title: string
          total_session_seconds: number
          user_id: string | null
        }
        Insert: {
          active_asks?: Json | null // NEW: Added active_asks column
          break_duration_seconds?: number
          coworker_count?: number
          created_at?: string | null
          focus_duration_seconds?: number
          id?: string
          notes?: string | null
          session_end_time: string
          session_start_time: string
          title: string
          total_session_seconds?: number
          user_id?: string | null
        }
        Update: {
          active_asks?: Json | null // NEW: Added active_asks column
          break_duration_seconds?: number
          coworker_count?: number
          created_at?: string | null
          focus_duration_seconds?: number
          id?: string
          notes?: string | null
          session_end_time?: string
          session_start_time?: string
          title?: string
          total_session_seconds?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: Record<PropertyKey, never>
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type PublicSchema = DatabaseWithoutInternals['public']

export type Tables<
  SchemaName extends keyof DatabaseWithoutInternals = 'public',
  TableName extends keyof (DatabaseWithoutInternals[SchemaName]['Tables'] & DatabaseWithoutInternals[SchemaName]['Views']) = keyof (DatabaseWithoutInternals[SchemaName]['Tables'] & DatabaseWithoutInternals[SchemaName]['Views']),
> = (DatabaseWithoutInternals[SchemaName]['Tables'] & DatabaseWithoutInternals[SchemaName]['Views'])[TableName] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<
  SchemaName extends keyof DatabaseWithoutInternals = 'public',
  TableName extends keyof DatabaseWithoutInternals[SchemaName]['Tables'] = keyof DatabaseWithoutInternals[SchemaName]['Tables'],
> = DatabaseWithoutInternals[SchemaName]['Tables'][TableName] extends {
  Insert: infer I
}
  ? I
  : never

export type TablesUpdate<
  SchemaName extends keyof DatabaseWithoutInternals = 'public',
  TableName extends keyof DatabaseWithoutInternals[SchemaName]['Tables'] = keyof DatabaseWithoutInternals[SchemaName]['Tables'],
> = DatabaseWithoutInternals[SchemaName]['Tables'][TableName] extends {
  Update: infer U
}
  ? U
  : never

export type Enums<
  SchemaName extends keyof DatabaseWithoutInternals = 'public',
  EnumName extends keyof DatabaseWithoutInternals[SchemaName]['Enums'] = keyof DatabaseWithoutInternals[SchemaName]['Enums'],
> = DatabaseWithoutInternals[SchemaName]['Enums'][EnumName]

export type CompositeTypes<
  SchemaName extends keyof DatabaseWithoutInternals = 'public',
  CompositeTypeName extends keyof DatabaseWithoutInternals[SchemaName]['CompositeTypes'] = keyof DatabaseWithoutInternals[SchemaName]['CompositeTypes'],
> = DatabaseWithoutInternals[SchemaName]['CompositeTypes'][CompositeTypeName]

export const Constants = {
  public: {
    Enums: {},
  },
} as const