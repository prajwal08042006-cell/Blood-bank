import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, BloodGroup, UserRole, BloodBank, EmergencyRequest, UserDocument, AccountStatus } from '../types';
import { logger } from '../lib/logger';

// ============================
// USER PROFILES
// ============================

export const createUserProfile = async (
  uid: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    bloodGroup: BloodGroup;
    role: UserRole;
    location?: { lat: number; lng: number; address?: string };
    documents?: UserDocument[];
    licenseNumber?: string;
  }
): Promise<void> => {
  const userDoc = {
    uid,
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    bloodGroup: data.bloodGroup,
    role: data.role,
    isAvailable: true,
    impactScore: 0,
    location: data.location || { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, KA' },
    documents: data.documents || [],
    donationHistory: [],
    accountStatus: 'PENDING' as AccountStatus,
    licenseNumber: data.licenseNumber || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', uid), userDoc);
  logger.info('User profile created:', uid);
};

const mapDocToProfile = (id: string, data: Record<string, unknown>): UserProfile => ({
  id,
  name: data.name as string,
  email: data.email as string,
  phone: data.phone as string | undefined,
  bloodGroup: data.bloodGroup as BloodGroup,
  role: data.role as UserRole,
  isAvailable: data.isAvailable as boolean,
  impactScore: data.impactScore as number,
  location: data.location as UserProfile['location'],
  documents: (data.documents || []) as UserDocument[],
  donationHistory: (data.donationHistory || []) as UserProfile['donationHistory'],
  stock: data.stock as UserProfile['stock'],
  accountStatus: (data.accountStatus || 'PENDING') as AccountStatus,
  licenseNumber: data.licenseNumber as string | undefined,
});

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (!docSnap.exists()) return null;
  return mapDocToProfile(uid, docSnap.data() as Record<string, unknown>);
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const getAllDonors = async (): Promise<UserProfile[]> => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', UserRole.USER),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      email: data.email,
      bloodGroup: data.bloodGroup,
      role: data.role,
      isAvailable: data.isAvailable,
      impactScore: data.impactScore,
      location: data.location,
      documents: data.documents || [],
      donationHistory: data.donationHistory || [],
    } as UserProfile;
  });
};

export const getAvailableDonors = async (bloodGroup?: BloodGroup): Promise<UserProfile[]> => {
  let q;
  if (bloodGroup) {
    q = query(
      collection(db, 'users'),
      where('role', '==', UserRole.USER),
      where('isAvailable', '==', true),
      where('bloodGroup', '==', bloodGroup),
      limit(50)
    );
  } else {
    q = query(
      collection(db, 'users'),
      where('role', '==', UserRole.USER),
      where('isAvailable', '==', true),
      limit(50)
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) =>
    mapDocToProfile(docSnap.id, docSnap.data() as Record<string, unknown>)
  );
};

// ============================
// ADMIN APPROVAL
// ============================

export const getPendingUsers = async (): Promise<UserProfile[]> => {
  const q = query(
    collection(db, 'users'),
    where('accountStatus', '==', 'PENDING'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) =>
    mapDocToProfile(docSnap.id, docSnap.data() as Record<string, unknown>)
  );
};

export const approveUser = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    accountStatus: 'APPROVED',
    updatedAt: serverTimestamp(),
  });
  logger.info('User approved:', uid);
};

export const rejectUser = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    accountStatus: 'REJECTED',
    updatedAt: serverTimestamp(),
  });
  logger.info('User rejected:', uid);
};

// ============================
// BLOOD BANKS
// ============================

export const getBloodBanks = async (): Promise<BloodBank[]> => {
  const snapshot = await getDocs(collection(db, 'bloodBanks'));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      location: data.location,
      stock: data.stock,
      contact: data.contact,
    } as BloodBank;
  });
};

export const updateBloodBankStock = async (
  bankId: string,
  stock: Record<BloodGroup, number>
): Promise<void> => {
  await updateDoc(doc(db, 'bloodBanks', bankId), {
    stock,
    updatedAt: serverTimestamp(),
  });
};

// ============================
// EMERGENCY REQUESTS
// ============================

export const createEmergencyRequest = async (data: {
  requesterId: string;
  requesterName: string;
  bloodGroup: BloodGroup;
  hospitalName: string;
  hospitalLocation: { lat: number; lng: number; address?: string };
  urgency: 'NORMAL' | 'EMERGENCY';
}): Promise<string> => {
  const docRef = await addDoc(collection(db, 'emergencyRequests'), {
    ...data,
    status: 'ACTIVE',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getActiveRequests = async (): Promise<EmergencyRequest[]> => {
  const q = query(
    collection(db, 'emergencyRequests'),
    where('status', '==', 'ACTIVE'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      requesterId: data.requesterId,
      requesterName: data.requesterName,
      bloodGroup: data.bloodGroup,
      hospitalName: data.hospitalName,
      urgency: data.urgency,
      location: data.hospitalLocation,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString(),
      status: data.status,
    } as EmergencyRequest;
  });
};

export const fulfillRequest = async (requestId: string): Promise<void> => {
  await updateDoc(doc(db, 'emergencyRequests', requestId), {
    status: 'FULFILLED',
    updatedAt: serverTimestamp(),
  });
};

// ============================
// SEED DATA
// ============================

export const seedBloodBanks = async (): Promise<void> => {
  const banks = [
    {
      name: 'Narayana Health Blood Bank',
      location: { lat: 12.9915, lng: 77.5946, address: 'Narayana Health, Bengaluru' },
      contact: '+91 80 2212 1234',
      stock: { 'A+': 45, 'A-': 12, 'B+': 30, 'B-': 5, 'AB+': 8, 'AB-': 2, 'O+': 60, 'O-': 15 },
    },
    {
      name: 'Manipal Hospital Blood Center',
      location: { lat: 12.9592, lng: 77.6444, address: 'Manipal Hospital, HAL Airport Road' },
      contact: '+91 80 2502 4444',
      stock: { 'A+': 20, 'A-': 4, 'B+': 15, 'B-': 1, 'AB+': 5, 'AB-': 0, 'O+': 35, 'O-': 8 },
    },
    {
      name: 'JSS Hospital Blood Bank, Mysuru',
      location: { lat: 12.3024, lng: 76.6483, address: 'JSS Hospital, Mysuru' },
      contact: '+91 821 233 5555',
      stock: { 'A+': 15, 'A-': 2, 'B+': 10, 'B-': 0, 'AB+': 3, 'AB-': 1, 'O+': 25, 'O-': 5 },
    },
  ];

  for (const bank of banks) {
    const q = query(collection(db, 'bloodBanks'), where('name', '==', bank.name), limit(1));
    const existing = await getDocs(q);
    if (existing.empty) {
      await addDoc(collection(db, 'bloodBanks'), {
        ...bank,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      logger.info('Seeded blood bank:', bank.name);
    }
  }
};
