import { getDocs, query, collection, where, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { UserRole } from './types';

async function fixAdmin() {
  const email = 'prajwal08042006@gmail.com';
  console.log(`🔍 Looking for ${email} in Firestore...`);
  
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    console.log('❌ No user found in Firestore with that email.');
  } else {
    // There could be multiple if they created it multiple times, find the one that is NOT the seed dummy if possible
    let userDoc = snap.docs.find(d => d.id !== 'admin_prajwal08042006');
    if (!userDoc) userDoc = snap.docs[0]; // Fallback to first
    
    const uid = userDoc.id;
    console.log(`✅ Found actual UID: ${uid}`);
    
    // Update to be ADMIN and APPROVED
    console.log('👑 Promoting to ADMIN...');
    await setDoc(doc(db, 'users', uid), {
      ...userDoc.data(),
      role: UserRole.ADMIN,
      accountStatus: 'APPROVED'
    }, { merge: true });
    
    // Delete the dummy inserted by seed if it exists and is different
    if (uid !== 'admin_prajwal08042006') {
      console.log('🗑️ Deleting dummy seed admin doc...');
      await deleteDoc(doc(db, 'users', 'admin_prajwal08042006'));
    }
    
    console.log(`📧 Sending Password Reset Email to ${email}...`);
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent! User can now reset it directly.');
    } catch (e: any) {
      console.error('❌ Failed to send reset email:', e.message);
    }
  }
  process.exit();
}

fixAdmin();
