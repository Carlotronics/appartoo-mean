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
      res.render("dino", parms);
    })
  }
  else
  {
    // res.send("Not logged in");
    // res.end();
    // next()
    res.redirect("/user/login")
  }
});

function startSocketIO(socket)
{
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