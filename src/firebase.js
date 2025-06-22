// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Reemplaza esto con la configuración de TU proyecto de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBz__LYFtZvCJ4Yt1Atsa8gmz7G4uE0Hw0",
  authDomain: "alpha-style-control.firebaseapp.com",
  projectId: "alpha-style-control",
  storageBucket: "alpha-style-control.firebasestorage.app",
  messagingSenderId: "572691668031",
  appId: "1:572691668031:web:38feb4a6bfbbe77bb52c8a"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener una referencia a la base de datos de Firestore
export const db = getFirestore(app);