import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCnO-Q5_R7-vyqCah6asqFcFsmv5I7fh2Y',
  authDomain: 'aignosis-dev1.firebaseapp.com',
  projectId: 'aignosis-dev1',
  storageBucket: 'aignosis-dev1.firebasestorage.app',
  messagingSenderId: '315945818939',
  appId: '1:315945818939:web:00b40ddca764145d3d351e',
  measurementId: 'G-WJDTCK60MK',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
