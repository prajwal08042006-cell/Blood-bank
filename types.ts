
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export enum UserRole {
  USER = 'USER',
  BLOOD_BANK = 'BLOOD_BANK',
  ADMIN = 'ADMIN'
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface UserDocument {
  id: string;
  type: 'ID_PROOF' | 'MEDICAL_REPORT' | 'CERTIFICATE';
  name: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  uploadDate: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bloodGroup: BloodGroup;
  lastDonated?: string; // ISO Date
  isAvailable: boolean;
  location: Location;
  role: UserRole;
  impactScore: number;
  documents: UserDocument[];
  donationHistory: {
    date: string;
    location: string;
    type: string;
    points: number;
  }[];
  stock?: Record<BloodGroup, number>; // Added for Blood Bank users
}

export interface BloodBank {
  id: string;
  name: string;
  location: Location;
  stock: Record<BloodGroup, number>;
  contact: string;
}

export interface EmergencyRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  bloodGroup: BloodGroup;
  hospitalName: string;
  urgency: 'NORMAL' | 'EMERGENCY';
  location: Location;
  createdAt: string;
  status: 'ACTIVE' | 'FULFILLED' | 'EXPIRED';
}

export interface DonorMatch {
  donor: UserProfile;
  score: number;
  distanceKm: number;
  reason: string;
}
