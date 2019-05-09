var express = require('express');
var router = express.Router();
var sha256 = require("sha256");
// var authHelper = require('../helpers/auth');

var bodyParser = require('body-parser');
var sanitizer = require('sanitizer');

var fs = require('fs');
const { 
  spawnSync, 
  execSync, 
  execFileSync,
} = require('child_process');

let data, parms;

var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
let _db;
MongoClient.connect('mongodb://localhost', { useNewUrlParser: true }, function (err, client) {
  if (err) throw err;
  _db = client.db('dinosaures');
});

router.use(bodyParser.json()); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var userLogin = false;

parms = { title: "Dino's contacts book" , active: {}};

router.use('/', function(req, res, next){
  // console.log(req.session);
  console.log(req.session)
  if('user' in req.session) // User is already logged in
  {
    _db.collection("users").find({email: req.session.user}).toArray(function(err, result){
      var data = result[0];
      delete data.pwd;
      parms.data = data;
      if('contacts' in data)
        parms.contacts = data.contacts;
      res.render("dino", parms);
    })
  }
  else
  {
    res.redirect("/user/login")
  }
});

function startSocketIO(socket)
{
  // socket.emit("receiveUsersList")
  _db.collection("users").find({email: {$ne: socket.handshake.session.user}}).toArray(function(err, result){
    _db.collection("users").find({email: socket.handshake.session.user}).toArray(function(err, result1){
      var re = [];
      var me = result1[0];
      console.log(result, result1, re);
      // var my_contacts = me.contacts;
      for(e in result){
        /*if(me.contacts != undefined)
          if(!result[e].email in me.contacts)
            re.push(result[e].email);
        else
          re.push(result[e].email);*/
        re.push(result[e].email);
      }
      console.log(re);
      socket.emit("receiveUsersList", re);
    });
  })

  socket.on("addContact", function(msg){
    _db.collection("users").find({email: msg}).toArray(function(err, result){
      if(result.length == 0)
        return socket.emit("response", "email_does_not_exist");
      _db.collection("users").find({email: socket.handshake.session.user}).toArray(function(err, result1){
        var me = result1[0];
        if('contacts' in me && me.contacts[msg] != undefined)
          return socket.emit("response", "already_contact");
        _db.collection("users").updateOne({email: socket.handshake.session.user}, {$push: {contacts: msg}}).then(() => {
          socket.emit("response", "ok");
        })
      });
    });
  })

  socket.on("data_change", function(msg){
    if(!(
      typeof msg == "object"
      && 'email' in msg
      && 'age' in msg
      && 'family' in msg
      && 'race' in msg
      && 'food' in msg
    ))
      return socket.emit("response", "invalid");

    _db.collection("users").updateOne({email: msg.email}, {$set: msg}).then(() => {
      socket.emit("response", "ok");
    })
  })
}

module.exports = {
  router: router,
  startSocketIO: startSocketIO
}