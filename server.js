var express = require('express');
var admin = require('firebase-admin');
var serviceCreds = require('./service-creds.json');

var app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceCreds),
  databaseURL: 'https://clik-e3afb.firebaseio.com'
});

var dbRef = admin.database().ref();
var usersRef = admin.database().ref('users');
var usersByPrefRef = admin.database().ref('users-by-pref');

usersRef.on('child_added', function(snap) {
  var newUserKey = snap.key;
  var newUser = snap.val();

  var simpleInfo = {
    photoUrl: newUser.imageUrl,
    name: newUser.firstName + ' ' + newUser.lastName,
    age: newUser.age,
    career: newUser.career,
    school: newUser.school,
    startAge: newUser.startAge,
    endAge: newUser.endAge
  };

  var newData = {};
  if(newUser.lookingFor === 'both') {
    newData[`users-by-pref/${newUser.gender}/female/${newUserKey}`] = simpleInfo;
    newData[`users-by-pref/${newUser.gender}/male/${newUserKey}`] = simpleInfo;
  } else {
    newData[`users-by-pref/${newUser.gender}/${newUser.lookingFor}/${newUserKey}`] = simpleInfo;
  }

  dbRef.update(newData, function(err) {
    if(err) console.log(err);
  }).then(function(stuff) {
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
        if(userKey !== newUserKey && newUser.age >= user.startAge && newUser.age <= user.endAge) {
          pathsToUpdate[`queues/${userKey}/${newUserKey}`] = simpleInfo;
          pathsToUpdate[`queues/${newUserKey}/${userKey}`] = {
            photoUrl: user.photoUrl || '',
            name: user.name,
            age: user.age,
            career: user.career,
            school: user.school,
            startAge: user.startAge,
            endAge: user.endAge
          };
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
  });

});

usersRef.on('child_changed', function(snap) {
});

app.listen(3000, function () {
  console.log('Running Clik on port 3000!')
});
