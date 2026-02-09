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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ab_test_assignments: {
        Row: {
          assigned_at: string
          id: string
          session_id: string
          site_id: string
          test_id: string
          user_identifier: string | null
          variant_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          session_id: string
          site_id: string
          test_id: string
          user_identifier?: string | null
          variant_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          session_id?: string
          site_id?: string
          test_id?: string
          user_identifier?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ab_test_assignments_test_id"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ab_test_assignments_variant_id"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_test_results: {
        Row: {
          calculated_at: string
          confidence_interval_lower: number | null
          confidence_interval_upper: number | null
          conversion_rate: number
          conversions: number
          date: string
          id: string
          p_value: number | null
          revenue: number | null
          sessions: number
          site_id: string
          statistical_significance: number | null
          test_id: string
          variant_id: string
        }
        Insert: {
          calculated_at?: string
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          conversion_rate?: number
          conversions?: number
          date?: string
          id?: string
          p_value?: number | null
          revenue?: number | null
          sessions?: number
          site_id: string
          statistical_significance?: number | null
          test_id: string
          variant_id: string
        }
        Update: {
          calculated_at?: string
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          conversion_rate?: number
          conversions?: number
          date?: string
          id?: string
          p_value?: number | null
          revenue?: number | null
          sessions?: number
          site_id?: string
          statistical_significance?: number | null
          test_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ab_test_results_test_id"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ab_test_results_variant_id"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_test_variants: {
        Row: {
          created_at: string
          id: string
          is_control: boolean
          test_id: string
          traffic_percentage: number
          variant_config: Json | null
          variant_description: string | null
          variant_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_control?: boolean
          test_id: string
          traffic_percentage?: number
          variant_config?: Json | null
          variant_description?: string | null
          variant_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_control?: boolean
          test_id?: string
          traffic_percentage?: number
          variant_config?: Json | null
          variant_description?: string | null
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ab_test_variants_test_id"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          baseline_value: number | null
          confidence_level: number
          conversion_goal: string
          conversion_metric: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          minimum_sample_size: number | null
          site_id: string
          start_date: string | null
          target_lift: number | null
          test_description: string | null
          test_name: string
          test_status: string
          test_type: string
          traffic_allocation: Json
          updated_at: string
        }
        Insert: {
          baseline_value?: number | null
          confidence_level?: number
          conversion_goal: string
          conversion_metric?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          minimum_sample_size?: number | null
          site_id: string
          start_date?: string | null
          target_lift?: number | null
          test_description?: string | null
          test_name: string
          test_status?: string
          test_type?: string
          traffic_allocation?: Json
          updated_at?: string
        }
        Update: {
          baseline_value?: number | null
          confidence_level?: number
          conversion_goal?: string
          conversion_metric?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          minimum_sample_size?: number | null
          site_id?: string
          start_date?: string | null
          target_lift?: number | null
          test_description?: string | null
          test_name?: string
          test_status?: string
          test_type?: string
          traffic_allocation?: Json
          updated_at?: string
        }
        Relationships: []
      }
      agent_activity_log: {
        Row: {
          activity_type: string
          agent_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          request_method: string | null
          response_status: number | null
          response_time_ms: number | null
          site_id: string
          url: string | null
        }
        Insert: {
          activity_type: string
          agent_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          request_method?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          site_id: string
          url?: string | null
        }
        Update: {
          activity_type?: string
          agent_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          request_method?: string | null
          response_status?: number | null
          response_time_ms?: number | null
          site_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_activity_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_activity_log_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_macros: {
        Row: {
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          macro_type: string
          name: string
          site_id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          macro_type: string
          name: string
          site_id: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          macro_type?: string
          name?: string
          site_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_macros_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_registry: {
        Row: {
          agent_name: string
          agent_type: string
          api_key_hint: string | null
          created_at: string | null
          description: string | null
          endpoint_url: string | null
          id: string
          ip_range: string | null
          is_active: boolean | null
          last_seen_at: string | null
          organization_id: string | null
          site_id: string
          total_requests: number | null
          updated_at: string | null
          user_agent_pattern: string | null
        }
        Insert: {
          agent_name: string
          agent_type?: string
          api_key_hint?: string | null
          created_at?: string | null
          description?: string | null
          endpoint_url?: string | null
          id?: string
          ip_range?: string | null
          is_active?: boolean | null
          last_seen_at?: string | null
          organization_id?: string | null
          site_id: string
          total_requests?: number | null
          updated_at?: string | null
          user_agent_pattern?: string | null
        }
        Update: {
          agent_name?: string
          agent_type?: string
          api_key_hint?: string | null
          created_at?: string | null
          description?: string | null
          endpoint_url?: string | null
          id?: string
          ip_range?: string | null
          is_active?: boolean | null
          last_seen_at?: string | null
          organization_id?: string | null
          site_id?: string
          total_requests?: number | null
          updated_at?: string | null
          user_agent_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_registry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_registry_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_journey_steps: {
        Row: {
          asset_type: string | null
          created_at: string | null
          id: string
          page_type: string | null
          previous_url: string | null
          referrer: string | null
          request_type: string | null
          response_time_ms: number | null
          session_id: string
          site_id: string
          status_code: number | null
          step_number: number
          time_on_page_ms: number | null
          url: string
        }
        Insert: {
          asset_type?: string | null
          created_at?: string | null
          id?: string
          page_type?: string | null
          previous_url?: string | null
          referrer?: string | null
          request_type?: string | null
          response_time_ms?: number | null
          session_id: string
          site_id: string
          status_code?: number | null
          step_number: number
          time_on_page_ms?: number | null
          url: string
        }
        Update: {
          asset_type?: string | null
          created_at?: string | null
          id?: string
          page_type?: string | null
          previous_url?: string | null
          referrer?: string | null
          request_type?: string | null
          response_time_ms?: number | null
          session_id?: string
          site_id?: string
          status_code?: number | null
          step_number?: number
          time_on_page_ms?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_journey_steps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_journey_steps_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_sessions: {
        Row: {
          bot_name: string | null
          bot_type: string
          browser_type: string | null
          conversion_at: string | null
          conversion_page: string | null
          cookies_accepted: boolean | null
          created_at: string | null
          device_fingerprint: string | null
          exit_page: string | null
          id: string
          is_visual_browser: boolean | null
          last_activity_at: string | null
          reached_conversion: boolean | null
          session_id: string
          site_id: string
          started_at: string | null
          total_assets_loaded: number | null
          total_pages_viewed: number | null
          total_requests: number | null
        }
        Insert: {
          bot_name?: string | null
          bot_type: string
          browser_type?: string | null
          conversion_at?: string | null
          conversion_page?: string | null
          cookies_accepted?: boolean | null
          created_at?: string | null
          device_fingerprint?: string | null
          exit_page?: string | null
          id?: string
          is_visual_browser?: boolean | null
          last_activity_at?: string | null
          reached_conversion?: boolean | null
          session_id: string
          site_id: string
          started_at?: string | null
          total_assets_loaded?: number | null
          total_pages_viewed?: number | null
          total_requests?: number | null
        }
        Update: {
          bot_name?: string | null
          bot_type?: string
          browser_type?: string | null
          conversion_at?: string | null
          conversion_page?: string | null
          cookies_accepted?: boolean | null
          created_at?: string | null
          device_fingerprint?: string | null
          exit_page?: string | null
          id?: string
          is_visual_browser?: boolean | null
          last_activity_at?: string | null
          reached_conversion?: boolean | null
          session_id?: string
          site_id?: string
          started_at?: string | null
          total_assets_loaded?: number | null
          total_pages_viewed?: number | null
          total_requests?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bot_analysis: {
        Row: {
          ai_analysis: string | null
          analysis_period_days: number
          bot_breakdown: Json | null
          created_at: string | null
          id: string
          recommendations_generated: boolean | null
          site_id: string
          threat_indicators: Json | null
          threat_score: number
          total_visits: number
          unique_bots: number
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: string | null
          analysis_period_days?: number
          bot_breakdown?: Json | null
          created_at?: string | null
          id?: string
          recommendations_generated?: boolean | null
          site_id: string
          threat_indicators?: Json | null
          threat_score?: number
          total_visits?: number
          unique_bots?: number
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: string | null
          analysis_period_days?: number
          bot_breakdown?: Json | null
          created_at?: string | null
          id?: string
          recommendations_generated?: boolean | null
          site_id?: string
          threat_indicators?: Json | null
          threat_score?: number
          total_visits?: number
          unique_bots?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_bot_analysis_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bot_probe_signals: {
        Row: {
          automation_signals: Json | null
          browser_signals: Json | null
          created_at: string
          execution_time_ms: number | null
          headless_detected: boolean | null
          id: string
          probe_version: string | null
          site_id: string
          traffic_id: string | null
          triggered_at: string
          webdriver_detected: boolean | null
        }
        Insert: {
          automation_signals?: Json | null
          browser_signals?: Json | null
          created_at?: string
          execution_time_ms?: number | null
          headless_detected?: boolean | null
          id?: string
          probe_version?: string | null
          site_id: string
          traffic_id?: string | null
          triggered_at?: string
          webdriver_detected?: boolean | null
        }
        Update: {
          automation_signals?: Json | null
          browser_signals?: Json | null
          created_at?: string
          execution_time_ms?: number | null
          headless_detected?: boolean | null
          id?: string
          probe_version?: string | null
          site_id?: string
          traffic_id?: string | null
          triggered_at?: string
          webdriver_detected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_bot_probe_signals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bot_probe_signals_traffic_id_fkey"
            columns: ["traffic_id"]
            isOneToOne: false
            referencedRelation: "ai_bot_traffic"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bot_traffic: {
        Row: {
          bot_name: string | null
          bot_type: string
          created_at: string
          detected_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          js_executed: boolean | null
          probe_triggered: boolean | null
          referrer: string | null
          request_type: string | null
          session_id: string | null
          site_id: string
          url: string
          user_agent: string | null
        }
        Insert: {
          bot_name?: string | null
          bot_type: string
          created_at?: string
          detected_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          js_executed?: boolean | null
          probe_triggered?: boolean | null
          referrer?: string | null
          request_type?: string | null
          session_id?: string | null
          site_id: string
          url: string
          user_agent?: string | null
        }
        Update: {
          bot_name?: string | null
          bot_type?: string
          created_at?: string
          detected_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          js_executed?: boolean | null
          probe_triggered?: boolean | null
          referrer?: string | null
          request_type?: string | null
          session_id?: string | null
          site_id?: string
          url?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_bot_traffic_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_citations: {
        Row: {
          citation_context: string | null
          cited_url: string
          clicked: boolean | null
          clicked_at: string | null
          created_at: string
          id: string
          site_id: string
          traffic_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          citation_context?: string | null
          cited_url: string
          clicked?: boolean | null
          clicked_at?: string | null
          created_at?: string
          id?: string
          site_id: string
          traffic_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          citation_context?: string | null
          cited_url?: string
          clicked?: boolean | null
          clicked_at?: string | null
          created_at?: string
          id?: string
          site_id?: string
          traffic_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_traffic_id_fkey"
            columns: ["traffic_id"]
            isOneToOne: false
            referencedRelation: "ai_bot_traffic"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversion_goals: {
        Row: {
          created_at: string | null
          goal_name: string
          goal_type: string
          id: string
          is_active: boolean | null
          is_regex: boolean | null
          site_id: string
          updated_at: string | null
          url_pattern: string
          value: number | null
        }
        Insert: {
          created_at?: string | null
          goal_name: string
          goal_type: string
          id?: string
          is_active?: boolean | null
          is_regex?: boolean | null
          site_id: string
          updated_at?: string | null
          url_pattern: string
          value?: number | null
        }
        Update: {
          created_at?: string | null
          goal_name?: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          is_regex?: boolean | null
          site_id?: string
          updated_at?: string | null
          url_pattern?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversion_goals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_search_traffic: {
        Row: {
          ai_platform: string
          bounce: boolean | null
          browser: string | null
          city: string | null
          conversions: number | null
          country: string | null
          created_at: string
          device_type: string | null
          engaged: boolean | null
          id: string
          landed_at: string
          operating_system: string | null
          page_title: string | null
          pages_viewed: number | null
          referrer: string | null
          revenue: number | null
          session_duration: number | null
          session_id: string
          site_id: string
          url: string
          user_agent: string | null
          user_hash: string | null
        }
        Insert: {
          ai_platform: string
          bounce?: boolean | null
          browser?: string | null
          city?: string | null
          conversions?: number | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          engaged?: boolean | null
          id?: string
          landed_at?: string
          operating_system?: string | null
          page_title?: string | null
          pages_viewed?: number | null
          referrer?: string | null
          revenue?: number | null
          session_duration?: number | null
          session_id: string
          site_id: string
          url: string
          user_agent?: string | null
          user_hash?: string | null
        }
        Update: {
          ai_platform?: string
          bounce?: boolean | null
          browser?: string | null
          city?: string | null
          conversions?: number | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          engaged?: boolean | null
          id?: string
          landed_at?: string
          operating_system?: string | null
          page_title?: string | null
          pages_viewed?: number | null
          referrer?: string | null
          revenue?: number | null
          session_duration?: number | null
          session_id?: string
          site_id?: string
          url?: string
          user_agent?: string | null
          user_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_search_traffic_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_summary: {
        Row: {
          clicks: number | null
          company_id: string
          content_id: string
          content_type: string
          conversions: number | null
          created_at: string
          date: string
          id: string
          platform: string | null
          submissions: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          clicks?: number | null
          company_id: string
          content_id: string
          content_type: string
          conversions?: number | null
          created_at?: string
          date: string
          id?: string
          platform?: string | null
          submissions?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          clicks?: number | null
          company_id?: string
          content_id?: string
          content_type?: string
          conversions?: number | null
          created_at?: string
          date?: string
          id?: string
          platform?: string | null
          submissions?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_summary_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_alerts: {
        Row: {
          alert_description: string | null
          alert_name: string
          alert_type: string
          created_at: string
          id: string
          is_active: boolean
          notification_settings: Json | null
          severity: string
          site_id: string
          threshold_config: Json
          updated_at: string
        }
        Insert: {
          alert_description?: string | null
          alert_name: string
          alert_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          notification_settings?: Json | null
          severity?: string
          site_id: string
          threshold_config?: Json
          updated_at?: string
        }
        Update: {
          alert_description?: string | null
          alert_name?: string
          alert_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notification_settings?: Json | null
          severity?: string
          site_id?: string
          threshold_config?: Json
          updated_at?: string
        }
        Relationships: []
      }
      behavioral_incidents: {
        Row: {
          alert_id: string
          created_at: string
          detected_at: string
          id: string
          incident_data: Json
          incident_type: string
          notes: string | null
          resolved_at: string | null
          severity: string
          site_id: string
          status: string
          updated_at: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          detected_at?: string
          id?: string
          incident_data?: Json
          incident_type: string
          notes?: string | null
          resolved_at?: string | null
          severity: string
          site_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          detected_at?: string
          id?: string
          incident_data?: Json
          incident_type?: string
          notes?: string | null
          resolved_at?: string | null
          severity?: string
          site_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          api_key: string
          consent_settings: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          api_key?: string
          consent_settings?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          consent_settings?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      consent_validations: {
        Row: {
          allowed_calls: Json | null
          blocked_calls: Json | null
          consent_status: Json
          created_at: string | null
          id: string
          ip_address: string | null
          session_id: string
          site_id: string
          user_agent: string | null
          validation_timestamp: string | null
        }
        Insert: {
          allowed_calls?: Json | null
          blocked_calls?: Json | null
          consent_status: Json
          created_at?: string | null
          id?: string
          ip_address?: string | null
          session_id: string
          site_id: string
          user_agent?: string | null
          validation_timestamp?: string | null
        }
        Update: {
          allowed_calls?: Json | null
          blocked_calls?: Json | null
          consent_status?: Json
          created_at?: string | null
          id?: string
          ip_address?: string | null
          session_id?: string
          site_id?: string
          user_agent?: string | null
          validation_timestamp?: string | null
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          created_at: string | null
          element_selector: string | null
          event_name: string
          event_type: string
          event_value: number | null
          form_data: Json | null
          id: string
          page_view_id: string | null
          session_id: string | null
          site_id: string
        }
        Insert: {
          created_at?: string | null
          element_selector?: string | null
          event_name: string
          event_type: string
          event_value?: number | null
          form_data?: Json | null
          id?: string
          page_view_id?: string | null
          session_id?: string | null
          site_id: string
        }
        Update: {
          created_at?: string | null
          element_selector?: string | null
          event_name?: string
          event_type?: string
          event_value?: number | null
          form_data?: Json | null
          id?: string
          page_view_id?: string | null
          session_id?: string | null
          site_id?: string
        }
        Relationships: []
      }
      cookie_consents: {
        Row: {
          consent_given: boolean
          consent_types: Json
          created_at: string
          expires_at: string
          geo_country: string | null
          gpc_signal: boolean | null
          id: string
          ip_address: string | null
          locale: string | null
          policy_version: string | null
          session_id: string
          site_id: string
          source: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          consent_given?: boolean
          consent_types?: Json
          created_at?: string
          expires_at?: string
          geo_country?: string | null
          gpc_signal?: boolean | null
          id?: string
          ip_address?: string | null
          locale?: string | null
          policy_version?: string | null
          session_id: string
          site_id: string
          source?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_types?: Json
          created_at?: string
          expires_at?: string
          geo_country?: string | null
          gpc_signal?: boolean | null
          id?: string
          ip_address?: string | null
          locale?: string | null
          policy_version?: string | null
          session_id?: string
          site_id?: string
          source?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      cookie_definitions: {
        Row: {
          category_key: string
          cookie_name: string
          created_at: string | null
          data_stored: string | null
          description: string | null
          detection_confidence: string
          detection_method: string
          expiry: string | null
          id: number
          is_active: boolean | null
          path: string | null
          provider_name: string | null
          purpose: string | null
          security_level: string | null
          size_bytes: number | null
          updated_at: string | null
        }
        Insert: {
          category_key: string
          cookie_name: string
          created_at?: string | null
          data_stored?: string | null
          description?: string | null
          detection_confidence?: string
          detection_method?: string
          expiry?: string | null
          id?: number
          is_active?: boolean | null
          path?: string | null
          provider_name?: string | null
          purpose?: string | null
          security_level?: string | null
          size_bytes?: number | null
          updated_at?: string | null
        }
        Update: {
          category_key?: string
          cookie_name?: string
          created_at?: string | null
          data_stored?: string | null
          description?: string | null
          detection_confidence?: string
          detection_method?: string
          expiry?: string | null
          id?: number
          is_active?: boolean | null
          path?: string | null
          provider_name?: string | null
          purpose?: string | null
          security_level?: string | null
          size_bytes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_insights: {
        Row: {
          action_items: Json | null
          confidence_score: number | null
          created_at: string
          data_points: Json | null
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          is_dismissed: boolean | null
          priority: string
          site_id: string
          title: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          confidence_score?: number | null
          created_at?: string
          data_points?: Json | null
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          priority?: string
          site_id: string
          title: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          confidence_score?: number | null
          created_at?: string
          data_points?: Json | null
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          priority?: string
          site_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_requests: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          processed_at: string | null
          request_data: Json | null
          request_type: string
          site_id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          processed_at?: string | null
          request_data?: Json | null
          request_type: string
          site_id: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          processed_at?: string | null
          request_data?: Json | null
          request_type?: string
          site_id?: string
          status?: string
        }
        Relationships: []
      }
      detected_cookies: {
        Row: {
          cookie_category: string
          cookie_domain: string | null
          cookie_expiry: string | null
          cookie_name: string
          cookie_provider: string | null
          cookie_purpose: string | null
          created_at: string | null
          detection_method: string | null
          id: string
          is_third_party: boolean | null
          plugin_name: string | null
          script_source: string | null
          site_id: string
          updated_at: string | null
        }
        Insert: {
          cookie_category: string
          cookie_domain?: string | null
          cookie_expiry?: string | null
          cookie_name: string
          cookie_provider?: string | null
          cookie_purpose?: string | null
          created_at?: string | null
          detection_method?: string | null
          id?: string
          is_third_party?: boolean | null
          plugin_name?: string | null
          script_source?: string | null
          site_id: string
          updated_at?: string | null
        }
        Update: {
          cookie_category?: string
          cookie_domain?: string | null
          cookie_expiry?: string | null
          cookie_name?: string
          cookie_provider?: string | null
          cookie_purpose?: string | null
          created_at?: string | null
          detection_method?: string | null
          id?: string
          is_third_party?: boolean | null
          plugin_name?: string | null
          script_source?: string | null
          site_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      detected_scripts: {
        Row: {
          category: string
          created_at: string | null
          detected_cookies: string[] | null
          detection_date: string | null
          id: string
          is_active: boolean | null
          last_seen: string | null
          provider: string | null
          purpose: string | null
          script_name: string
          script_type: string
          script_url: string | null
          site_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          detected_cookies?: string[] | null
          detection_date?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          provider?: string | null
          purpose?: string | null
          script_name: string
          script_type: string
          script_url?: string | null
          site_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          detected_cookies?: string[] | null
          detection_date?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          provider?: string | null
          purpose?: string | null
          script_name?: string
          script_type?: string
          script_url?: string | null
          site_id?: string
        }
        Relationships: []
      }
      ecommerce_events: {
        Row: {
          consent_granted: boolean | null
          created_at: string | null
          currency: string | null
          event_type: string
          id: string
          price: number | null
          product_brand: string | null
          product_category: string | null
          product_id: string | null
          product_name: string | null
          product_variant: string | null
          quantity: number | null
          revenue: number | null
          session_id: string
          shipping: number | null
          site_id: string
          tax: number | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          consent_granted?: boolean | null
          created_at?: string | null
          currency?: string | null
          event_type: string
          id?: string
          price?: number | null
          product_brand?: string | null
          product_category?: string | null
          product_id?: string | null
          product_name?: string | null
          product_variant?: string | null
          quantity?: number | null
          revenue?: number | null
          session_id: string
          shipping?: number | null
          site_id: string
          tax?: number | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          consent_granted?: boolean | null
          created_at?: string | null
          currency?: string | null
          event_type?: string
          id?: string
          price?: number | null
          product_brand?: string | null
          product_category?: string | null
          product_id?: string | null
          product_name?: string | null
          product_variant?: string | null
          quantity?: number | null
          revenue?: number | null
          session_id?: string
          shipping?: number | null
          site_id?: string
          tax?: number | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      event_debug_log: {
        Row: {
          consent_status: Json | null
          created_at: string | null
          device_type: string | null
          event_name: string
          event_params: Json | null
          id: string
          ip_address: string | null
          session_id: string | null
          site_id: string
          user_agent: string | null
        }
        Insert: {
          consent_status?: Json | null
          created_at?: string | null
          device_type?: string | null
          event_name: string
          event_params?: Json | null
          id?: string
          ip_address?: string | null
          session_id?: string | null
          site_id: string
          user_agent?: string | null
        }
        Update: {
          consent_status?: Json | null
          created_at?: string | null
          device_type?: string | null
          event_name?: string
          event_params?: Json | null
          id?: string
          ip_address?: string | null
          session_id?: string | null
          site_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_debug_log_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      form_analytics: {
        Row: {
          avg_completion_time: number | null
          conversion_rate: number | null
          created_at: string
          form_id: string
          form_name: string | null
          form_type: string
          id: string
          site_id: string
          total_abandons: number | null
          total_completions: number | null
          total_starts: number | null
          updated_at: string
        }
        Insert: {
          avg_completion_time?: number | null
          conversion_rate?: number | null
          created_at?: string
          form_id: string
          form_name?: string | null
          form_type: string
          id?: string
          site_id: string
          total_abandons?: number | null
          total_completions?: number | null
          total_starts?: number | null
          updated_at?: string
        }
        Update: {
          avg_completion_time?: number | null
          conversion_rate?: number | null
          created_at?: string
          form_id?: string
          form_name?: string | null
          form_type?: string
          id?: string
          site_id?: string
          total_abandons?: number | null
          total_completions?: number | null
          total_starts?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      form_field_analytics: {
        Row: {
          avg_focus_time: number | null
          created_at: string
          error_rate: number | null
          field_label: string | null
          field_name: string
          field_position: number | null
          field_type: string | null
          form_id: string
          id: string
          site_id: string
          skip_rate: number | null
          total_errors: number | null
          total_interactions: number | null
          total_skips: number | null
          updated_at: string
        }
        Insert: {
          avg_focus_time?: number | null
          created_at?: string
          error_rate?: number | null
          field_label?: string | null
          field_name: string
          field_position?: number | null
          field_type?: string | null
          form_id: string
          id?: string
          site_id: string
          skip_rate?: number | null
          total_errors?: number | null
          total_interactions?: number | null
          total_skips?: number | null
          updated_at?: string
        }
        Update: {
          avg_focus_time?: number | null
          created_at?: string
          error_rate?: number | null
          field_label?: string | null
          field_name?: string
          field_position?: number | null
          field_type?: string | null
          form_id?: string
          id?: string
          site_id?: string
          skip_rate?: number | null
          total_errors?: number | null
          total_interactions?: number | null
          total_skips?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      form_field_interactions: {
        Row: {
          created_at: string
          field_name: string
          field_position: number | null
          focus_time: number | null
          form_id: string
          form_session_id: string | null
          id: string
          interaction_type: string
          interaction_value: string | null
          session_id: string
          site_id: string
          timestamp_ms: number
        }
        Insert: {
          created_at?: string
          field_name: string
          field_position?: number | null
          focus_time?: number | null
          form_id: string
          form_session_id?: string | null
          id?: string
          interaction_type: string
          interaction_value?: string | null
          session_id: string
          site_id: string
          timestamp_ms: number
        }
        Update: {
          created_at?: string
          field_name?: string
          field_position?: number | null
          focus_time?: number | null
          form_id?: string
          form_session_id?: string | null
          id?: string
          interaction_type?: string
          interaction_value?: string | null
          session_id?: string
          site_id?: string
          timestamp_ms?: number
        }
        Relationships: []
      }
      form_sessions: {
        Row: {
          abandoned_at: string | null
          completed_at: string | null
          completion_time: number | null
          created_at: string
          device_type: string | null
          error_count: number | null
          fields_completed: number | null
          form_id: string
          form_type: string
          id: string
          ip_address: string | null
          session_id: string
          site_id: string
          started_at: string
          total_fields: number | null
          user_agent: string | null
        }
        Insert: {
          abandoned_at?: string | null
          completed_at?: string | null
          completion_time?: number | null
          created_at?: string
          device_type?: string | null
          error_count?: number | null
          fields_completed?: number | null
          form_id: string
          form_type: string
          id?: string
          ip_address?: string | null
          session_id: string
          site_id: string
          started_at?: string
          total_fields?: number | null
          user_agent?: string | null
        }
        Update: {
          abandoned_at?: string | null
          completed_at?: string | null
          completion_time?: number | null
          created_at?: string
          device_type?: string | null
          error_count?: number | null
          fields_completed?: number | null
          form_id?: string
          form_type?: string
          id?: string
          ip_address?: string | null
          session_id?: string
          site_id?: string
          started_at?: string
          total_fields?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      formats: {
        Row: {
          aspect_ratio: string
          created_at: string | null
          height: number
          id: string
          label: string
          name: string
          platform: string
          width: number
        }
        Insert: {
          aspect_ratio: string
          created_at?: string | null
          height: number
          id?: string
          label: string
          name: string
          platform: string
          width: number
        }
        Update: {
          aspect_ratio?: string
          created_at?: string | null
          height?: number
          id?: string
          label?: string
          name?: string
          platform?: string
          width?: number
        }
        Relationships: []
      }
      funnel_analytics: {
        Row: {
          created_at: string | null
          date: string
          drop_off_rate: number | null
          funnel_id: string
          id: string
          sessions_completed: number | null
          sessions_entered: number | null
          site_id: string
          step_index: number
          step_name: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          drop_off_rate?: number | null
          funnel_id: string
          id?: string
          sessions_completed?: number | null
          sessions_entered?: number | null
          site_id: string
          step_index: number
          step_name: string
        }
        Update: {
          created_at?: string | null
          date?: string
          drop_off_rate?: number | null
          funnel_id?: string
          id?: string
          sessions_completed?: number | null
          sessions_entered?: number | null
          site_id?: string
          step_index?: number
          step_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_analytics_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_analytics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          created_at: string | null
          funnel_name: string
          id: string
          is_active: boolean | null
          site_id: string
          steps: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          funnel_name: string
          id?: string
          is_active?: boolean | null
          site_id: string
          steps: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          funnel_name?: string
          id?: string
          is_active?: boolean | null
          site_id?: string
          steps?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnels_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_settings: {
        Row: {
          anonymize_ip: boolean
          click_to_load_enabled: boolean | null
          contact_email: string | null
          cookie_consent_enabled: boolean
          cookiefree_method: string | null
          cookiefree_mode: boolean | null
          created_at: string
          data_retention_days: number
          dpo_email: string | null
          heatmap_tracking_enabled: boolean | null
          id: string
          legal_basis: Json
          policy_version: string | null
          privacy_policy_url: string | null
          site_id: string
          support_gpc: boolean | null
          updated_at: string
        }
        Insert: {
          anonymize_ip?: boolean
          click_to_load_enabled?: boolean | null
          contact_email?: string | null
          cookie_consent_enabled?: boolean
          cookiefree_method?: string | null
          cookiefree_mode?: boolean | null
          created_at?: string
          data_retention_days?: number
          dpo_email?: string | null
          heatmap_tracking_enabled?: boolean | null
          id?: string
          legal_basis?: Json
          policy_version?: string | null
          privacy_policy_url?: string | null
          site_id: string
          support_gpc?: boolean | null
          updated_at?: string
        }
        Update: {
          anonymize_ip?: boolean
          click_to_load_enabled?: boolean | null
          contact_email?: string | null
          cookie_consent_enabled?: boolean
          cookiefree_method?: string | null
          cookiefree_mode?: boolean | null
          created_at?: string
          data_retention_days?: number
          dpo_email?: string | null
          heatmap_tracking_enabled?: boolean | null
          id?: string
          legal_basis?: Json
          policy_version?: string | null
          privacy_policy_url?: string | null
          site_id?: string
          support_gpc?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      heatmap_data: {
        Row: {
          browser: string | null
          created_at: string
          date: string
          device_type: string
          element_selector: string | null
          element_text: string | null
          form_name: string | null
          grid_x: number | null
          grid_y: number | null
          id: string
          intensity: number | null
          interaction_type: string
          ip_address: string | null
          is_touch_device: boolean | null
          mobile_device_brand: string | null
          mobile_device_model: string | null
          operating_system: string | null
          operating_system_version: string | null
          parent_form_id: string | null
          site_id: string
          touch_force: number | null
          touch_radius: number | null
          url: string
          viewport_height: number | null
          viewport_width: number | null
          x_coordinate: number
          y_coordinate: number
        }
        Insert: {
          browser?: string | null
          created_at?: string
          date?: string
          device_type: string
          element_selector?: string | null
          element_text?: string | null
          form_name?: string | null
          grid_x?: number | null
          grid_y?: number | null
          id?: string
          intensity?: number | null
          interaction_type: string
          ip_address?: string | null
          is_touch_device?: boolean | null
          mobile_device_brand?: string | null
          mobile_device_model?: string | null
          operating_system?: string | null
          operating_system_version?: string | null
          parent_form_id?: string | null
          site_id: string
          touch_force?: number | null
          touch_radius?: number | null
          url: string
          viewport_height?: number | null
          viewport_width?: number | null
          x_coordinate: number
          y_coordinate: number
        }
        Update: {
          browser?: string | null
          created_at?: string
          date?: string
          device_type?: string
          element_selector?: string | null
          element_text?: string | null
          form_name?: string | null
          grid_x?: number | null
          grid_y?: number | null
          id?: string
          intensity?: number | null
          interaction_type?: string
          ip_address?: string | null
          is_touch_device?: boolean | null
          mobile_device_brand?: string | null
          mobile_device_model?: string | null
          operating_system?: string | null
          operating_system_version?: string | null
          parent_form_id?: string | null
          site_id?: string
          touch_force?: number | null
          touch_radius?: number | null
          url?: string
          viewport_height?: number | null
          viewport_width?: number | null
          x_coordinate?: number
          y_coordinate?: number
        }
        Relationships: [
          {
            foreignKeyName: "heatmap_data_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          lead_type: string | null
          message: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          lead_type?: string | null
          message: string
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          lead_type?: string | null
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      navigation_analytics: {
        Row: {
          click_count: number | null
          created_at: string
          date: string
          device_type: string | null
          id: string
          menu_item_id: number
          menu_title: string
          menu_url: string
          site_id: string
          updated_at: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          date?: string
          device_type?: string | null
          id?: string
          menu_item_id: number
          menu_title: string
          menu_url: string
          site_id: string
          updated_at?: string
        }
        Update: {
          click_count?: number | null
          created_at?: string
          date?: string
          device_type?: string | null
          id?: string
          menu_item_id?: number
          menu_title?: string
          menu_url?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      navigation_menus: {
        Row: {
          created_at: string
          css_classes: string[] | null
          id: string
          is_active: boolean | null
          menu_item_id: number
          menu_location: string | null
          menu_order: number | null
          menu_title: string
          menu_url: string
          parent_id: number | null
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          css_classes?: string[] | null
          id?: string
          is_active?: boolean | null
          menu_item_id: number
          menu_location?: string | null
          menu_order?: number | null
          menu_title: string
          menu_url: string
          parent_id?: number | null
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          css_classes?: string[] | null
          id?: string
          is_active?: boolean | null
          menu_item_id?: number
          menu_location?: string | null
          menu_order?: number | null
          menu_title?: string
          menu_url?: string
          parent_id?: number | null
          site_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          billing_email?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          billing_email?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          exit_page: boolean | null
          id: string
          is_conversion_page: boolean | null
          referrer: string | null
          scroll_depth: number | null
          session_id: string
          site_id: string
          time_on_page: number | null
          title: string | null
          url: string
          viewed_at: string
        }
        Insert: {
          exit_page?: boolean | null
          id?: string
          is_conversion_page?: boolean | null
          referrer?: string | null
          scroll_depth?: number | null
          session_id: string
          site_id: string
          time_on_page?: number | null
          title?: string | null
          url: string
          viewed_at?: string
        }
        Update: {
          exit_page?: boolean | null
          id?: string
          is_conversion_page?: boolean | null
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string
          site_id?: string
          time_on_page?: number | null
          title?: string | null
          url?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tracking_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      remarketing_settings: {
        Row: {
          created_at: string
          google_ads_conversion_action_id: string | null
          google_ads_customer_id: string | null
          google_ads_enabled: boolean | null
          id: string
          meta_access_token: string | null
          meta_enabled: boolean | null
          meta_pixel_id: string | null
          require_marketing_consent: boolean | null
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          google_ads_conversion_action_id?: string | null
          google_ads_customer_id?: string | null
          google_ads_enabled?: boolean | null
          id?: string
          meta_access_token?: string | null
          meta_enabled?: boolean | null
          meta_pixel_id?: string | null
          require_marketing_consent?: boolean | null
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          google_ads_conversion_action_id?: string | null
          google_ads_customer_id?: string | null
          google_ads_enabled?: boolean | null
          id?: string
          meta_access_token?: string | null
          meta_enabled?: boolean | null
          meta_pixel_id?: string | null
          require_marketing_consent?: boolean | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "remarketing_settings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      server_log_analytics: {
        Row: {
          avg_load_time_ms: number | null
          browser: string | null
          country_code: string | null
          created_at: string | null
          date: string
          device_type: string | null
          id: string
          page_views: number | null
          referrer_domain: string | null
          site_id: string
          status_2xx: number | null
          status_3xx: number | null
          status_4xx: number | null
          status_5xx: number | null
          unique_visitors: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          avg_load_time_ms?: number | null
          browser?: string | null
          country_code?: string | null
          created_at?: string | null
          date: string
          device_type?: string | null
          id?: string
          page_views?: number | null
          referrer_domain?: string | null
          site_id: string
          status_2xx?: number | null
          status_3xx?: number | null
          status_4xx?: number | null
          status_5xx?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          avg_load_time_ms?: number | null
          browser?: string | null
          country_code?: string | null
          created_at?: string | null
          date?: string
          device_type?: string | null
          id?: string
          page_views?: number | null
          referrer_domain?: string | null
          site_id?: string
          status_2xx?: number | null
          status_3xx?: number | null
          status_4xx?: number | null
          status_5xx?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_log_analytics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      server_log_imports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          failed_lines: number | null
          filename: string
          id: string
          log_format: string
          processed_lines: number | null
          site_id: string
          status: string | null
          total_lines: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          failed_lines?: number | null
          filename: string
          id?: string
          log_format: string
          processed_lines?: number | null
          site_id: string
          status?: string | null
          total_lines?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          failed_lines?: number | null
          filename?: string
          id?: string
          log_format?: string
          processed_lines?: number | null
          site_id?: string
          status?: string | null
          total_lines?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "server_log_imports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_integrations: {
        Row: {
          created_at: string
          encrypted_credentials: string
          id: string
          integration_type: string
          is_active: boolean | null
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          encrypted_credentials: string
          id?: string
          integration_type: string
          is_active?: boolean | null
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          encrypted_credentials?: string
          id?: string
          integration_type?: string
          is_active?: boolean | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_integrations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          activecampaign_account: string | null
          activecampaign_enabled: boolean | null
          adobe_container_id: string | null
          adobe_tag_manager_enabled: boolean | null
          agent_config: Json | null
          auto_categorize_cookies: boolean | null
          conversion_goals: Json | null
          cookie_scanning_enabled: boolean | null
          created_at: string
          domain: string
          excluded_ips: string[] | null
          facebook_pixel_enabled: boolean | null
          facebook_pixel_id: string | null
          form_tracking_config: Json | null
          ga_enhanced_ecommerce: boolean | null
          ga_integration_enabled: boolean | null
          ga_measurement_id: string | null
          ga_property_id: string | null
          ga_sync_events: string[] | null
          gcm_container_id: string | null
          gcm_enabled: boolean | null
          gcm_measurement_id: string | null
          google_ads_conversion_id: string | null
          google_ads_enabled: boolean | null
          gtm_container_id: string | null
          gtm_enabled: boolean | null
          heatmap_tracking_enabled: boolean | null
          hotjar_enabled: boolean | null
          hotjar_site_id: string | null
          hubspot_enabled: boolean | null
          hubspot_hub_id: string | null
          id: string
          ip_exclusion_enabled: boolean | null
          is_active: boolean
          last_cookie_scan: string | null
          linkedin_insight_enabled: boolean | null
          linkedin_partner_id: string | null
          marketo_enabled: boolean | null
          marketo_munchkin_id: string | null
          microsoft_clarity_enabled: boolean | null
          microsoft_clarity_project_id: string | null
          mixpanel_enabled: boolean | null
          mixpanel_token: string | null
          navigation_config: Json | null
          oracle_eloqua_enabled: boolean | null
          oracle_site_id: string | null
          organization_id: string | null
          salesforce_account_id: string | null
          salesforce_pardot_enabled: boolean | null
          screenshot_urls: Json | null
          server_side_tracking_config: Json | null
          site_name: string
          tiktok_pixel_enabled: boolean | null
          tiktok_pixel_id: string | null
          tracking_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activecampaign_account?: string | null
          activecampaign_enabled?: boolean | null
          adobe_container_id?: string | null
          adobe_tag_manager_enabled?: boolean | null
          agent_config?: Json | null
          auto_categorize_cookies?: boolean | null
          conversion_goals?: Json | null
          cookie_scanning_enabled?: boolean | null
          created_at?: string
          domain: string
          excluded_ips?: string[] | null
          facebook_pixel_enabled?: boolean | null
          facebook_pixel_id?: string | null
          form_tracking_config?: Json | null
          ga_enhanced_ecommerce?: boolean | null
          ga_integration_enabled?: boolean | null
          ga_measurement_id?: string | null
          ga_property_id?: string | null
          ga_sync_events?: string[] | null
          gcm_container_id?: string | null
          gcm_enabled?: boolean | null
          gcm_measurement_id?: string | null
          google_ads_conversion_id?: string | null
          google_ads_enabled?: boolean | null
          gtm_container_id?: string | null
          gtm_enabled?: boolean | null
          heatmap_tracking_enabled?: boolean | null
          hotjar_enabled?: boolean | null
          hotjar_site_id?: string | null
          hubspot_enabled?: boolean | null
          hubspot_hub_id?: string | null
          id?: string
          ip_exclusion_enabled?: boolean | null
          is_active?: boolean
          last_cookie_scan?: string | null
          linkedin_insight_enabled?: boolean | null
          linkedin_partner_id?: string | null
          marketo_enabled?: boolean | null
          marketo_munchkin_id?: string | null
          microsoft_clarity_enabled?: boolean | null
          microsoft_clarity_project_id?: string | null
          mixpanel_enabled?: boolean | null
          mixpanel_token?: string | null
          navigation_config?: Json | null
          oracle_eloqua_enabled?: boolean | null
          oracle_site_id?: string | null
          organization_id?: string | null
          salesforce_account_id?: string | null
          salesforce_pardot_enabled?: boolean | null
          screenshot_urls?: Json | null
          server_side_tracking_config?: Json | null
          site_name: string
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tracking_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activecampaign_account?: string | null
          activecampaign_enabled?: boolean | null
          adobe_container_id?: string | null
          adobe_tag_manager_enabled?: boolean | null
          agent_config?: Json | null
          auto_categorize_cookies?: boolean | null
          conversion_goals?: Json | null
          cookie_scanning_enabled?: boolean | null
          created_at?: string
          domain?: string
          excluded_ips?: string[] | null
          facebook_pixel_enabled?: boolean | null
          facebook_pixel_id?: string | null
          form_tracking_config?: Json | null
          ga_enhanced_ecommerce?: boolean | null
          ga_integration_enabled?: boolean | null
          ga_measurement_id?: string | null
          ga_property_id?: string | null
          ga_sync_events?: string[] | null
          gcm_container_id?: string | null
          gcm_enabled?: boolean | null
          gcm_measurement_id?: string | null
          google_ads_conversion_id?: string | null
          google_ads_enabled?: boolean | null
          gtm_container_id?: string | null
          gtm_enabled?: boolean | null
          heatmap_tracking_enabled?: boolean | null
          hotjar_enabled?: boolean | null
          hotjar_site_id?: string | null
          hubspot_enabled?: boolean | null
          hubspot_hub_id?: string | null
          id?: string
          ip_exclusion_enabled?: boolean | null
          is_active?: boolean
          last_cookie_scan?: string | null
          linkedin_insight_enabled?: boolean | null
          linkedin_partner_id?: string | null
          marketo_enabled?: boolean | null
          marketo_munchkin_id?: string | null
          microsoft_clarity_enabled?: boolean | null
          microsoft_clarity_project_id?: string | null
          mixpanel_enabled?: boolean | null
          mixpanel_token?: string | null
          navigation_config?: Json | null
          oracle_eloqua_enabled?: boolean | null
          oracle_site_id?: string | null
          organization_id?: string | null
          salesforce_account_id?: string | null
          salesforce_pardot_enabled?: boolean | null
          screenshot_urls?: Json | null
          server_side_tracking_config?: Json | null
          site_name?: string
          tiktok_pixel_enabled?: boolean | null
          tiktok_pixel_id?: string | null
          tracking_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          company_id: string
          content_id: string
          content_type: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          platform: string | null
          session_id: string
          timestamp: string
        }
        Insert: {
          company_id: string
          content_id: string
          content_type: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          session_id: string
          timestamp?: string
        }
        Update: {
          company_id?: string
          content_id?: string
          content_type?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_sessions: {
        Row: {
          browser: string | null
          device_type: string | null
          duration_seconds: number | null
          id: string
          ip_address: string | null
          last_activity: string
          last_rotation: string | null
          os: string | null
          page_views: number | null
          referrer: string | null
          referrer_url: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          session_rotation_count: number | null
          site_id: string
          started_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          browser?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          last_rotation?: string | null
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          referrer_url?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          session_rotation_count?: number | null
          site_id: string
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          browser?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          last_activity?: string
          last_rotation?: string | null
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          referrer_url?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          session_rotation_count?: number | null
          site_id?: string
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_identities: {
        Row: {
          consent_granted: boolean | null
          created_at: string | null
          device_ids: string[] | null
          first_seen: string | null
          id: string
          last_seen: string | null
          session_ids: string[] | null
          site_id: string
          total_revenue: number | null
          total_sessions: number | null
          user_hash: string
        }
        Insert: {
          consent_granted?: boolean | null
          created_at?: string | null
          device_ids?: string[] | null
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          session_ids?: string[] | null
          site_id: string
          total_revenue?: number | null
          total_sessions?: number | null
          user_hash: string
        }
        Update: {
          consent_granted?: boolean | null
          created_at?: string | null
          device_ids?: string[] | null
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          session_ids?: string[] | null
          site_id?: string
          total_revenue?: number | null
          total_sessions?: number | null
          user_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_identities_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          created_at: string
          element_class: string | null
          element_id: string | null
          element_tag: string | null
          element_text: string | null
          id: string
          interaction_type: string
          page_view_id: string
          scroll_position: number | null
          session_id: string
          timestamp_ms: number
          x_coordinate: number | null
          y_coordinate: number | null
        }
        Insert: {
          created_at?: string
          element_class?: string | null
          element_id?: string | null
          element_tag?: string | null
          element_text?: string | null
          id?: string
          interaction_type: string
          page_view_id: string
          scroll_position?: number | null
          session_id: string
          timestamp_ms: number
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Update: {
          created_at?: string
          element_class?: string | null
          element_id?: string | null
          element_tag?: string | null
          element_text?: string | null
          id?: string
          interaction_type?: string
          page_view_id?: string
          scroll_position?: number | null
          session_id?: string
          timestamp_ms?: number
          x_coordinate?: number | null
          y_coordinate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_page_view_id_fkey"
            columns: ["page_view_id"]
            isOneToOne: false
            referencedRelation: "page_views"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tracking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_photos: {
        Row: {
          created_at: string | null
          file_path: string | null
          format_id: string | null
          format_name: string
          id: string
          photo_url: string
          updated_at: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          format_id?: string | null
          format_name: string
          id?: string
          photo_url: string
          updated_at?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          format_id?: string | null
          format_name?: string
          id?: string
          photo_url?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_photos_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "formats"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          dashboard_layout: Json | null
          favorite_tabs: Json | null
          id: string
          notification_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_layout?: Json | null
          favorite_tabs?: Json | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_layout?: Json | null
          favorite_tabs?: Json | null
          id?: string
          notification_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_order_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_order_images_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "video_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      video_orders: {
        Row: {
          address: string
          area: string | null
          company: string | null
          created_at: string
          description: string
          email: string
          expedited_delivery: boolean
          format: string
          id: string
          image_count: number
          include_logo: boolean
          name: string
          phone: string | null
          price: string
          rooms: string
          status: string
          text_position: string
          updated_at: string | null
          webhook_sent: boolean
        }
        Insert: {
          address: string
          area?: string | null
          company?: string | null
          created_at?: string
          description: string
          email: string
          expedited_delivery?: boolean
          format: string
          id?: string
          image_count: number
          include_logo?: boolean
          name: string
          phone?: string | null
          price: string
          rooms: string
          status?: string
          text_position: string
          updated_at?: string | null
          webhook_sent?: boolean
        }
        Update: {
          address?: string
          area?: string | null
          company?: string | null
          created_at?: string
          description?: string
          email?: string
          expedited_delivery?: boolean
          format?: string
          id?: string
          image_count?: number
          include_logo?: boolean
          name?: string
          phone?: string | null
          price?: string
          rooms?: string
          status?: string
          text_position?: string
          updated_at?: string | null
          webhook_sent?: boolean
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string | null
          notes: string | null
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_tracking_events: { Args: never; Returns: undefined }
      anonymize_ip: { Args: { ip_address: string }; Returns: string }
      cleanup_debug_logs: { Args: never; Returns: undefined }
      cleanup_old_tracking_data: { Args: never; Returns: undefined }
      generate_tracking_id: { Args: never; Returns: string }
      get_ai_agent_funnel: {
        Args: { p_end_date: string; p_site_id: string; p_start_date: string }
        Returns: {
          drop_off_rate: number
          page_type: string
          sessions_count: number
        }[]
      }
      get_ai_search_summary: {
        Args: { p_end_date: string; p_site_id: string; p_start_date: string }
        Returns: {
          ai_platform: string
          avg_session_duration: number
          bounce_rate: number
          total_conversions: number
          total_pageviews: number
          total_sessions: number
        }[]
      }
      get_site_cookie_summary: {
        Args: { p_site_id: string }
        Returns: {
          category: string
          cookie_count: number
          script_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_heatmap_grid_intensity: {
        Args: {
          p_date: string
          p_device_type: string
          p_grid_x: number
          p_grid_y: number
          p_site_id: string
          p_type: string
          p_url: string
          p_viewport_height?: number
          p_viewport_width?: number
        }
        Returns: undefined
      }
      increment_heatmap_intensity: {
        Args: {
          p_date: string
          p_device_type: string
          p_site_id: string
          p_type: string
          p_url: string
          p_x: number
          p_y: number
        }
        Returns: undefined
      }
      increment_navigation_clicks: {
        Args: {
          p_date: string
          p_device_type: string
          p_menu_item_id: number
          p_menu_title: string
          p_menu_url: string
          p_site_id: string
        }
        Returns: undefined
      }
      increment_server_log_analytics: {
        Args: {
          p_browser: string
          p_country_code: string
          p_date: string
          p_device_type: string
          p_load_time_ms: number
          p_referrer_domain: string
          p_site_id: string
          p_status_code: number
          p_url: string
        }
        Returns: undefined
      }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_org_member: {
        Args: {
          min_role?: Database["public"]["Enums"]["org_role"]
          org_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
          p_severity?: string
        }
        Returns: undefined
      }
      should_rotate_session: {
        Args: { p_session_id: string; p_site_id: string }
        Returns: boolean
      }
      upsert_ai_agent_session: {
        Args: {
          p_asset_type?: string
          p_bot_name: string
          p_bot_type: string
          p_is_asset?: boolean
          p_is_visual_browser?: boolean
          p_session_id: string
          p_site_id: string
          p_url: string
        }
        Returns: string
      }
      upsert_user_identity: {
        Args: {
          p_revenue: number
          p_session_id: string
          p_site_id: string
          p_user_hash: string
        }
        Returns: undefined
      }
      validate_consent_for_tracking: {
        Args: {
          p_consent_type: string
          p_session_id: string
          p_site_id: string
        }
        Returns: boolean
      }
      validate_email: { Args: { email_input: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      org_role: "owner" | "admin" | "member" | "viewer"
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
      app_role: ["admin", "moderator", "user"],
      org_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
