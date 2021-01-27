
# User App
This is the sample code developed for the user-app server side application. user-app has the following
characteristics:
* NodeJS Environment
* Javascript language
* Mongo DB database
* APIs documented via swagger (OAS3)

## Directories / Files
* package.json - Mainfest file for all that's needed to build / run the application
* swagger.yaml - API Documentation
* src/routes/* - Code for the various routes
* src/utils/*  - Utility modules
* README.md - This top level file

## Local Deployment

After setting up the Mongo DB, perform the following:
```
npm install
npm start
```

The app will run at http://localhost:8080

