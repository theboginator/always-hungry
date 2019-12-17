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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'How To Eat This' });
});

/* GET users listing. */
router.get('/login', function(req, res, next) {
  res.render('login',  {error: req.flash('error')});

});

router.post('/login',
  // depends on the fiels "isAdmin", redirect to the different path: admin or notAdmin
  passport.authenticate('local', { failureRedirect: '/login', failureFlash:true }),
  function(req, res, next) {
    if (req.user.isadmin == 'admin'){
      res.redirect('/admin');
    }
    else {
      res.redirect('/');
    }
});

router.get('/profile', function(req, res, next) {
  res.render('profile', {user: req.user});

});


router.get('/logout', function(req, res){
    req.logout(); //passport provide it
    res.redirect('/'); // Successful. redirect to localhost:3000/exam
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
    res.redirect('/');
  }
}

function averageReview(result, type){
  console.log("Attempting to average: ");
  console.log(result.rows);
  console.log("Rows: ");
  console.log(result.rows.length);
  console.log("Columns: ");
  console.log(result.rowCount);
  var average = 0;
  for(var ctr=0; ctr<result.rowCount; ctr++){
    average = average + result.rows[ctr];
  }
  return (average/result.rows.height);
}

router.get('/signup',function(req, res) {
  res.render('signup', { user: req.user }); // signup.hbs
  
});


router.post('/signup', function(req, res, next) {
  console.log(req.body);
  console.log("signing a new user up");
  client.query('SELECT * FROM users WHERE username = $1', [req.body.username], function(err, result) {
    if (err) {
      console.log("unable to query SELECT");
      next(err);
    }
    if (result.rows.length > 0) {
      res.render('signup', { user: req.user,exist:"true" });
    }
    else{
      console.log("Attempting insert");
      client.query('INSERT INTO users (username, password, level) VALUES($1, $2, $3)', [req.body.username,encryptPWD(req.body.password), 'student'], function(err, result) {
        if (err) {
          console.log("unable to query INSERT");
          next(err);
        }
        console.log("User successfully added");
        res.redirect('profile');
      });
    }
  });
});

router.get('/review',function(req, res, next) {
  res.render('review', {user: req.user, error: req.flash('error')});
});

//Add ticket to ticket database
router.post('/review',function(req, res, next) {
  client.query('SELECT * FROM users WHERE username = $1', [req.user.username], function(err, result) {
    if (err) {
      next(err);
    }
    if (result.rows.length > 0) {
      console.log("Attempting to insert to database");
        client.query('INSERT INTO reviews (username, published, hall, service, speed, food, busy, comment) VALUES($1, $2, $3, $4, $5, $6, $7, $8)', [req.user.username, '2019-12-17', req.body.hall, req.body.service, req.body.speed, req.body.busy, req.body.busy, req.body.comment], function(err, result) {
          console.log("Passed insert statement");
          if (err) {
            next(err);
            console.log(err);
          }
          console.log("Insertion successful, re-loading page");
          res.render('review', {user: req.user , success: "true" });
        });
    }
    else{
      res.render('signup', {user: req.user ,error: "Username doesnt exist"});
    }
  });
});

/*
router.get('/crimtest', function(req, response, next) {
  client.query("SELECT username, published, comment FROM reviews WHERE hall = 'crimson' ORDER BY published DESC", function(err, result) {
    if (err) {
      console.log("unable to query SELECT for crimson dining");
      next(err);
    }
    response.render('crimtest', result);
  });
});
*/

router.get('/crimson',function(req, response, res) {

  client.query("SELECT username, published, comment, service, speed, food, busy FROM reviews WHERE hall = 'crimson' ORDER BY published DESC", function(err, result) {
    if (err) {
      console.log("unable to query SELECT for crimson dining");
      next(err);
    }
    
    console.log("Queried for crimson data, got: ");
    console.log(result.rows);
    console.log(result.rowCount);
    
    response.render('crimson', result); // Load the crimson review page with the reviews table
  });
  
});

router.get('/eastCampusCrap',function(req, res) {
  client.query("SELECT username, published, comment, service, speed, food, busy FROM reviews WHERE hall = 'eastCampusCrap' ORDER BY published DESC", function(err, result) {
    if (err) {
      console.log("unable to query SELECT for ECC dining");
      next(err);
    }
    
    console.log("Queried for ECC data, got: ");
    console.log(result.rows);
    console.log(result.rowCount);
    
    res.render('eastCampusCrap', result); // Load the ECC review page with the reviews table
  });
  
});

router.get('/bearsDen',function(req, res) {
  client.query("SELECT username, published, comment, service, speed, food, busy FROM reviews WHERE hall = 'bearsDen' ORDER BY published DESC", function(err, result) {
    if (err) {
      console.log("unable to query SELECT for Bear's Den");
      next(err);
    }
    
    console.log("Queried for Bear's Den data, got: ");
    console.log(result.rows);
    console.log(result.rowCount);
    
    res.render('bearsDen', result); // Load the bears den review page with the reviews table
  });
  
});

router.get('/tilly',function(req, res) {
  client.query("SELECT username, published, comment, service, speed, food, busy FROM reviews WHERE hall = 'tilly' ORDER BY published DESC", function(err, result) {
    if (err) {
      console.log("unable to query SELECT for tilly dining");
      next(err);
    }
    
    console.log("Queried for tilly data, got: ");
    console.log(result.rows);
    console.log(result.rowCount);
    
    res.render('tilly', result); // Load the tilly review page with the reviews table
  });
});

module.exports = router;
