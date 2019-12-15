var express = require('express');
var router = express.Router();

var env = require('dotenv').config();
const Client = require('pg').Client;
const client = new Client({
  connectionString: process.env.DATABASE_URL
});
client.connect(); //connect to database

var passport = require('passport');
var bcrypt = require('bcryptjs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('login', {error: req.flash('error')});

});

router.post('/',
  // depends on the fiels "isAdmin", redirect to the different path: admin or notAdmin
  passport.authenticate('local', { failureRedirect: '/route', failureFlash:true }),
  function(req, res, next) {
    if (req.user.isadmin == 'admin'){
      res.redirect('/route/admin');
    }
    else {
      res.redirect('/route/notAdmin');
    }
});

router.get('/logout', function(req, res){
    req.logout(); //passport provide it
    res.redirect('/route'); // Successful. redirect to localhost:3000/exam
});

router.get('/changePassword', function(req, res){
    res.render('changePassword',{user: req.user});
});

function encryptPWD(password){
    var salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

router.post('/changePassword', function(req, res,next){
  var msg="";
  client.query('SELECT * FROM users WHERE username=$1',[req.user.username], function(err,result){
    if (err) {
      console.log("exam.js: sql error ");
      next(err); // throw error to error.hbs.
    }
    else{
        bcrypt.compare(req.body.current,req.user.password,function(err,result){
        if(result){
        if(req.body.new1 == req.body.new2){
          client.query("UPDATE users SET password=($2) where username=($1)",[req.user.username,(encryptPWD(req.body.new1))], function(err2,result){          
          });
          msg="Password successfully changed!"; 
        }
        else{
          msg="Passwords do not match.";
        }
      }
      else{
        msg ="Current password is not correct.";
      }
      res.render('changePassword',{user: req.user, msg: msg});
    });
    }
  });
});

function loggedIn(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/route');
  }
}

router.get('/notAdmin',loggedIn,function(req, res, next){
  client.query('SELECT * FROM assignment WHERE username=$1',[req.user.username], function(err,result){
    if (err) {
      console.log("exam.js: sql error ");
      next(err); // throw error to error.hbs.
    }
    else if (result.rows.length > 0) {
      console.log("Here I am");
      res.render('notAdmin', {rows: result.rows, user: req.user} );
    }
    else{
      console.log("This student does not have any assignment");
      //res.render('notAdmin', {rows: result.rows, user: req.user} );

    }
  });
});


router.get('/admin',loggedIn,function(req, res){
      res.render('admin', { user: req.user }); //
});

router.get('/addTicket',function(req, res, next) {
  res.render('addTicket', {user: req.user, error: req.flash('error')});
});

router.post('/addTicket',function(req, res, next) {
  client.query('SELECT * FROM users WHERE username = $1', [req.body.username], function(err, result) {
    if (err) {
      console.log("unable to query SELECT");
      next(err);
    }
    if (result.rows.length > 0) {
        console.log("user exist");
        console.log(result.rows);
        /////////update//////////
        client.query('INSERT INTO ticket (username, description, due) VALUES($1, $2, $3)', [req.body.username, req.body.description,req.body.due], function(err, result) {
          if (err) {
            console.log("unable to query INSERT");
            next(err);
          }
          console.log("Assignment creation is successful");
          res.render('addTicket', {user: req.user , success: "true" });
        });
        ////////////////////////
    }
    else{
      console.log("error checking is needed")
      res.render('addTicket', {user: req.user ,error: "Username doesnt exist"});

    }
  });
});

router.get('/signup',function(req, res) {
    res.render('signup', { user: req.user }); // signup.hbs
});


router.post('/signup', function(req, res, next) {
  console.log(req.body);
  console.log("Showing signup page")
  client.query('SELECT * FROM users WHERE username = $1', [req.body.username], function(err, result) {
    console.log("queried database for user")
    if (err) {
      console.log("unable to query SELECT");
      next(err);
    }
    if (result.rows.length > 0) {
      res.render('signup', { user: req.user,exist:"true" });
    }
    else{
      client.query('INSERT INTO users (username, password, isAdmin) VALUES($1, $2, $3)', [req.body.username,encryptPWD(req.body.password), 'student'], function(err, result) {
        if (err) {
          console.log("unable to query INSERT");
          next(err);
        }
        console.log("User successfully added");
        res.render('signup', {user: req.user , success: "true" });
      });
    }
  });
});

module.exports = router;
