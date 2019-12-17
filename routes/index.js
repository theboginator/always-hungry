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
  res.render('login');

});

router.post('/login',
  // depends on the fiels "isAdmin", redirect to the different path: admin or notAdmin
  passport.authenticate('local', { failureRedirect: '/', failureFlash:true }),
  function(req, res, next) {
    if (req.user.isadmin == 'admin'){
      res.redirect('/admin');
    }
    else {
      res.redirect('/profile');
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
    average = average + result.rows[ctr][type];
  }
  return (average/result.rows.height);
}

router.get('/notAdmin',loggedIn,function(req, res, next){
  if(req.user.isadmin !="admin"){
  client.query('SELECT * FROM ticket WHERE username=$1 order by status asc',[req.user.username], function(err,result){
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
      res.render('notAdmin', {rows: result.rows, user: req.user} );

    }
  });
}
else{
res.redirect('/admin');
}
});


router.get('/admin',loggedIn,function(req, res){
  if(req.user.isadmin=='admin'){
      res.render('admin', { user: req.user }); 
  }
  else{
    res.redirect('/notAdmin');
  }
});



router.get('/signup',function(req, res) {
  res.render('signup', { user: req.user }); // signup.hbs
  
});


router.post('/signup', function(req, res, next) {
  console.log(req.body);
  client.query('SELECT * FROM users WHERE username = $1', [req.body.username], function(err, result) {
    if (err) {
      console.log("unable to query SELECT");
      next(err);
    }
    if (result.rows.length > 0) {
      res.render('signup', { user: req.user,exist:"true" });
    }
    else{
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

router.get('/adminDashboard', function(req, res, next) {
  console.log(req.user.isadmin);
  if(req.user.isadmin=="admin"){
    client.query('SELECT * FROM ticket order by status asc', function(err, result){
        if(err){ next(err);}
        res.render('adminDashboard', result)
    });
  }
  else{
    res.redirect('/notAdmin');
  }
});

router.post('/adminDashboard',function(req, res) {
  client.query('Update ticket set status = $1 where id = $2', [req.body.status, req.body.key], function(err, result) {
    if (err) {
      console.log("unable to query Update");
      next(err);
    }
  });
  res.redirect('/adminDashboard'); 
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

  
  
  client.query("SELECT username, published, comment FROM reviews WHERE hall = 'crimson' ORDER BY published DESC", function(err, result) {
    if (err) {
      console.log("unable to query SELECT for crimson dining");
      next(err);
    }
    
    console.log("Queried for crimson data, got: ");
    console.log(result.rows);
    console.log(result.rowCount);

    /*
    service = averageReview(result, 'service');
    speed = averageReview(result, 'speed');
    food = averageReview(result, 'food');
    busy = averageReview(result, 'busy');
    console.log("service average:");
    console.log(service);
    */
    
    response.render('crimson', result); // Load the crimson review page with the reviews table


  
    if(result.rows.length > 0){
      //load in review data for stuff
    }
    else{
      //There are no reviews; set data values to 0
    }
  });
  
/*
  console.log("Queried for crimson data, got: ");
  console.log(result);
  service = averageReview(result, 0);
  speed = averageReview(result, 1);
  food = averageReview(result, 2);
  busy = averageReview(result, 3);
  console.log(service);
  res.render('crimson', { user: req.user }); // Load the crimson review page with the reviews table

*/
  
});

router.get('/eastCampusCrap',function(req, res) {
  res.render('eastCampusCrap', { user: req.user }); // eastCampusCrap.hbs
  
});

router.get('/bearsDen',function(req, res) {
  res.render('bearsDen', { user: req.user }); // bearsDen.hbs
  
});

router.get('/tilly',function(req, res) {
  res.render('tilly', { user: req.user }); // tilly.hbs
  
});

module.exports = router;
