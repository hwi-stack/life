import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const LOTTERY_DOC_REF = doc(db, 'lottery', 'festival2026');

export async function saveLotteryStateToFirestore(state: {
  slots: unknown;
  settings: unknown;
  selectedPrizeId: string;
  history: unknown;
}) {
  try {
    await setDoc(
      LOTTERY_DOC_REF,
      {
        ...state,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore sync warning (falling back to localStorage):', error);
  }
}

export function subscribeLotteryState(onUpdate: (data: any) => void) {
  try {
    return onSnapshot(
      LOTTERY_DOC_REF,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data());
        }
      },
      (error) => {
        console.warn('Firestore subscription error:', error);
      }
    );
  } catch (error) {
    console.warn('Could not establish Firestore subscription:', error);
    return () => {};
  }
}
