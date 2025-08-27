// Import Firebase modules
import firebase from "firebase/app"
import "firebase/firestore"
import "firebase/auth"

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "revizze-car.firebaseapp.com",
  projectId: "revizze-car",
  storageBucket: "revizze-car.appspot.com",
  messagingSenderId: "xxxxxxxxxxxx",
  appId: "1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxx",
}

// Inicializar Firebase
firebase.initializeApp(firebaseConfig)

// Referências para uso global
const db = firebase.firestore()
const auth = firebase.auth()
