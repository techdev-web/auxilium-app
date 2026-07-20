import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Otp: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  ChangePassword: undefined;
};

export type ListingsStackParamList = {
  ManageListings: undefined;
  ViewListings: undefined;
  CreateListing: undefined;
  ImportFromGis: undefined;
};

export type LandGISStackParamList = {
  LandGISHome: undefined;
  ProjectMapWorkspace: {
    projectId: string;
    projectTitle: string;
  };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Listings: NavigatorScreenParams<ListingsStackParamList> | undefined;
  Profile: undefined;
  Owners: undefined;
  Transactions: undefined;
  LandGIS: NavigatorScreenParams<LandGISStackParamList> | undefined;
};
