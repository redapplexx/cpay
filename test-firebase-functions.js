// Firebase Functions Test Script
// Run this to test all your Firebase Functions

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Test functions
async function testConnection() {
  console.log('🔍 Testing Firebase connection...');
  try {
    const testFn = httpsCallable(functions, 'testConnection');
    const result = await testFn({});
    console.log('✅ Connection test successful:', result.data);
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function testTransaction() {
  console.log('💰 Testing transaction processing...');
  try {
    const testFn = httpsCallable(functions, 'testTransaction');
    const result = await testFn({
      userId: 'test-user-' + Date.now(),
      amount: 500
    });
    console.log('✅ Transaction test successful:', result.data);
    return true;
  } catch (error) {
    console.error('❌ Transaction test failed:', error.message);
    return false;
  }
}

async function testCreateWallet() {
  console.log('🏦 Testing wallet creation...');
  try {
    const testFn = httpsCallable(functions, 'createWallet');
    const result = await testFn({
      userId: 'test-user-' + Date.now(),
      currency: 'PHP',
      initialBalance: 1000
    });
    console.log('✅ Wallet creation successful:', result.data);
    return result.data.walletId;
  } catch (error) {
    console.error('❌ Wallet creation failed:', error.message);
    return null;
  }
}

async function testGetWalletBalance(walletId) {
  console.log('💳 Testing wallet balance retrieval...');
  try {
    const testFn = httpsCallable(functions, 'getWalletBalance');
    const result = await testFn({ walletId });
    console.log('✅ Balance retrieval successful:', result.data);
    return true;
  } catch (error) {
    console.error('❌ Balance retrieval failed:', error.message);
    return false;
  }
}

async function testProcessTransaction(fromWalletId, toWalletId) {
  console.log('💸 Testing transaction processing...');
  try {
    const testFn = httpsCallable(functions, 'processTransaction');
    const result = await testFn({
      fromWalletId,
      toWalletId,
      amount: 100,
      currency: 'PHP',
      type: 'transfer',
      description: 'Test transaction'
    });
    console.log('✅ Transaction processing successful:', result.data);
    return true;
  } catch (error) {
    console.error('❌ Transaction processing failed:', error.message);
    return false;
  }
}

async function testMassPayout() {
  console.log('📦 Testing mass payout...');
  try {
    const testFn = httpsCallable(functions, 'processMassPayout');
    const result = await testFn({
      payouts: [
        {
          toWalletId: 'test-wallet-1',
          amount: 500,
          currency: 'PHP',
          description: 'Test payout'
        }
      ]
    });
    console.log('✅ Mass payout successful:', result.data);
    return true;
  } catch (error) {
    console.error('❌ Mass payout failed:', error.message);
    return false;
  }
}

async function testUpdateFXRate() {
  console.log('💱 Testing FX rate update...');
  try {
    const testFn = httpsCallable(functions, 'updateFXRate');
    const result = await testFn({
      fromCurrency: 'USD',
      toCurrency: 'PHP',
      rate: 55.5
    });
    console.log('✅ FX rate update successful:', result.data);
    return true;
  } catch (error) {
    console.error('❌ FX rate update failed:', error.message);
    return false;
  }
}

async function testGetFXRate() {
  console.log('📊 Testing FX rate retrieval...');
  try {
    const testFn = httpsCallable(functions, 'getFXRate');
    const result = await testFn({
      fromCurrency: 'USD',
      toCurrency: 'PHP'
    });
    console.log('✅ FX rate retrieval successful:', result.data);
    return true;
  } catch (error) {
    console.error('❌ FX rate retrieval failed:', error.message);
    return false;
  }
}

async function testProcessKYC() {
  console.log('📋 Testing KYC processing...');
  try {
    const testFn = httpsCallable(functions, 'processKYC');
    const result = await testFn({
      userId: 'test-user-' + Date.now()
    });
    console.log('✅ KYC processing successful:', result.data);
    return true;
  } catch (error) {
    console.error('❌ KYC processing failed:', error.message);
    return false;
  }
}

async function testCreateUser() {
  console.log('👤 Testing user creation...');
  try {
    const testFn = httpsCallable(functions, 'createUser');
    const result = await testFn({
      email: 'test@example.com',
      displayName: 'Test User',
      phoneNumber: '+1234567890'
    });
    console.log('✅ User creation successful:', result.data);
    return true;
  } catch (error) {
    console.error('❌ User creation failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Firebase Functions Test Suite...\n');
  
  const results = {
    connection: await testConnection(),
    transaction: await testTransaction(),
    createWallet: await testCreateWallet(),
    massPayout: await testMassPayout(),
    updateFXRate: await testUpdateFXRate(),
    getFXRate: await testGetFXRate(),
    processKYC: await testProcessKYC(),
    createUser: await testCreateUser(),
  };

  // Test wallet operations if wallet was created
  if (results.createWallet) {
    results.getBalance = await testGetWalletBalance(results.createWallet);
    
    // Create a second wallet for transaction testing
    const secondWallet = await testCreateWallet();
    if (secondWallet) {
      results.processTransaction = await testProcessTransaction(results.createWallet, secondWallet);
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${test}: ${status}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your Firebase Functions are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the Firebase Console for more details.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testConnection,
  testTransaction,
  testCreateWallet,
  testGetWalletBalance,
  testProcessTransaction,
  testMassPayout,
  testUpdateFXRate,
  testGetFXRate,
  testProcessKYC,
  testCreateUser,
  runAllTests
}; 