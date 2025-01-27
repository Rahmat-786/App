// Import the functions you need from the SDKs you need
import * as firebase from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import 'firebase/auth';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdEXmxSg7dyz9rOzN_GJ8oEorYE0DHr88",
  authDomain: "ai-docs-3a9e4.firebaseapp.com",
  projectId: "ai-docs-3a9e4",
  storageBucket: "ai-docs-3a9e4.firebasestorage.app",
  messagingSenderId: "1021675479488",
  appId: "1:1021675479488:web:b27cc35f2ed7f6d7f6a825"
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);


export const auth = firebaseApp.auth();

export default firebaseApp;
