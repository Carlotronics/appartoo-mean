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
_dbs = {};
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
  if('user' in req.session) // User is already logged in
  {
    res.send("Logged in");
    res.end();
    res.redirect('/dino')
  }
  else
  {
    // res.send("Not logged in");
    // res.end();
    next()
  }
});

router.get('/login', function(req, res, next){
  parms.active = {login: true};
  res.render('login', parms);
})

router.get('/register', function(req, res, next){
  parms.active = {register: true};
  res.render('register', parms);
})

function startSocketIO(socket)
{
  socket.on('login', function(msg){
    if(!(typeof msg == "object" && 'email' in msg && 'pwd' in msg))
      return socket.emit("login_response", "unknown_error");
    encoded_pwd = sha256.x2(msg.pwd);
    _db.collection("users").find({email: msg.email, pwd: encoded_pwd}).toArray(function(err, result){
      if(result.length != 1)
        return socket.emit("login_response", "invalid");
      socket.emit("login_response", "ok")
      socket.handshake.session.user = msg.email;
      socket.handshake.session.save();
      // console.log(socket.handshake.session)
    })
  })

  socket.on('register', function(msg){
    if(!(
      typeof msg == "object"
      && 'email' in msg
      && 'pwd' in msg
      && 'age' in msg
      && 'family' in msg
      && 'race' in msg
      && 'food' in msg
    ))
      return socket.emit("register_response", "unknown_error");
    msg.pwd = sha256.x2(msg.pwd);
    _db.collection("users").find({email: msg.email}).toArray(function(err, result){
      if(result.length >= 1)
        return socket.emit("register_response", "email_taken");
      _db.collection("users").insertOne(msg).then(() => {
        socket.emit("register_response", "ok")
        socket.handshake.session.user = msg.email;
        socket.handshake.session.save();
      })
    })
  })
}

module.exports = {
  router: router,
  startSocketIO: startSocketIO
}