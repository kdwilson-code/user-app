import crypto from 'crypto';
import express from 'express';
import _ from 'lodash';
import mongoUtil from '../utils/mongo.js';
import utils from '../utils/general.js';

// Setup the HTTP method for the login route
const router = express.Router();

router.post('/login', async function (req, res, next) {
   const email = _.get(req, 'body.email');
   const password = _.get(req, 'body.password');

   try {
      // Validate required body fields
      if (!email || !password) {
         throw (utils.createError(401, 'Unauthorized', 'Missing Required Fields'));
      } else {

         const collection = await mongoUtil.getCollection('User');
         const userRecord = await collection.findOne({'email': email});

         // Check if user is in the system
         if (!userRecord) {
            throw (utils.createError(401, 'Unauthorized', ''));
         }

         // Check the password provided against existing password
         if (userRecord.password !== crypto.createHash('md5').update(password).digest('hex')) {
            throw (utils.createError(401, 'Unauthorized', ''));
         }

         // Successful login.  Update lastLogin time.  Note lastUpdated is not part of the requirements
         // but there can be times the user record is updated in a non-login scenario.
         userRecord.lastLogin = userRecord.lastUpdated = new Date();

         // Update DB Record
         await collection.updateOne({ _id: userRecord._id }, { $set: userRecord }, { upsert: false });

         // Send 200 OK
         res.send();
      }
   }
   catch (err) {
      next(err);
   }
});

export default router;