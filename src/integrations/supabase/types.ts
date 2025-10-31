export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          linkedin_url: string | null
          organization: string | null
          sociability: number | null
          updated_at: string | null
          host_code: string | null
          bio_visibility: ("public" | "friends" | "organisation" | "private")[] | null
          intention_visibility: ("public" | "friends" | "organisation" | "private")[] | null
          linkedin_visibility: ("public" | "friends" | "organisation" | "private")[] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          first_name?: string | null
          id: string
          intention?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          organization?: string | null
          sociability?: number | null
          updated_at?: string | null
          host_code?: string | null
          bio_visibility?: ("public" | "friends" | "organisation" | "private")[] | null
          intention_visibility?: ("public" | "friends" | "organisation" | "private")[] | null
          linkedin_visibility?: ("public" | "friends" | "organisation" | "private")[] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          first_name?: string | null
          id?: string
          intention?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          organization?: string | null
          sociability?: number | null
          updated_at?: string | null
          host_code?: string | null
          bio_visibility?: ("public" | "friends" | "organisation" | "private")[] | null
          intention_visibility?: ("public" | "friends" | "organisation" | "private")[] | null
          linkedin_visibility?: ("public" | "friends" | "organisation" | "private")[] | null
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
          active_asks: Json | null
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
          active_asks?: Json | null
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
          active_asks?: Json | null
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

type PublicSchema = Database['public']

export type Tables<
  SchemaName extends keyof Database = 'public',
  TableName extends keyof (Database[SchemaName]['Tables'] & Database[SchemaName]['Views']) = keyof (Database[SchemaName]['Tables'] & Database[SchemaName]['Views']),
> = (Database[SchemaName]['Tables'] & Database[SchemaName]['Views'])[TableName] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<
  SchemaName extends keyof Database = 'public',
  TableName extends keyof Database[SchemaName]['Tables'] = keyof Database[SchemaName]['Tables'],
> = Database[SchemaName]['Tables'][TableName] extends {
  Insert: infer I
}
  ? I
  : never

export type TablesUpdate<
  SchemaName extends keyof Database = 'public',
  TableName extends keyof Database[SchemaName]['Tables'] = keyof Database[SchemaName]['Tables'],
> = Database[SchemaName]['Tables'][TableName] extends {
  Update: infer U
}
  ? U
  : never

export type Enums<
  SchemaName extends keyof Database = 'public',
  EnumName extends keyof Database[SchemaName]['Enums'] = keyof Database[SchemaName]['Enums'],
> = Database[SchemaName]['Enums'][EnumName]

export type CompositeTypes<
  SchemaName extends keyof Database = 'public',
  CompositeTypeName extends keyof Database[SchemaName]['CompositeTypes'] = keyof Database[SchemaName]['CompositeTypes'],
> = Database[SchemaName]['CompositeTypes'][CompositeTypeName]

export const Constants = {
  public: {
    Enums: {},
  },
} as const