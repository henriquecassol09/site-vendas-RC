// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbaA2IA0y_sPx6G6jCNmg-tE4S4IYmqXg",
  authDomain: "rc-vendas-e-instalacoes.firebaseapp.com",
  projectId: "rc-vendas-e-instalacoes",
  storageBucket: "rc-vendas-e-instalacoes.firebasestorage.app",
  messagingSenderId: "324769531700",
  appId: "1:324769531700:web:88cb4ada80c6ec82a24761",
  measurementId: "G-TV02JKJKFZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);