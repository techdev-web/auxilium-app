export type State = {
  state_id: number;
  state_name: string;
  is_active: boolean;
};

export type District = {
  district_id: number;
  district_name: string;
  state_id: number;
  is_active: boolean;
};

export type SubDistrict = {
  id: number;
  name: string;
  lgd_code?: string | null;
  district_id: number;
  district?: District & {
    state?: State;
  };
};

export type Village = {
  id: number;
  name: string;
  lgd_code?: string | null;
  sub_district_id: number;
  pincode?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  sub_district?: SubDistrict;
};

export type AdminPlaceNames = {
  state?: string;
  district?: string;
  subDistrict?: string;
  village?: string;
};

export type ResolvedLocation = {
  state: State;
  district: District | null;
  subDistrict: SubDistrict | null;
  village: Village | null;
};
