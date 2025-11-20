const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

/**
 * GET /api/clubs/my-membership
 *
 * Expected headers:
 *  - x-user-id: the uid of the currently authenticated user.
 *
 * Returns the membership document for the provided user. If Firestore is not
 * configured, a helpful 503 response is returned so front-end callers know to
 * provision credentials.
 */
router.get('/my-membership', async (req, res) => {
  const userId = req.header('x-user-id');

  if (!userId) {
    return res.status(400).json({
      error: 'Missing required header: x-user-id',
    });
  }

  const firestore = admin.firestore?.();
  if (!firestore) {
    return res.status(503).json({
      error: 'Firebase Admin is not configured. Provide FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH.',
    });
  }

  try {
    const membershipDoc = await firestore
      .collection('memberships')
      .doc(userId)
      .get();

    if (!membershipDoc.exists) {
      return res.status(404).json({ error: 'No membership found for user' });
    }

    return res.json({
      id: membershipDoc.id,
      ...membershipDoc.data(),
    });
  } catch (error) {
    console.error('Failed to read membership', error);
    return res.status(500).json({
      error: 'Failed to read membership',
      details: error.message,
    });
  }
});

module.exports = router;
