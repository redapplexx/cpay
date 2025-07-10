const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq",
  authDomain: "cpay-f149i.firebaseapp.com",
  projectId: "cpay-f149i",
  storageBucket: "cpay-f149i.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Call the createWinnyAdmin function
async function createWinnyAdmin() {
  try {
    console.log('Creating Winny admin user...');
    
    const createWinnyAdminFunction = httpsCallable(functions, 'createWinnyAdmin');
    
    const result = await createWinnyAdminFunction({
      secretKey: 'CPAY_ADMIN_SETUP_2024'
    });
    
    console.log('✅ Success:', result.data);
    
    // Verify the admin user
    console.log('\nVerifying admin user...');
    const verifyAdminFunction = httpsCallable(functions, 'verifyAdminUser');
    
    const verifyResult = await verifyAdminFunction({
      uid: 'YmVCpYj5emNlGvxBWD1Q'
    });
    
    console.log('✅ Verification result:', verifyResult.data);
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
  }
}

// Run the function
createWinnyAdmin(); 