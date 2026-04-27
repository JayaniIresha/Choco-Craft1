import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBd5c5sNlCRczjihZGPz71hx_ckZYmHPmU",
  authDomain: "spare-parts-6c6af.firebaseapp.com",
  databaseURL:
    "https://spare-parts-6c6af-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "spare-parts-6c6af",
  storageBucket: "spare-parts-6c6af.firebasestorage.app",
  messagingSenderId: "245028387294",
  appId: "1:245028387294:web:a5c731c0c23facebd4054f",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
