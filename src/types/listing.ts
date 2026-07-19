export type ListingMedia = {
  media_id: number;
  listing_id: number;
  media_url: string;
  media_type: string;
  file_name?: string | null;
  file_size?: number | null;
  upload_date?: string | null;
  is_primary?: boolean;
};

export type ListingState = {
  state_id: number;
  state_name: string;
};

export type ListingDistrict = {
  district_id: number;
  district_name: string;
};

export type ListingVillage = {
  id: number;
  name: string;
  pincode?: string | null;
};

export type Listing = {
  listing_id: number;
  listing_title: string;
  description?: string | null;
  offering_type?: 'SELL' | 'LEASE' | string | null;
  listing_status?: string | null;
  total_acreage?: string | null;
  actual_acreage?: string | null;
  land_profile?: string | null;
  land_type?: string[] | null;
  suitable_for?: string[] | null;
  category?: string | null;
  soil_type?: string | null;
  asking_price?: string | null;
  is_asking_price_negotiable?: boolean | null;
  capacity?: string | null;
  created_at?: string;
  updated_at?: string;
  state?: ListingState | null;
  district?: ListingDistrict | null;
  village?: ListingVillage | null;
  media?: ListingMedia[];
};

export type ListingsResponse = {
  data: Listing[];
  count: number;
  pageCount: number;
  page: number | string;
  limit: number | string;
};
