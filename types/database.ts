// ── Menajerlik CRM ortak enum'ları ──
// Karşılık gelen etiketler lib/crm.ts'te, DB CHECK'leri 047_agency_crm.sql'de.
export type ClientType = 'yapim_sirketi' | 'reklam_ajansi' | 'marka' | 'casting_ajansi' | 'pr_ajansi' | 'diger'
export type ClientTier = 'tier_1' | 'tier_2' | 'tier_3'
export type IndustrySegment = 'dizi' | 'sinema' | 'dijital_ott' | 'reklam' | 'moda' | 'etkinlik' | 'tiyatro' | 'seslendirme'
export type PaymentTerms = 'avans' | 'net_15' | 'net_30' | 'net_60' | 'net_90' | 'yayin_sonrasi'
export type PaymentRating = 'belirsiz' | 'guvenilir' | 'gecikmeli' | 'riskli'
export type BudgetRange = 'dusuk' | 'orta' | 'premium'
export type WorkingStatus = 'aktif' | 'potansiyel' | 'gecmis' | 'kara_liste'
export type ContactRole =
  | 'uygulayici_yapimci' | 'casting_direktoru' | 'yonetmen' | 'marka_muduru'
  | 'ajans_produktoru' | 'yapim_koordinatoru' | 'finans' | 'diger'
export type BrandCategory =
  | 'bankacilik' | 'telekom' | 'icecek' | 'otomotiv' | 'gida' | 'kozmetik' | 'perakende' | 'moda'
  | 'elektronik' | 'sigorta' | 'havayolu' | 'gayrimenkul' | 'saglik' | 'e_ticaret' | 'enerji' | 'sans_oyunlari'
export type PitchStage = 'brief' | 'oyuncu_onerildi' | 'opsiyon' | 'sozlesme' | 'kazanildi' | 'kaybedildi'
export type PitchProjectType = 'dizi' | 'reklam' | 'film' | 'dijital' | 'tiyatro' | 'sunuculuk' | 'seslendirme' | 'etkinlik' | 'diger'
export type PitchItemStatus = 'onerildi' | 'on_elemede' | 'geri_cagrildi' | 'secildi' | 'elendi' | 'geri_cekildi'

// ── Org-arası rol paylaşımı (production ↔ agency) ──
export type RoleShareStatus = 'active' | 'revoked' | 'role_closed' | 'expired'
export type RoleShareSubmissionStatus = 'taslak' | 'gonderildi' | 'incelendi' | 'kismen_kabul' | 'kabul' | 'red'
export type SubmissionItemDecision = 'beklemede' | 'begenildi' | 'reddedildi'
export type NotificationType = 'role_shared' | 'submission_received' | 'submission_decided' | 'share_revoked' | 'share_expiring'

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
          public_slug: string | null
          accepts_external_shares: boolean
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
          client_type: ClientType
          contact_name: string | null
          phone: string | null
          email: string | null
          notes: string | null
          industry_segments: IndustrySegment[]
          parent_client_id: string | null
          tier: ClientTier
          website: string | null
          address: string | null
          tax_office: string | null
          tax_number: string | null
          payment_terms: PaymentTerms
          payment_rating: PaymentRating
          credit_limit: number | null
          billing_email: string | null
          account_manager_id: string | null
          exclusivity_categories: BrandCategory[]
          preferred_pitch_styles: string | null
          budget_range: BudgetRange | null
          working_status: WorkingStatus
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      client_contacts: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          full_name: string
          role: ContactRole
          title: string | null
          email: string | null
          phone: string | null
          is_primary: boolean
          last_contacted_at: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['client_contacts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['client_contacts']['Insert']>
      }
      client_interactions: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          talent_id: string | null
          contact_id: string | null
          interaction_type:
            | 'tanisma' | 'telefon_gorusmesi' | 'toplanti' | 'oyuncu_onerisi'
            | 'audition_talebi' | 'okuma_provasi' | 'kostum_provasi'
            | 'deneme_cekimi' | 'sozlesme_gorusmesi' | 'diger'
          interaction_date: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['client_interactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['client_interactions']['Insert']>
      }
      pitches: {
        Row: {
          id: string
          organization_id: string
          client_id: string
          title: string
          project_type: PitchProjectType
          stage: PitchStage
          brand_category: BrandCategory | null
          expected_start_date: string | null
          decision_due_date: string | null
          estimated_value: number | null
          currency: string
          owner_id: string | null
          lost_reason: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['pitches']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['pitches']['Insert']>
      }
      pitch_items: {
        Row: {
          id: string
          organization_id: string
          pitch_id: string
          talent_id: string
          role_name: string | null
          status: PitchItemStatus
          proposed_fee: number | null
          client_offer: number | null
          fee_type: 'daily' | 'weekly' | 'per_episode' | 'monthly' | 'per_project' | 'hourly' | null
          currency: string
          client_feedback: string | null
          booking_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['pitch_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['pitch_items']['Insert']>
      }
      org_partners: {
        Row: {
          id: string
          organization_id: string
          partner_organization_id: string
          first_connected_at: string
        }
        Insert: Omit<Database['public']['Tables']['org_partners']['Row'], 'id' | 'first_connected_at'>
        Update: Partial<Database['public']['Tables']['org_partners']['Insert']>
      }
      role_shares: {
        Row: {
          id: string
          organization_id: string
          project_role_id: string
          target_organization_id: string
          role_title: string
          role_description: string | null
          project_title: string | null
          gender: string | null
          age_min: number | null
          age_max: number | null
          height_min: number | null
          height_max: number | null
          required_skills: string[]
          city: string | null
          submission_deadline: string | null
          script_asset_path: string | null
          share_token: string
          message: string | null
          status: RoleShareStatus
          expires_at: string | null
          reminder_sent_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['role_shares']['Row'], 'id' | 'share_token' | 'created_at' | 'updated_at'> & { share_token?: string }
        Update: Partial<Database['public']['Tables']['role_shares']['Insert']>
      }
      role_share_submissions: {
        Row: {
          id: string
          role_share_id: string
          agency_organization_id: string
          submitted_by: string | null
          status: RoleShareSubmissionStatus
          pdf_url: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['role_share_submissions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['role_share_submissions']['Insert']>
      }
      role_share_submission_items: {
        Row: {
          id: string
          submission_id: string
          source_talent_id: string | null
          full_name: string
          photo_url: string | null
          age: number | null
          height_cm: number | null
          city: string | null
          reel_url: string | null
          proposed_fee: number | null
          currency: string
          agency_notes: string | null
          cd_decision: SubmissionItemDecision
          gender: string | null
          skills: string[]
          languages: string[]
          bio: string | null
          notable_experience: string | null
          photos: string[]
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['role_share_submission_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['role_share_submission_items']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          organization_id: string
          type: NotificationType
          title: string
          body: string | null
          link_url: string | null
          related_id: string | null
          read_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
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
          exclusivity_category: BrandCategory | null
          pitch_item_id: string | null
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
export type ClientContact = Database['public']['Tables']['client_contacts']['Row']
export type ClientInteraction = Database['public']['Tables']['client_interactions']['Row']
export type Pitch = Database['public']['Tables']['pitches']['Row']
export type PitchItem = Database['public']['Tables']['pitch_items']['Row']
export type OrgPartner = Database['public']['Tables']['org_partners']['Row']
export type RoleShare = Database['public']['Tables']['role_shares']['Row']
export type RoleShareSubmission = Database['public']['Tables']['role_share_submissions']['Row']
export type RoleShareSubmissionItem = Database['public']['Tables']['role_share_submission_items']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
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
