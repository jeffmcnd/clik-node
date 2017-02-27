var express = require('express');
var firebase = require('firebase');

var app = express();

var config = {
};

firebase.initializeApp(config);

var dbRef = firebase.database().ref();
var usersRef = firebase.database().ref('users');

usersRef.on('child_added', function(snap) {
  var key = snap.key;
  var user = snap.val();

  var simpleInfo = {
    photoUrl: '',
    name: user.firstName + ' ' + user.lastName,
    age: user.age,
    career: user.career,
    school: user.school
  };

  var prefPath = user.gender + '/' + user.lookingFor + '/' + key;

  var newData = {};
  newData[`users-by-pref/${user.gender}/${user.lookingFor}/${key}}`] = simpleInfo;

  dbRef.update(newData, function(err) {
    if(err) console.log(err);
  });

  console.log(user.firstName + ' ' + user.lastName + ' added!');
});

usersRef.on('child_changed', function(snap) {
});

app.listen(3000, function () {
  console.log('Running Clik on port 3000!')
});
