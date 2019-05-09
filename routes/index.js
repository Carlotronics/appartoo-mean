var express = require('express');
var router = express.Router();

var userLogin = false;

router.use('/', function(req, res, next){
  if('user' in req.session)
    res.redirect('/dino')
  else{
    res.redirect('/user/login');
  }
});

module.exports = router;