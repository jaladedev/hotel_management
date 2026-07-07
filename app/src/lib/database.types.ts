export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cash_reconciliations: {
        Row: {
          counted_cash: number
          created_at: string
          expected_cash: number
          id: string
          notes: string | null
          reconciliation_date: string
          recorded_by: string
          variance: number
        }
        Insert: {
          counted_cash: number
          created_at?: string
          expected_cash: number
          id?: string
          notes?: string | null
          reconciliation_date: string
          recorded_by: string
          variance?: number
        }
        Update: {
          counted_cash?: number
          created_at?: string
          expected_cash?: number
          id?: string
          notes?: string | null
          reconciliation_date?: string
          recorded_by?: string
          variance?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_reconciliations_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bookings: {
        Row: {
          catering_notes: string | null
          contact_guest_id: string
          created_at: string
          created_by: string | null
          end_time: string
          event_date: string
          event_name: string
          event_space_id: string
          headcount: number | null
          id: string
          linked_reservation_id: string | null
          paid_amount: number
          paid_method: Database["public"]["Enums"]["payment_method"] | null
          rate_quoted: number
          setup_type: string | null
          start_time: string
          status: Database["public"]["Enums"]["event_booking_status"]
        }
        Insert: {
          catering_notes?: string | null
          contact_guest_id: string
          created_at?: string
          created_by?: string | null
          end_time: string
          event_date: string
          event_name: string
          event_space_id: string
          headcount?: number | null
          id?: string
          linked_reservation_id?: string | null
          paid_amount?: number
          paid_method?: Database["public"]["Enums"]["payment_method"] | null
          rate_quoted: number
          setup_type?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["event_booking_status"]
        }
        Update: {
          catering_notes?: string | null
          contact_guest_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          event_date?: string
          event_name?: string
          event_space_id?: string
          headcount?: number | null
          id?: string
          linked_reservation_id?: string | null
          paid_amount?: number
          paid_method?: Database["public"]["Enums"]["payment_method"] | null
          rate_quoted?: number
          setup_type?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_contact_guest_id_fkey"
            columns: ["contact_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_event_space_id_fkey"
            columns: ["event_space_id"]
            isOneToOne: false
            referencedRelation: "event_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_linked_reservation_id_fkey"
            columns: ["linked_reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_spaces: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          hourly_rate: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          capacity: number
          created_at?: string
          description?: string | null
          hourly_rate: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          hourly_rate?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      fnb_order_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          menu_item_id: string | null
          notes: string | null
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          menu_item_id?: string | null
          notes?: string | null
          order_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          menu_item_id?: string | null
          notes?: string | null
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fnb_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fnb_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "fnb_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      fnb_orders: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          order_type: Database["public"]["Enums"]["fnb_order_type"]
          paid_amount: number | null
          paid_method: Database["public"]["Enums"]["payment_method"] | null
          reservation_id: string | null
          status: Database["public"]["Enums"]["fnb_order_status"]
          table_id: string | null
          walkin_guest_name: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          order_type: Database["public"]["Enums"]["fnb_order_type"]
          paid_amount?: number | null
          paid_method?: Database["public"]["Enums"]["payment_method"] | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["fnb_order_status"]
          table_id?: string | null
          walkin_guest_name?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          order_type?: Database["public"]["Enums"]["fnb_order_type"]
          paid_amount?: number | null
          paid_method?: Database["public"]["Enums"]["payment_method"] | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["fnb_order_status"]
          table_id?: string | null
          walkin_guest_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fnb_orders_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fnb_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      folio_line_items: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          folio_id: string
          id: string
          payment_id: string | null
          type: Database["public"]["Enums"]["line_item_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description: string
          folio_id: string
          id?: string
          payment_id?: string | null
          type: Database["public"]["Enums"]["line_item_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          folio_id?: string
          id?: string
          payment_id?: string | null
          type?: Database["public"]["Enums"]["line_item_type"]
        }
        Relationships: [
          {
            foreignKeyName: "folio_line_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folio_line_items_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folio_line_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      folios: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          reservation_id: string
          security_deposit_amount: number
          security_deposit_status: string
          status: Database["public"]["Enums"]["folio_status"]
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          reservation_id: string
          security_deposit_amount?: number
          security_deposit_status?: string
          status?: Database["public"]["Enums"]["folio_status"]
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          reservation_id?: string
          security_deposit_amount?: number
          security_deposit_status?: string
          status?: Database["public"]["Enums"]["folio_status"]
        }
        Relationships: [
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      group_bookings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          primary_guest_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          primary_guest_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          primary_guest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_bookings_primary_guest_id_fkey"
            columns: ["primary_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          id_number: string | null
          id_type: string | null
          is_repeat_guest: boolean
          last_name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          is_repeat_guest?: boolean
          last_name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          is_repeat_guest?: boolean
          last_name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          name: string
          price: number
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name: string
          price: number
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          folio_id: string
          id: string
          is_security_deposit: boolean
          method: Database["public"]["Enums"]["payment_method"]
          paystack_reference: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          folio_id: string
          id?: string
          is_security_deposit?: boolean
          method: Database["public"]["Enums"]["payment_method"]
          paystack_reference?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          folio_id?: string
          id?: string
          is_security_deposit?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          paystack_reference?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_plans: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          nightly_rate: number
          room_type_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          nightly_rate: number
          room_type_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          nightly_rate?: number
          room_type_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_plans_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          folio_id: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paystack_refund_reference: string | null
          payment_id: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: Database["public"]["Enums"]["refund_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          folio_id: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          paystack_refund_reference?: string | null
          payment_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          folio_id?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paystack_refund_reference?: string | null
          payment_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
        }
        Relationships: [
          {
            foreignKeyName: "refunds_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          created_by: string | null
          group_booking_id: string | null
          guest_id: string
          id: string
          rate_applied: number
          room_id: string | null
          room_type_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          created_by?: string | null
          group_booking_id?: string | null
          guest_id: string
          id?: string
          rate_applied: number
          room_id?: string | null
          room_type_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          created_by?: string | null
          group_booking_id?: string | null
          guest_id?: string
          id?: string
          rate_applied?: number
          room_id?: string | null
          room_type_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          created_at: string
          id: string
          seats: number
          status: Database["public"]["Enums"]["table_status"]
          table_number: string
        }
        Insert: {
          created_at?: string
          id?: string
          seats?: number
          status?: Database["public"]["Enums"]["table_status"]
          table_number: string
        }
        Update: {
          created_at?: string
          id?: string
          seats?: number
          status?: Database["public"]["Enums"]["table_status"]
          table_number?: string
        }
        Relationships: []
      }
      room_types: {
        Row: {
          amenities: string[] | null
          base_rate: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_occupancy: number
          name: string
          photos: string[] | null
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          base_rate: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_occupancy: number
          name: string
          photos?: string[] | null
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          base_rate?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_occupancy?: number
          name?: string
          photos?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          floor: string | null
          id: string
          out_of_order_reason: string | null
          room_number: string
          room_type_id: string
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor?: string | null
          id?: string
          out_of_order_reason?: string | null
          room_number: string
          room_type_id: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor?: string | null
          id?: string
          out_of_order_reason?: string | null
          room_number?: string
          room_type_id?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["staff_role"]
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          role: Database["public"]["Enums"]["staff_role"]
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["staff_role"]
        }
        Relationships: []
      }
      tax_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_inclusive: boolean
          name: string
          rate_percent: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_inclusive?: boolean
          name: string
          rate_percent: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_inclusive?: boolean
          name?: string
          rate_percent?: number
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          emailed_at: string | null
          guest_id: string
          id: string
          notified_at: string | null
          promoted_reservation_id: string | null
          room_type_id: string
          status: Database["public"]["Enums"]["waitlist_status"]
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          emailed_at?: string | null
          guest_id: string
          id?: string
          notified_at?: string | null
          promoted_reservation_id?: string | null
          room_type_id: string
          status?: Database["public"]["Enums"]["waitlist_status"]
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          emailed_at?: string | null
          guest_id?: string
          id?: string
          notified_at?: string | null
          promoted_reservation_id?: string | null
          room_type_id?: string
          status?: Database["public"]["Enums"]["waitlist_status"]
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_promoted_reservation_id_fkey"
            columns: ["promoted_reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      folio_balances: {
        Row: {
          balance: number | null
          folio_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folio_line_items_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
        ]
      }
      fnb_order_totals: {
        Row: {
          order_id: string | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fnb_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "fnb_orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_exclusive_tax: {
        Args: {
          p_subtotal: number
        }
        Returns: number
      }
      calculate_stay_subtotal: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_room_type_id: string
        }
        Returns: number
      }
      check_event_space_availability: {
        Args: {
          p_end_time: string
          p_event_date: string
          p_event_space_id: string
          p_exclude_booking_id?: string | null
          p_start_time: string
        }
        Returns: boolean
      }
      check_availability: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_room_type_id: string
        }
        Returns: number
      }
      check_availability_excluding_reservation: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_exclude_reservation_id: string
          p_room_type_id: string
        }
        Returns: number
      }
      create_reservation: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_created_by: string | null
          p_guest_id: string
          p_rate_applied: number
          p_room_type_id: string
          p_total_amount: number
        }
        Returns: string
      }
      current_staff_role: {
        Args: never
        Returns: Database["public"]["Enums"]["staff_role"]
      }
      mark_no_shows: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      event_booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      fnb_order_status: "open" | "served" | "closed" | "cancelled"
      fnb_order_type: "dine_in" | "room_service"
      folio_status: "open" | "closed"
      line_item_type:
        | "room_charge"
        | "tax"
        | "incidental"
        | "discount"
        | "deposit_booking"
        | "deposit_security"
        | "payment"
        | "refund"
      payment_method: "paystack" | "cash"
      payment_status: "pending" | "success" | "failed" | "refunded"
      reservation_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
        | "no_show"
      refund_status: "pending" | "processed" | "failed"
      room_status: "vacant" | "occupied" | "dirty" | "clean" | "out_of_order"
      staff_role: "admin" | "front_desk" | "housekeeping"
      table_status: "available" | "occupied" | "reserved" | "cleaning"
      waitlist_status: "waiting" | "notified" | "promoted" | "cancelled" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_booking_status: ["pending", "confirmed", "cancelled", "completed"],
      fnb_order_status: ["open", "served", "closed", "cancelled"],
      fnb_order_type: ["dine_in", "room_service"],
      folio_status: ["open", "closed"],
      line_item_type: [
        "room_charge",
        "tax",
        "incidental",
        "discount",
        "deposit_booking",
        "deposit_security",
        "payment",
        "refund",
      ],
      payment_method: ["paystack", "cash"],
      payment_status: ["pending", "success", "failed", "refunded"],
      reservation_status: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
      refund_status: ["pending", "processed", "failed"],
      room_status: ["vacant", "occupied", "dirty", "clean", "out_of_order"],
      staff_role: ["admin", "front_desk", "housekeeping"],
      table_status: ["available", "occupied", "reserved", "cleaning"],
      waitlist_status: ["waiting", "notified", "promoted", "cancelled", "expired"],
    },
  },
} as const