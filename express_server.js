const express       = require("express");
const app           = express();
const PORT          = process.env.PORT || 8080; // default port 8080
const bodyParser    = require("body-parser");
// const cookieParser  = require('cookie-parser');
const bcrypt        = require('bcrypt');
const cookieSession = require('cookie-session');

app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());

app.use(cookieSession({
  name: 'session',
  keys: ['aqua-blue-turtle'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs");

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}

function findUser(email) {
  for (let userId in users) {
    if ( email === users[userId].email ) {
      return users[userId];
    }
  }
  return false;
}

function addNewURL(shortURL, longURL, userID) {
  urlDatabase[shortURL] = {
    url: longURL,
    userID: userID
  }
}

function addNewUser (email, password) {
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password
  };
  return id;
}

function urlsForUser(id) {
  const filteredUsers = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      filteredUsers[shortURL] = urlDatabase[shortURL];
    } 
  } 
  return filteredUsers;
}



var urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userID: "user2RandomID"
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.post("/urls", (req, res) => {
  const longURL   = req.body.longURL;
  const shortURL  = generateRandomString();
  const userID    = req.session.user_id;

  addNewURL(shortURL, longURL, userID);

  res.redirect(`/urls/${shortURL}`);

});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUser(email);
  const authenticated = user && bcrypt.compareSync(password, user.password);

  if ( authenticated ) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Bad Credentials!");
  }
});

app.post("/register", (req, res) => {
  const email     = req.body.email;
  const password  = req.body.password;

  if (email && password && !findUser(email) ) {
    const id = addNewUser(email, bcrypt.hashSync(password, 10));
    req.session.user_id = id;
    res.redirect("/urls");
  } else {
    res.status(400).send("Please provide a valid email and password");
  }

})

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session.user_id] }; 
  res.render("urls_register", templateVars);
});

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {  urls: urlsForUser(req.session.user_id), 
                        user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get('/login', (req, res) => {
  let templateVars = { user: null };
  res.render('urls_login', templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  let templateVars = { user: user };  
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.status(302).redirect('/login');
  }
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  let templateVars = {  shortURL: shortURL,
                        longURL:  urlDatabase[shortURL].url,
                        user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send('url doesn\'t exists!');
  }
  
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls/:id", (req, res) =>{
  const shortURL  = req.params.id;
  const longURL   = req.body.longURL;

  urlDatabase[shortURL] = longURL;

  res.redirect('/urls');

});

app.post('/logout', (req, res) => {
  req.session = null;
  res.status(302).redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  if ( urlDatabase[shortURL] ) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});