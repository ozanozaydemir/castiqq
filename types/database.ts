export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          subscription_plan: 'trial' | 'pro'
          subscription_status: 'active' | 'cancelled' | 'past_due' | 'trial'
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          organization_id: string | null
          full_name: string
          role: 'admin' | 'member' | 'viewer'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          type: 'film' | 'dizi' | 'reklam' | 'tiyatro' | 'diger'
          status: 'active' | 'completed' | 'archived'
          platform: string | null
          director: string | null
          deadline: string | null
          shooting_start: string | null
          shooting_end: string | null
          shooting_location: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      project_roles: {
        Row: {
          id: string
          project_id: string
          organization_id: string
          name: string
          description: string | null
          age_min: number | null
          age_max: number | null
          gender: string | null
          notes: string | null
          status: 'open' | 'casting' | 'filled' | 'cancelled'
          script_url: string | null
          min_height_cm: number | null
          max_height_cm: number | null
          required_skills: string[]
          city: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_roles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['project_roles']['Insert']>
      }
      talent: {
        Row: {
          id: string
          organization_id: string
          full_name: string
          email: string | null
          phone: string | null
          birth_year: number | null
          city: string | null
          manager_name: string | null
          agency_name: string | null
          visibility: 'public' | 'private'
          availability: 'available' | 'busy' | 'unavailable'
          work_permit: string[] | null
          gender: string | null
          playable_age_min: number | null
          playable_age_max: number | null
          height_cm: number | null
          weight_kg: number | null
          hair_color: string | null
          hair_length: string | null
          eye_color: string | null
          skills: string[]
          licenses: string[]
          notes: string | null
          avatar_url: string | null
          photos: string[] | null
          fee_type: 'daily' | 'weekly' | 'per_episode' | 'monthly' | 'per_project' | 'hourly' | null
          fee_amount: number | null
          fee_currency: string | null
          fee_notes: string | null
          showreel_url: string | null
          selftape_drama_url: string | null
          selftape_comedy_url: string | null
          selftape_ad_url: string | null
          voice_sample_url: string | null
          commission_rate: number | null
          representation_start_date: string | null
          representation_end_date: string | null
          exclusive_representation: boolean
          contract_file_path: string | null
          tax_status: 'belirtilmedi' | 'serbest_meslek' | 'sahis_sirketi' | 'sirket' | 'ucret_bordrosu'
          tax_id: string | null
          assigned_to: string | null
          self_service_token: string
          union_member: boolean
          union_name: string | null
          union_id_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['talent']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['talent']['Insert']>
      }
      clients: {
        Row: {
          id: string
          organization_id: string
          name: string
          client_type: 'yapim_sirketi' | 'reklam_ajansi' | 'marka' | 'diger'
          contact_name: string | null
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          organization_id: string
          talent_id: string
          client_id: string | null
          client_name: string
          job_type: 'dizi' | 'reklam' | 'film' | 'sunuculuk' | 'seslendirme' | 'etkinlik' | 'diger'
          title: string | null
          work_date: string
          work_date_end: string | null
          is_ongoing: boolean
          gross_amount: number
          currency: string
          commission_rate: number | null
          commission_amount: number | null
          withholding_rate: number
          withholding_amount: number
          net_amount: number
          amount_paid: number
          exclusivity_end_date: string | null
          exclusivity_notes: string | null
          payment_due_date: string | null
          payment_status: 'pending' | 'partial' | 'paid'
          payment_flow: 'client_to_agency' | 'client_to_talent'
          commission_collected: boolean
          google_event_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      talent_documents: {
        Row: {
          id: string
          organization_id: string
          talent_id: string
          document_type: 'kimlik' | 'saglik_raporu' | 'calisma_izni' | 'pasaport' | 'vize' | 'veli_izni' | 'diger'
          file_path: string | null
          expiry_date: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['talent_documents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['talent_documents']['Insert']>
      }
      agency_tasks: {
        Row: {
          id: string
          organization_id: string
          talent_id: string | null
          title: string
          due_date: string | null
          is_done: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['agency_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['agency_tasks']['Insert']>
      }
      talent_advances: {
        Row: {
          id: string
          organization_id: string
          talent_id: string
          booking_id: string | null
          type: 'avans' | 'masraf'
          amount: number
          currency: string
          date: string
          description: string | null
          is_settled: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['talent_advances']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['talent_advances']['Insert']>
      }
      talent_representation_history: {
        Row: {
          id: string
          organization_id: string
          talent_id: string
          start_date: string
          end_date: string | null
          commission_rate: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['talent_representation_history']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['talent_representation_history']['Insert']>
      }
      talent_languages: {
        Row: {
          id: string
          talent_id: string
          organization_id: string
          language: string
          level: 'native' | 'C2' | 'C1' | 'B2' | 'B1' | 'A2' | 'A1'
          accents: string | null
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['talent_languages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['talent_languages']['Insert']>
      }
      talent_experiences: {
        Row: {
          id: string
          talent_id: string
          organization_id: string
          project_name: string
          year: number | null
          role_name: string | null
          role_type: 'lead' | 'supporting' | 'guest' | 'cameo' | 'ad' | 'extra' | 'voiceover' | null
          production_type: 'film' | 'dizi' | 'reklam' | 'tiyatro' | 'diger' | null
          director: string | null
          production_company: string | null
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['talent_experiences']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['talent_experiences']['Insert']>
      }
      talent_education: {
        Row: {
          id: string
          talent_id: string
          organization_id: string
          school: string
          program: string | null
          year: number | null
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['talent_education']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['talent_education']['Insert']>
      }
      auditions: {
        Row: {
          id: string
          organization_id: string
          role_id: string
          talent_id: string | null
          talent_name: string | null
          talent_email: string | null
          status: 'candidate' | 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'selected'
          notes: string | null
          token: string
          invite_phone: string | null
          sort_order: number
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['auditions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['auditions']['Insert']>
      }
      audition_videos: {
        Row: {
          id: string
          audition_id: string
          organization_id: string
          storage_path: string
          public_url: string | null
          duration_seconds: number | null
          notes: string | null
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['audition_videos']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['audition_videos']['Insert']>
      }
    }
    Functions: {
      get_user_org_id: { Returns: string }
      get_user_role: { Returns: string }
    }
  }
}

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectRole = Database['public']['Tables']['project_roles']['Row']
export type Talent = Database['public']['Tables']['talent']['Row']
export type TalentLanguage = Database['public']['Tables']['talent_languages']['Row']
export type TalentExperience = Database['public']['Tables']['talent_experiences']['Row']
export type TalentEducation = Database['public']['Tables']['talent_education']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type TalentDocument = Database['public']['Tables']['talent_documents']['Row']
export type RepresentationPeriod = Database['public']['Tables']['talent_representation_history']['Row']
export type TalentAdvance = Database['public']['Tables']['talent_advances']['Row']
export type AgencyTask = Database['public']['Tables']['agency_tasks']['Row']
export type Audition = Database['public']['Tables']['auditions']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']

export interface TalentWithRelations extends Talent {
  languages?: TalentLanguage[]
  experiences?: TalentExperience[]
  education?: TalentEducation[]
}
