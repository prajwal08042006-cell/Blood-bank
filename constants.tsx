
import { UserProfile, BloodGroup, UserRole, BloodBank, EmergencyRequest } from './types';

// Setting lastDonated to approximately 45 days ago for the 90-day cooldown logic
const fortyFiveDaysAgo = new Date();
fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

// Karnataka Central Coordinates: Bengaluru (12.9716, 77.5946)
export const CURRENT_USER: UserProfile = {
  id: 'KA-USER-001',
  name: 'Arjun Kumar',
  email: 'arjun.k@karnataka.gov.in',
  bloodGroup: 'O+',
  isAvailable: true,
  role: UserRole.USER,
  impactScore: 450,
  lastDonated: fortyFiveDaysAgo.toISOString(),
  location: { lat: 12.9716, lng: 77.5946, address: 'Koramangala, Bengaluru, KA' },
  // Adding missing documents property
  documents: [],
  donationHistory: [],
  accountStatus: 'APPROVED'
};

export const MOCK_DONORS: UserProfile[] = [
  {
    id: 'd1',
    name: 'Suresh Raina',
    email: 'suresh@example.com',
    bloodGroup: 'A+',
    isAvailable: true,
    impactScore: 450,
    location: { lat: 12.9352, lng: 77.6245 }, // Indiranagar
    role: UserRole.USER,
    lastDonated: '2023-11-15',
    // Adding missing documents property
    documents: [],
    donationHistory: [],
    accountStatus: 'APPROVED'
  },
  {
    id: 'd2',
    name: 'Priyanka Rao',
    email: 'priyanka@example.com',
    bloodGroup: 'O+',
    isAvailable: true,
    impactScore: 210,
    location: { lat: 12.9719, lng: 77.6412 }, // Koramangala
    role: UserRole.USER,
    lastDonated: '2024-02-01',
    // Adding missing documents property
    documents: [],
    donationHistory: [],
    accountStatus: 'APPROVED'
  },
  {
    id: 'd3',
    name: 'Mohammad Yusuf',
    email: 'yusuf@example.com',
    bloodGroup: 'B-',
    isAvailable: false,
    impactScore: 80,
    location: { lat: 12.2958, lng: 76.6394 }, // Mysuru
    role: UserRole.USER,
    // Adding missing documents property
    documents: [],
    donationHistory: [],
    accountStatus: 'APPROVED'
  }
];

export const MOCK_BLOOD_BANKS: BloodBank[] = [
  {
    id: 'bb1',
    name: 'Narayana Health Blood Bank',
    location: { lat: 12.9915, lng: 77.5946 },
    contact: '+91 80 2212 1234',
    stock: {
      'A+': 45, 'A-': 12, 'B+': 30, 'B-': 5, 'AB+': 8, 'AB-': 2, 'O+': 60, 'O-': 15
    }
  },
  {
    id: 'bb2',
    name: 'Manipal Hospital Blood Center',
    location: { lat: 12.9592, lng: 77.6444 },
    contact: '+91 80 2502 4444',
    stock: {
      'A+': 20, 'A-': 4, 'B+': 15, 'B-': 1, 'AB+': 5, 'AB-': 0, 'O+': 35, 'O-': 8
    }
  },
  {
    id: 'bb3',
    name: 'JSS Hospital Blood Bank, Mysuru',
    location: { lat: 12.3024, lng: 76.6483 },
    contact: '+91 821 233 5555',
    stock: {
      'A+': 15, 'A-': 2, 'B+': 10, 'B-': 0, 'AB+': 3, 'AB-': 1, 'O+': 25, 'O-': 5
    }
  }
];

export const MOCK_REQUESTS: EmergencyRequest[] = [
  {
    id: 'req-ka-01',
    requesterId: 'u-88',
    requesterName: 'Deepa Hegde',
    bloodGroup: 'O-',
    hospitalName: 'Victoria Hospital, Bengaluru',
    urgency: 'EMERGENCY',
    location: { lat: 12.9644, lng: 77.5761 },
    createdAt: new Date().toISOString(),
    status: 'ACTIVE'
  }
];
