export type ProfileUser = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  created_at?: string;
  is_active?: boolean;
};

export type ProfileDetails = {
  user_id: number;
  company_name?: string | null;
  middle_name?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  pin_code?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  company_email_id?: string | null;
  company_contact_no?: string | null;
  gst_no?: string | null;
  pan_no?: string | null;
  tan_no?: string | null;
  website?: string | null;
  description?: string | null;
  verification_status?: string | null;
  acreageAvailable?: string | null;
  profile_picture_path?: string | null;
  total_experience_years?: number | null;
  similar_projects_executed?: string | null;
  total_past_projects_executed?: number | null;
  total_land_leased_past?: string | null;
  user?: ProfileUser | null;
};
