var express = require('express');
var admin = require('firebase-admin');
var serviceCreds = require('./service-creds.json');

var app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceCreds),
  databaseURL: 'https://clik-e3afb.firebaseio.com'
});

var encodePath = function(path) {
  return path.replace(/\//g, '%2F');
};

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
  var path = '';
  if(newUser.lookingFor === 'both') {
    path = `users-by-pref/${newUser.gender}/female/${newUserKey}`;
    newData[path] = simpleInfo;
    newData[`users-lookup/${newUserKey}/` + encodePath(path)] = true;

    path = `users-by-pref/${newUser.gender}/male/${newUserKey}`;
    newData[path] = simpleInfo;
    newData[`users-lookup/${newUserKey}/` + encodePath(path)] = true;
  } else {
    path = `users-by-pref/${newUser.gender}/${newUser.lookingFor}/${newUserKey}`;
    newData[path] = simpleInfo;
    newData[`users-lookup/${newUserKey}/` + encodePath(path)] = true;
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
          path = `queues/${userKey}/${newUserKey}`;
          pathsToUpdate[path] = simpleInfo;
          pathsToUpdate[`users-lookup/${newUserKey}/` + encodePath(path)] = true;

          path = `queues/${newUserKey}/${userKey}`;
          pathsToUpdate[path] = {
            photoUrl: user.photoUrl || '',
            name: user.name,
            age: user.age,
            career: user.career,
            school: user.school,
            startAge: user.startAge,
            endAge: user.endAge
          };
          pathsToUpdate[`users-lookup/${userKey}/` + encodePath(path)] = true;
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
