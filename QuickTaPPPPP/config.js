// Import Firebase
import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDemoKey123456789",
  authDomain: "coffee-shop-demo.firebaseapp.com",
  projectId: "coffee-shop-demo",
  storageBucket: "coffee-shop-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Firebase services
const auth = firebase.auth()
const db = firebase.firestore()
