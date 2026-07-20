export type CreateProjectInput = {
  title: string;
  listingCenter: string;
  substationCoordinates: string;
  stateId: number;
  districtId: number;
  subDistrictId: number | null;
  villageId: number | null;
  stateName: string | null;
  districtName: string | null;
  subDistrictName: string | null;
  villageName: string | null;
};

export type Project = CreateProjectInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
