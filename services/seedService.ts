import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { UserRole, BloodGroup } from '../types';
import { logger } from '../lib/logger';

// ============================
// KARNATAKA LOCATION DATA
// ============================

const BANGALORE_LOCATIONS = [
  { lat: 12.9716, lng: 77.5946, address: 'Koramangala, Bengaluru' },
  { lat: 12.9352, lng: 77.6245, address: 'Indiranagar, Bengaluru' },
  { lat: 12.9698, lng: 77.7500, address: 'Whitefield, Bengaluru' },
  { lat: 13.0358, lng: 77.5970, address: 'Hebbal, Bengaluru' },
  { lat: 12.9063, lng: 77.5857, address: 'Jayanagar, Bengaluru' },
  { lat: 12.9141, lng: 77.6446, address: 'BTM Layout, Bengaluru' },
  { lat: 12.9916, lng: 77.7120, address: 'Marathahalli, Bengaluru' },
  { lat: 12.9577, lng: 77.7480, address: 'Varthur, Bengaluru' },
  { lat: 13.0067, lng: 77.5671, address: 'Malleswaram, Bengaluru' },
  { lat: 12.9719, lng: 77.6412, address: 'HSR Layout, Bengaluru' },
  { lat: 13.0604, lng: 77.5878, address: 'Yelahanka, Bengaluru' },
  { lat: 12.8438, lng: 77.6630, address: 'Electronic City, Bengaluru' },
  { lat: 12.9260, lng: 77.6762, address: 'Bellandur, Bengaluru' },
  { lat: 12.9850, lng: 77.5533, address: 'Rajajinagar, Bengaluru' },
  { lat: 13.0280, lng: 77.6388, address: 'Kalyan Nagar, Bengaluru' },
  { lat: 12.9170, lng: 77.5247, address: 'Basavanagudi, Bengaluru' },
  { lat: 12.9767, lng: 77.5713, address: 'Shivajinagar, Bengaluru' },
  { lat: 13.0169, lng: 77.5688, address: 'Sadashivanagar, Bengaluru' },
  { lat: 12.8918, lng: 77.5743, address: 'Banashankari, Bengaluru' },
  { lat: 12.9395, lng: 77.5648, address: 'Wilson Garden, Bengaluru' },
  { lat: 12.9542, lng: 77.5851, address: 'Richmond Town, Bengaluru' },
  { lat: 13.0102, lng: 77.5518, address: 'Yeshwanthpur, Bengaluru' },
  { lat: 12.8690, lng: 77.5785, address: 'JP Nagar, Bengaluru' },
  { lat: 12.8996, lng: 77.5960, address: 'Padmanabhanagar, Bengaluru' },
  { lat: 13.0450, lng: 77.6209, address: 'Nagawara, Bengaluru' },
  { lat: 12.9592, lng: 77.6974, address: 'Sarjapur, Bengaluru' },
  { lat: 12.9229, lng: 77.5596, address: 'Chamarajpet, Bengaluru' },
  { lat: 12.9857, lng: 77.6067, address: 'Cox Town, Bengaluru' },
  { lat: 12.9279, lng: 77.6271, address: 'Koramangala 4th Block, Bengaluru' },
  { lat: 13.0372, lng: 77.5614, address: 'Mathikere, Bengaluru' },
];

const MYSORE_LOCATIONS = [
  { lat: 12.2958, lng: 76.6394, address: 'Saraswathipuram, Mysuru' },
  { lat: 12.3024, lng: 76.6483, address: 'Lakshmipuram, Mysuru' },
  { lat: 12.3140, lng: 76.6524, address: 'Gokulam, Mysuru' },
  { lat: 12.3051, lng: 76.6261, address: 'Kuvempu Nagar, Mysuru' },
  { lat: 12.2738, lng: 76.6398, address: 'VV Mohalla, Mysuru' },
  { lat: 12.3161, lng: 76.6121, address: 'Vijayanagar, Mysuru' },
  { lat: 12.3352, lng: 76.6166, address: 'Hebbal, Mysuru' },
  { lat: 12.2876, lng: 76.6593, address: 'Nazarbad, Mysuru' },
  { lat: 12.2643, lng: 76.6447, address: 'Chamundipuram, Mysuru' },
  { lat: 12.3100, lng: 76.6328, address: 'Jayalakshmipuram, Mysuru' },
];

