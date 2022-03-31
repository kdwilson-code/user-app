import crypto from 'crypto';
import express from 'express';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import mongoUtil from '../utils/mongo.js';
import utils from '../utils/general.js';

// Setup the HTTP methods for the user route
const router = express.Router();

// Default Page size for pagination
const defaultPageSize = 10;

router.post('/user', async function (req, res, next) {
   const email = _.get(req, 'body.email');
   const name = _.get(req, 'body.name');
   const password = _.get(req, 'body.password');
   let userRecord = {};

   try {
      const collection = await mongoUtil.getCollection('User');

      // Validate required body fields
      if (!email || !name || !password) {
         throw (utils.createError(400, 'Bad Request', 'Missing Required Fields'));
      } else {
         // Verify user (via email field) doesn't not currently exist in the system.
         if (await collection.findOne({'email': email})) {
            throw (utils.createError(400, 'Bad Request', 'User is already configured in the system'));
         }
      
         // Lower case email for standardization.  However don't lower name.
         userRecord.email = _.toLower(email);
         userRecord.name = name;

         // Hash the password so not in cleartext. This is only a partial security
         // solution as the best would be to salt the hash.
         userRecord.password = crypto.createHash('md5').update(password).digest('hex');

         // Record the creation time
         userRecord.created = new Date();

         // Last Updated is not part of the requirements but it is always good to know
         // the last time the record was updated.
         userRecord.lastUpdated = userRecord.created;

         // Give each record a unique identifier
         userRecord._id = uuidv4();
      }

      const result = await collection.insertOne(userRecord);

      // Check for success
      if (_.get(result, 'insertedCount') === 1) {
         res.send({ _id: _.get(result, 'insertedId') });
      } else {
         throw (utils.createError(500, 'Internal Server Error', 'Unable to create user record'));
      }
   }
   catch (err) {
      next(err);
   }
});

router.get('/user', async function (req, res, next) {
   try {
      // Scan for known URL parameters.  These are optional for this query.
      const email = _.get(req, 'query.email');
      const name = _.get(req, 'query.name');
      const page = parseInt(_.get(req, 'query.page')) || 1;
      const limit = parseInt(_.get(req, 'query.limit')) || defaultPageSize;

      // Build Mongo Query String. If this was a full application we would consider
      // doing a bit of elastic search for the name and email so we wouldn't need 
      // an exact match. This is dependent on customer requirements of course.
      let queryString = {};
      if (email) {
         queryString.email = _.toLower(email);
      }
      if (name) {
         queryString.name = new RegExp(`^${name}$`,'i');
      }

      const collection = await mongoUtil.getCollection('User');
      const result = await collection.find(queryString);
      const userRecords = await result.skip(page > 0 ? ((page - 1) * limit) : 0)
                                .limit(limit)
                                .toArray();

      // Omit the password field for each record returned
      const filteredRecords = _.map(userRecords, function (userRecord) { return _.omit(userRecord, 'password'); });

      res.send({
         'count': filteredRecords.length,
         'total': await result.count(),
         'users': _.map(userRecords, function (userRecord) { return _.omit(userRecord, 'password')})
      });
   } catch (error) {
      next(error);
   }
});

router.get('/user/:_id', async function (req, res, next) {
   // Fetch the id from the path parameter
   const id = _.get(req, 'params._id');

   try {
      // Attempt to find the record in the database
      const collection = await mongoUtil.getCollection('User');
      const userRecord = await collection.findOne({ _id: id });

      if (userRecord) {
         // Although the DB record might contain more, only include certain fields.
         res.send(_.pick(userRecord, ['_id', 'email', 'name', 'lastLogin', 'created', 'lastUpdated']));
      } else {
         throw (utils.createError(404, 'Not Found', `User Record ${id} not found`));
      }
   } catch (error) {
      next(error);
   }
});

router.put('/user/:_id', async function (req, res, next) {
   // Fetch the id from the path parameter
   const id = _.get(req, 'params._id');

   try {
      // Attempt to find the record in the database
      const collection = await mongoUtil.getCollection("User");
      const userRecord = await collection.findOne({ _id: id });

      if (userRecord) {
         // Pull potential existing fields
         const name = _.get(req, 'body.name');
         const email = _.get(req, 'body.email');
         const oldPassword = _.get(req, 'body.oldPassword');
         const newPassword = _.get(req, 'body.newPassword');

         // Multiple user records with same email is not permitted.
         if (email !== userRecord.email && await collection.findOne({'email': email})) {
            throw (utils.createError(400, 'Bad Request', 'User is already configured in the system'));
         }         

         userRecord.name = _.get(req, 'body.name') || userRecord.name;
         userRecord.email = _.get(req, 'body.email') || userRecord.email;

         // Check to see if the user is attempting to update their password
         // If both fields sent with values, verify password change
         if (oldPassword && newPassword) {
            if (userRecord.password === crypto.createHash('md5').update(oldPassword).digest('hex')) {

               // Hash the password so its not in cleartext. This is only a partial security
               // solution as the best would be to salt the hash.
               userRecord.password = crypto.createHash('md5').update(newPassword).digest('hex');
            } else {
               throw (utils.createError(400, 'Bad Request', 'Attempted Password Change Fail'));
            }
         }
         
         // Record the time of the update.  Note don't update lastLogin in this scenario
         userRecord.lastUpdated = new Date();

         // Update DB Record
         await collection.updateOne({ _id: userRecord._id }, { $set: userRecord }, { upsert: false })
      } else {
         throw (utils.createError(404, 'Not Found', `User Record ${id} not found`));
      }

      res.send();
   } catch (error) {
      next(error);
   }
});

router.delete('/user/:_id', async function (req, res, next) {
   // Fetch the id from the path parameter
   const id = _.get(req, 'params._id');

   try {
      // Attempt to find the record in the database
      const collection = await mongoUtil.getCollection('User');
      const userRecord = await collection.findOne({ _id: id });

      if (!userRecord) {
         throw (utils.createError(404, 'Not Found', `User Record ${id} not found`));
      }

      // Delete the record in the database
      const result = await collection.deleteOne({ _id: id });

      // Check for success
      if (_.get(result, 'deletedCount') === 1) {
         res.send();
      } else {
         throw (utils.createError(500, 'Internal Server Error', 'Unable to delete document'));
      }
   } catch (error) {
      next(error)
   }
});

export default router;
