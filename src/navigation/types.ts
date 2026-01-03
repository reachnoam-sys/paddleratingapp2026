import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define your screen params here
export type RootStackParamList = {
  Home: { courtId?: string; ref?: string }; // Optional deep link params
  Court: { courtId: string; ref?: string };  // Court detail with referrer
  CourtsMap: undefined;                       // Fallback for invalid court IDs
  Profile: { userId?: string };
  Settings: undefined;
  MatchHistory: undefined;
  Challenge: { playerId: string };
  FindPartner: undefined;
};

// Helper types for screen props
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type CourtScreenProps = NativeStackScreenProps<RootStackParamList, 'Court'>;
export type CourtsMapScreenProps = NativeStackScreenProps<RootStackParamList, 'CourtsMap'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type MatchHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'MatchHistory'>;
export type ChallengeScreenProps = NativeStackScreenProps<RootStackParamList, 'Challenge'>;
export type FindPartnerScreenProps = NativeStackScreenProps<RootStackParamList, 'FindPartner'>;

// Declare global types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
