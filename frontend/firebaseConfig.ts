import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAzJ43g2_z2T6YkhOMswTOgu4D_l32AzBY",
    authDomain: "letsgohome-e9509.firebaseapp.com",
    projectId: "letsgohome-e9509",
    storageBucket: "letsgohome-e9509.appspot.com",
    messagingSenderId: "438968066128",
    appId: "1:438968066128:web:7c7a3d76b6a66e4d6df155",
    measurementId: "G-3VLQWVVW4S"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);    

export { app, database };

