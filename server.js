var express = require('express');
var firebase = require('firebase');

var app = express();

var config = {
  apiKey: "<API_KEY>",
  authDomain: "<AUTH_DOMAIN>",
  databaseURL: "<DB_URL>",
  storageBucket: "<STORAGE_BUCKET>",
  messagingSenderId: "<MESSAGE_SENDER_ID>"
};

firebase.initializeApp(config);

firebase.database().ref('users').on('child_added', function(snap) {
  console.log(snap.key);
});

app.listen(3000, function () {
  console.log('Running Clik on port 3000!')
});
