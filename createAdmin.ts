import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './lib/firebase';

async function createAdminAuth() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'prajwal08042006@gmail.com', 'Praju@123');
    console.log('✅ Auth user created successfully:', cred.user.uid);
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('ℹ️ User already exists. Testing login...');
      try {
        await signInWithEmailAndPassword(auth, 'prajwal08042006@gmail.com', 'Praju@123');
        console.log('✅ Login successful! Password is correct.');
      } catch (loginErr: any) {
        console.error('❌ Login failed:', loginErr.message);
      }
    } else {
      console.error('❌ Creation failed:', err.message);
    }
  }
  process.exit();
}

createAdminAuth();
