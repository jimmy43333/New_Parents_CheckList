import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// These are public client identifiers, not secrets — access control is
// enforced by firestore.rules, not by hiding this config.
const firebaseConfig = {
  projectId: 'npchecklist-tgsung',
  appId: '1:190193389643:web:232dd3d50a84b1ab863dce',
  storageBucket: 'npchecklist-tgsung.firebasestorage.app',
  apiKey: 'AIzaSyDmwKIH7W_7_couGUiCGxinjapeklIU8Vc',
  authDomain: 'npchecklist-tgsung.firebaseapp.com',
  messagingSenderId: '190193389643',
  measurementId: 'G-1Y305K7VGK',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
