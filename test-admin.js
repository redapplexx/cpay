const admin = require("firebase-admin");

// You'll need to place your service account JSON file in the project root
// and update this path to match your file name
const serviceAccount = require("./redapplex-ai-platform-firebase-adminsdk-fbsvc-3f41372c29.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "redapplex-ai-platform"
});

const db = admin.firestore();

async function testAdminSDK() {
  try {
    console.log("🔍 Testing Firebase Admin SDK connection...");
    
    // Test 1: Write to Firestore
    console.log("📝 Writing test document...");
    await db.collection("admin-test").doc("verify").set({
      verified: true,
      timestamp: new Date(),
      backend: "redapplex-terminal",
      region: "asia-east1"
    });
    
    // Test 2: Read from Firestore
    console.log("📖 Reading test document...");
    const doc = await db.collection("admin-test").doc("verify").get();
    
    if (doc.exists) {
      console.log("✅ Document data:", doc.data());
      console.log("🎉 Firebase Admin SDK is working correctly!");
    } else {
      console.log("❌ Document not found");
    }
    
    // Test 3: List collections (optional)
    console.log("📋 Listing collections...");
    const collections = await db.listCollections();
    console.log("📁 Available collections:", collections.map(col => col.id));
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error testing Firebase Admin SDK:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

testAdminSDK(); 