const OTHER_KA_LOCATIONS = [
  { lat: 15.3647, lng: 75.1240, address: 'Dharwad, Karnataka' },
  { lat: 14.4644, lng: 75.9218, address: 'Davangere, Karnataka' },
  { lat: 15.4589, lng: 75.0078, address: 'Hubli, Karnataka' },
  { lat: 12.8685, lng: 74.8425, address: 'Mangalore, Karnataka' },
  { lat: 14.6819, lng: 75.4846, address: 'Shimoga, Karnataka' },
  { lat: 13.9299, lng: 75.5681, address: 'Chikmagalur, Karnataka' },
  { lat: 12.5266, lng: 76.8953, address: 'Mandya, Karnataka' },
  { lat: 13.3370, lng: 77.1010, address: 'Tumkur, Karnataka' },
  { lat: 12.7183, lng: 77.2793, address: 'Ramanagara, Karnataka' },
  { lat: 14.0956, lng: 76.2723, address: 'Chitradurga, Karnataka' },
];

// ============================
// NAME DATA
// ============================

const FIRST_NAMES_MALE = [
  'Arun', 'Balaji', 'Chandan', 'Darshan', 'Eshwar', 'Ganesh', 'Harsha', 'Kiran',
  'Lokesh', 'Mahesh', 'Naveen', 'Prasad', 'Ravi', 'Suresh', 'Tejas', 'Vinod',
  'Yogesh', 'Abhishek', 'Deepak', 'Girish', 'Hemanth', 'Jagadish', 'Karthik',
  'Manoj', 'Nandan', 'Pavan', 'Rakesh', 'Sachin', 'Varun', 'Venu', 'Ajay',
  'Basavaraj', 'Chethan', 'Dinesh', 'Gopal', 'Hari', 'Jayesh', 'Kumar', 'Mohan',
  'Nagesh', 'Praveen', 'Rajesh', 'Santosh', 'Vikram', 'Ashok', 'Bharath', 'Chandru',
  'Gururaj', 'Madhu', 'Nagaraj', 'Pramod', 'Ramesh', 'Sanjay', 'Shivaraj', 'Umesh',
  'Vishal', 'Anand', 'Bhaskar', 'Shrinivas', 'Pradeep', 'Manjunath',
];

const FIRST_NAMES_FEMALE = [
  'Asha', 'Bhavana', 'Chaitra', 'Deepa', 'Geetha', 'Kavya', 'Lakshmi', 'Meera',
  'Nandini', 'Pooja', 'Rashmi', 'Savitha', 'Shruthi', 'Vani', 'Ananya', 'Divya',
  'Hema', 'Jyothi', 'Keerthi', 'Megha', 'Pallavi', 'Renuka', 'Sowmya', 'Tanuja',
  'Vidya', 'Amrutha', 'Brinda', 'Chandana', 'Eshwari', 'Gayathri', 'Kavitha',
  'Mamatha', 'Nethravathi', 'Padma', 'Roopa', 'Suma', 'Shwetha', 'Veena', 'Yamuna',
  'Akshatha', 'Bhargavi', 'Deeksha', 'Harini', 'Indu', 'Kruthika', 'Latha',
  'Manasa', 'Niveditha', 'Prarthana', 'Rukmini', 'Sahana', 'Swathi', 'Varsha',
];

