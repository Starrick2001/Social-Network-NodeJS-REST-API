const admin = require("firebase-admin");
const serviceAccount = require('./serviceAccountKey.json');
const dotenv = require("dotenv")

dotenv.config();

// Initialize firebase admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE_BUCKET,
});
// Cloud storage
const bucket = admin.storage().bucket();

module.exports = {
  bucket,
};
