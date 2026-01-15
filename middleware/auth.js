const admin = require('firebase-admin');

require('dotenv').config();

//const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);


// Initialize only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization token' });
    }

    const token = authHeader.split('Bearer ')[1];

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;  // Now req.user.uid is set correctly
    console.log('Verified UID:', decodedToken.uid);  // Add for debugging
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);  // Critical log!
    return res.status(401).json({ 
      message: 'Unauthorized', 
      error: error.message 
    });
  }
};