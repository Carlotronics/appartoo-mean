var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var Session    = require('express-session');

require('dotenv').config();
var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');

var app = express();

var sessionSecret = "FMR-BookingSystem";
session = Session({
  secret:sessionSecret,
  resave:true,
  saveUninitialized:true
});

/* MongoDB config */
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
let _db;
MongoClient.connect('mongodb://localhost', { useNewUrlParser: true }, function (err, client) {
  if (err) throw err;
  _db = client.db('dinosaures');
});
/* *** */

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', function(req, res, next){
  if(req.session == undefined || req.session == null){
    req.session = {}
  }
  next();
});

app.get('/', indexRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = { app: app, session: session };