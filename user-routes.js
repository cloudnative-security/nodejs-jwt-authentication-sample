var express = require('express'),
    _       = require('lodash'),
    config  = require('./config'),
    jwt     = require('jsonwebtoken');

var app = module.exports = express.Router();

// XXX: This should be a database of users :).
var users = [{
  id: 1,
  username: 'gonto',
  password: 'gonto'
}];

var quotes = [{
  quoteId: "9780007195909",
  postcode: "SW1A 2AA",
  dateOfBirth: "06-19-1964"
}]

function createIdToken(user) {
  return jwt.sign(_.omit(user, 'password'), config.secret, { expiresIn: 60*60*5 });
}

function createAccessToken() {
  return jwt.sign({
    iss: config.issuer,
    aud: config.audience,
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    scope: 'full_access',
    sub: "lalaland|gonto",
    jti: genJti(), // unique identifier for the token
    alg: 'HS256'
  }, config.secret);
}

// Generate Unique Identifier for the access token
function genJti() {
  let jti = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 16; i++) {
      jti += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return jti;
}

function getUserScheme(req) {
  
  var username;
  var type;
  var userSearch = {};

  // The POST contains a username and not an email
  if(req.body.username) {
    username = req.body.username;
    type = 'username';
    userSearch = { username: username };
  }
  // The POST contains an email and not an username
  else if(req.body.email) {
    username = req.body.email;
    type = 'email';
    userSearch = { email: username };
  }

  return {
    username: username,
    type: type,
    userSearch: userSearch
  }
}

app.post('/users', function(req, res) {
  
  var userScheme = getUserScheme(req);  

  if (!userScheme.username || !req.body.password) {
    return res.status(400).send("You must send the username and the password");
  }

  if (_.find(users, userScheme.userSearch)) {
   return res.status(400).send("A user with that username already exists");
  }

  var profile = _.pick(req.body, userScheme.type, 'password', 'extra');
  profile.id = _.max(users, 'id').id + 1;

  users.push(profile);

  res.status(201).send({
    id_token: createIdToken(profile),
    access_token: createAccessToken()
  });
});

app.post('/sessions/create', function(req, res) {

  var userScheme = getUserScheme(req);

  if (!userScheme.username || !req.body.password) {
    return res.status(400).send("You must send the username and the password");
  }

  var user = _.find(users, userScheme.userSearch);
  
  if (!user) {
    return res.status(401).send("The username or password don't match");
  }

  if (user.password !== req.body.password) {
    return res.status(401).send("The username or password don't match");
  }

  res.status(201).send({
    id_token: createIdToken(user),
    access_token: createAccessToken()
  });
});

// mod
function quoteExists() {
  return true;
}

function getQuoteScheme(req) {
  
  var quoteId;
  var dateOfBirth;
  var postcode
  var quotes = {};

  var body = req.body
  // The POST contains quoteId, postcode and dateOfBirth
  if(body.quoteId && body.dateOfBirth && body.postcode) {
    return {
      quoteId: body.quoteId,
      dateOfBirth: body.dateOfBirth,
      postcode: body.postcode,
      quoteExists: quoteExists()
    }
  }

  return {
    quoteId: "",
    dateOfBirth: "",
    postcode: "",
    quoteExists: false
  }
}


app.post('/quotes', function(req, res) {
  
  var quoteScheme = getQuoteScheme(req);  

  if (!quoteScheme.quoteId || !quoteScheme.dateOfBirth || !quoteScheme.postcode) {
    console.log(quoteScheme)
    return res.status(400).send("You must send the quoteId, dateOfBirth and the postcode");
  }

  if (!quoteScheme.quoteExists) {
   return res.status(400).send("Quote does not exists!");
  }

  var profile = _.pick(req.body, 'quoteId', 'dateOfBirth', 'postcode');

  quotes.push(profile);
  console.log(quotes)

  res.status(201).send({
    access_token: createAccessToken()
  });
});

app.get('/motor-quote-service', function(req, res) {
  res.status(201).send({
    status: 'under construction'
  });
});