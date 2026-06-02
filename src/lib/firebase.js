import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAB9sOKfFRIhx2E0YTK08PN-umDqGebbu0",
  authDomain: "jb-group-6af90.firebaseapp.com",
  projectId: "jb-group-6af90",
  storageBucket: "jb-group-6af90.firebasestorage.app",
  messagingSenderId: "753677921479",
  appId: "1:753677921479:web:dce97fbc885687d8a4a2e2",
  measurementId: "G-MJ2WQQMPT5"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