const LAST_NAMES = [
  'Reddy', 'Gowda', 'Shetty', 'Rao', 'Patil', 'Kulkarni', 'Naik', 'Hegde',
  'Kumar', 'Swamy', 'Murthy', 'Prasad', 'Nayak', 'Srinivas', 'Bhat', 'Desai',
  'Joshi', 'Kamath', 'Acharya', 'Prabhu', 'Sharma', 'Pai', 'Iyengar', 'Iyer',
  'Katti', 'Hosamani', 'Kumbhar', 'Nadiger', 'Angadi', 'Devadiga',
];

// ============================
// HELPERS
// ============================

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPhone = () => `+91 ${randomInt(70, 99)}${randomInt(10000000, 99999999)}`;

const jitter = (val: number, range: number) => val + (Math.random() - 0.5) * range;

const generateLocation = () => {
  // 60% Bangalore, 25% Mysore, 15% other Karnataka
  const roll = Math.random();
  if (roll < 0.6) {
    const base = randomPick(BANGALORE_LOCATIONS);
    return { lat: jitter(base.lat, 0.02), lng: jitter(base.lng, 0.02), address: base.address };
  } else if (roll < 0.85) {
    const base = randomPick(MYSORE_LOCATIONS);
    return { lat: jitter(base.lat, 0.015), lng: jitter(base.lng, 0.015), address: base.address };
  } else {
    const base = randomPick(OTHER_KA_LOCATIONS);
    return { lat: jitter(base.lat, 0.01), lng: jitter(base.lng, 0.01), address: base.address };
  }
};

const generateName = (i: number) => {
  const isFemale = i % 3 === 0;
  const first = isFemale ? randomPick(FIRST_NAMES_FEMALE) : randomPick(FIRST_NAMES_MALE);
  const last = randomPick(LAST_NAMES);
  return `${first} ${last}`;
};

const generateEmail = (name: string, i: number) => {
  const clean = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
  return `${clean}${i}@gmail.com`;
};

const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

// ============================
// BLOOD BANK DATA (20)
// ============================

const BLOOD_BANK_DATA = [
  { name: 'Narayana Health Blood Bank', address: 'Hosur Road, Bommasandra, Bengaluru', lat: 12.8085, lng: 77.6590, contact: '+91 80 2783 5000' },
  { name: 'Manipal Hospital Blood Centre', address: 'HAL Airport Road, Bengaluru', lat: 12.9592, lng: 77.6444, contact: '+91 80 2502 4444' },
  { name: 'St. John\'s Medical Blood Bank', address: 'Sarjapur Road, Bengaluru', lat: 12.9280, lng: 77.6250, contact: '+91 80 2206 5000' },
  { name: 'Bangalore Medical Services Trust', address: 'Shantinagar, Bengaluru', lat: 12.9536, lng: 77.5998, contact: '+91 80 2224 5678' },
  { name: 'Victoria Hospital Blood Bank', address: 'KR Market, Bengaluru', lat: 12.9644, lng: 77.5761, contact: '+91 80 2670 1150' },
  { name: 'Bowring Hospital Blood Bank', address: 'Shivajinagar, Bengaluru', lat: 12.9820, lng: 77.6030, contact: '+91 80 2559 0245' },
  { name: 'KC General Hospital Blood Bank', address: 'Malleswaram, Bengaluru', lat: 13.0040, lng: 77.5694, contact: '+91 80 2334 3480' },
  { name: 'Jayadeva Blood Bank', address: 'Jayanagar 9th Block, Bengaluru', lat: 12.9130, lng: 77.5850, contact: '+91 80 2653 4266' },
  { name: 'NIMHANS Blood Centre', address: 'Hosur Road, Bengaluru', lat: 12.9388, lng: 77.5969, contact: '+91 80 2699 5000' },
  { name: 'Sparsh Hospital Blood Bank', address: 'Infantry Road, Bengaluru', lat: 12.9783, lng: 77.5965, contact: '+91 80 4677 0000' },
  { name: 'Columbia Asia Blood Bank', address: 'Hebbal, Bengaluru', lat: 13.0380, lng: 77.5960, contact: '+91 80 4670 6070' },
  { name: 'BGS Global Blood Centre', address: 'Kengeri, Bengaluru', lat: 12.8985, lng: 77.4876, contact: '+91 80 2684 8478' },
  { name: 'Aster CMI Blood Bank', address: 'Sahakara Nagar, Bengaluru', lat: 13.0590, lng: 77.5870, contact: '+91 80 4342 0100' },
  { name: 'Fortis Hospital Blood Bank', address: 'Bannerghatta Road, Bengaluru', lat: 12.8880, lng: 77.5970, contact: '+91 80 6621 4444' },
  { name: 'JSS Hospital Blood Bank', address: 'Ramanuja Road, Mysuru', lat: 12.3024, lng: 76.6483, contact: '+91 821 233 5555' },
  { name: 'KR Hospital Blood Bank', address: 'Irwin Road, Mysuru', lat: 12.3051, lng: 76.6540, contact: '+91 821 242 3800' },
  { name: 'Apollo BGS Blood Centre', address: 'Adichunchanagiri Road, Mysuru', lat: 12.2890, lng: 76.6480, contact: '+91 821 252 5000' },
  { name: 'Columbia Asia Mysore Blood Bank', address: 'Nazarbad, Mysuru', lat: 12.2876, lng: 76.6593, contact: '+91 821 399 9999' },
  { name: 'Mysore Blood Bank', address: 'Saraswathipuram, Mysuru', lat: 12.2958, lng: 76.6394, contact: '+91 821 241 2345' },
  { name: 'SDM Blood Bank Dharwad', address: 'Sattur, Dharwad', lat: 15.3647, lng: 75.1240, contact: '+91 836 246 8631' },
];

