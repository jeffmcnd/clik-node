var express = require('express');
var firebase = require('firebase');

var app = express();

var config = {
};

firebase.initializeApp(config);

var dbRef = firebase.database().ref();
var usersRef = firebase.database().ref('users');
var usersByPrefRef = firebase.database().ref('users-by-pref');

usersRef.on('child_added', function(snap) {
  var newUserKey = snap.key;
  var newUser = snap.val();

  var simpleInfo = {
    photoUrl: '',
    name: newUser.firstName + ' ' + newUser.lastName,
    age: newUser.age,
    career: newUser.career,
    school: newUser.school
  };

  var newData = {};
  if(newUser.lookingFor === 'both') {
    newData[`users-by-pref/${newUser.gender}/female/${newUserKey}}`] = simpleInfo;
    newData[`users-by-pref/${newUser.gender}/male/${newUserKey}}`] = simpleInfo;
  } else {
    newData[`users-by-pref/${newUser.gender}/${newUser.lookingFor}/${newUserKey}}`] = simpleInfo;
  }

  dbRef.update(newData, function(err) {
    if(err) console.log(err);
  });

  var potentialsRef = usersByPrefRef.child(newUser.lookingFor).child(newUser.gender)
    .orderByChild('age')
    .startAt(newUser.startAge)
    .endAt(newUser.endAge);

  potentialsRef.once('value', function(snap) {
    if(!snap.hasChildren()) return;

    var pathsToUpdate = {};
    snap.forEach(function(childSnap) {
      var user = childSnap.val();
      var userKey = childSnap.key;
      if(userKey !== newUserKey && user.age >= newUser.startAge && user.age <= newUser.endAge) {
        pathsToUpdate[`queues/${userKey}/${newUserKey}`] = simpleInfo;
      }
    });
    if(Object.keys(pathsToUpdate).length > 0) {
      dbRef.update(pathsToUpdate, function(err) {
        if(err) console.log(err);
      });
    }
  }, function(err) {
    console.log(err);
  });

  console.log(newUser.firstName + ' ' + newUser.lastName + ' added!');
});

usersRef.on('child_changed', function(snap) {
});

app.listen(3000, function () {
  console.log('Running Clik on port 3000!')
});
