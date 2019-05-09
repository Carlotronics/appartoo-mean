var express = require('express');
var router = express.Router();
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

module.exports = {
  router: router,
  startSocketIO: startSocketIO
}