// ============================
// SEED FUNCTION
// ============================

export const clearAndSeedDatabase = async (): Promise<void> => {
  logger.info('🗑️ Clearing existing data...');

  // Clear users collection
  const usersSnap = await getDocs(collection(db, 'users'));
  const deletePromises: Promise<void>[] = [];
  usersSnap.forEach((d) => deletePromises.push(deleteDoc(d.ref)));

  // Clear blood_banks collection
  const banksSnap = await getDocs(collection(db, 'blood_banks'));
  banksSnap.forEach((d) => deletePromises.push(deleteDoc(d.ref)));

  // Clear emergency_requests collection
  const reqsSnap = await getDocs(collection(db, 'emergency_requests'));
  reqsSnap.forEach((d) => deletePromises.push(deleteDoc(d.ref)));

  await Promise.all(deletePromises);
  logger.info('✅ Cleared all collections');

  // ===== ADMIN =====
  logger.info('👤 Creating admin account in Firestore...');
  try {
    const adminUid = 'admin_prajwal08042006';
    await setDoc(doc(db, 'users', adminUid), {
      uid: adminUid,
      name: 'Prajwal Admin',
      email: 'prajwal08042006@gmail.com',
      phone: '+91 9876543210',
      bloodGroup: 'O+',
      role: UserRole.ADMIN,
      isAvailable: false,
      impactScore: 0,
      location: { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, KA' },
      documents: [],
      donationHistory: [],
      accountStatus: 'APPROVED',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    logger.info('✅ Admin Firestore profile created/updated');
  } catch (err: unknown) {
    logger.error('❌ Failed to create admin profile:', err);
  }

  // ===== 200 DONORS =====
  logger.info('👥 Seeding 200 donor users...');
  for (let batchStart = 0; batchStart < 200; batchStart += 20) {
    const batch = writeBatch(db);
    const batchEnd = Math.min(batchStart + 20, 200);

    for (let i = batchStart; i < batchEnd; i++) {
      const name = generateName(i);
      const email = generateEmail(name, i);
      const loc = generateLocation();
      const userId = `donor_${String(i + 1).padStart(3, '0')}`;

      const hasLastDonated = Math.random() > 0.3;
      const userData: any = {
        uid: userId,
        name,
        email,
        phone: randomPhone(),
        bloodGroup: randomPick(BLOOD_GROUPS),
        role: UserRole.USER,
        isAvailable: Math.random() > 0.15, // 85% available
        impactScore: randomInt(10, 800),
        location: loc,
        documents: [
          { id: `id_${i}`, type: 'ID_PROOF', name: 'Aadhaar Card.pdf', status: 'VERIFIED', uploadDate: daysAgo(randomInt(30, 365)) },
          { id: `med_${i}`, type: 'CERTIFICATE', name: 'Medical Certificate.pdf', status: 'VERIFIED', uploadDate: daysAgo(randomInt(30, 365)) },
        ],
        donationHistory: Array.from({ length: randomInt(0, 5) }, (_, j) => ({
          date: daysAgo(randomInt(30 + j * 90, 60 + j * 90)),
          location: randomPick(BLOOD_BANK_DATA).name,
          type: randomPick(['Whole Blood', 'Platelets', 'Plasma']),
          points: randomInt(50, 200),
        })),
        accountStatus: 'APPROVED',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (hasLastDonated) {
        userData.lastDonated = daysAgo(randomInt(15, 180));
      }

      batch.set(doc(db, 'users', userId), userData);
    }

    await batch.commit();
    logger.info(`  ✅ Batch ${batchStart + 1}-${batchEnd} committed`);
  }

  // ===== 20 BLOOD BANKS =====
  logger.info('🏥 Seeding 20 blood banks...');
  const bankBatch = writeBatch(db);

  for (let i = 0; i < BLOOD_BANK_DATA.length; i++) {
    const b = BLOOD_BANK_DATA[i];
    const bankId = `bank_${String(i + 1).padStart(2, '0')}`;

    // Blood bank in users collection (for login)
    bankBatch.set(doc(db, 'users', bankId), {
      uid: bankId,
      name: b.name,
      email: `bloodbank${i + 1}@karnataka.gov.in`,
      phone: b.contact,
      bloodGroup: 'O+',
      role: UserRole.BLOOD_BANK,
      isAvailable: true,
      impactScore: 0,
      location: { lat: b.lat, lng: b.lng, address: b.address },
      documents: [
        { id: `lic_${i}`, type: 'CERTIFICATE', name: 'Blood Bank License.pdf', status: 'VERIFIED', uploadDate: daysAgo(randomInt(90, 365)) },
        { id: `acc_${i}`, type: 'CERTIFICATE', name: 'NABL Accreditation.pdf', status: 'VERIFIED', uploadDate: daysAgo(randomInt(90, 365)) },
      ],
      donationHistory: [],
      accountStatus: 'APPROVED',
      licenseNumber: `SLAB-KA-${String(randomInt(1000, 9999))}-${String(randomInt(10, 99))}`,
      stock: {
        'A+': randomInt(15, 80),
        'A-': randomInt(2, 20),
        'B+': randomInt(10, 60),
        'B-': randomInt(0, 10),
        'AB+': randomInt(3, 25),
        'AB-': randomInt(0, 8),
        'O+': randomInt(20, 100),
        'O-': randomInt(5, 25),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Also in blood_banks collection (for map display)
    bankBatch.set(doc(db, 'blood_banks', bankId), {
      name: b.name,
      location: { lat: b.lat, lng: b.lng, address: b.address },
      contact: b.contact,
      stock: {
        'A+': randomInt(15, 80),
        'A-': randomInt(2, 20),
        'B+': randomInt(10, 60),
        'B-': randomInt(0, 10),
        'AB+': randomInt(3, 25),
        'AB-': randomInt(0, 8),
        'O+': randomInt(20, 100),
        'O-': randomInt(5, 25),
      },
    });
  }

  await bankBatch.commit();
  logger.info('✅ 20 blood banks seeded');

  logger.info('🎉 Database seeding complete! 200 donors + 20 blood banks + 1 admin');
};
