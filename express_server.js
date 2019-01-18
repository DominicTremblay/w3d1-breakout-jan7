const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
const methodOverride = require("method-override");

const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
// const cookieParser  = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser());

app.use(
  cookieSession({
    name: "session",
    keys: ["aqua-blue-turtle"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
);

app.use(methodOverride("_method"));

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: {
    url: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    views: 0,
    uniqueVisits: 0,
    createdAt: new Date(),
    visits: {}
  },
  "9sm5xK": {
    url: "http://www.google.com",
    userID: "user2RandomID",
    views: 0,
    uniqueVisits: 0,
    createdAt: new Date(),
    visits: {}
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

function generateRandomString() {
  return Math.random()
    .toString(36)
    .substring(7);
}

function findUser(email) {
  for (const userId in users) {
    if (email === users[userId].email) {
      return users[userId];
    }
  }

  // userId = Object.keys(users).find(id => users[id].email === email);
  // return users[userId];
  return false;
}

function addNewURL(shortURL, longURL, userID) {
  urlDatabase[shortURL] = {
    url: longURL,
    userID,
    views: 0,
    uniqueVisits: 0,
    createdAt: new Date(),
    visits: {}
  };
}

function addNewUser(email, password) {
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password
  };
  return id;
}

function urlsForUser(id) {
  // const filteredUsers = {};
  // for (const shortURL in urlDatabase) {
  //   if (urlDatabase[shortURL].userID === id) {
  //     filteredUsers[shortURL] = urlDatabase[shortURL];
  //   }
  // }

  const urlArr = Object.keys(urlDatabase);
  return urlArr.reduce((filteredUrls, shortURL) => {
    if (urlDatabase[shortURL].userID === id) {
      filteredUrls[shortURL] = urlDatabase[shortURL];
    }
    return filteredUrls;
  }, {});
}

app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  const shortURL = generateRandomString();
  const userID = req.session.user_id;

  addNewURL(shortURL, longURL, userID);

  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = findUser(email);
  const authenticated = user && bcrypt.compareSync(password, user.password);

  if (authenticated) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.render("urls_login");
  }
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (email && password && !findUser(email)) {
    const id = addNewUser(email, bcrypt.hashSync(password, 10));
    req.session.user_id = id;
    res.redirect("/urls");
  } else {
    res.status(400).send("Please provide a valid email and password");
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: null };
  res.render("urls_login", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = { user };
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.status(302).redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;

  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].url,
    views: urlDatabase[shortURL].views,
    uniqueVisits: urlDatabase[shortURL].uniqueVisits,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const urlObj = urlDatabase[req.params.shortURL];
  const longURL = urlObj.url;
  let [visitor] = req.session;

  if (!visitor) {
    req.session.visitor = generateRandomString();
    [visitor] = req.session;
  }

  console.log(visitor);

  if (longURL) {
    res.redirect(longURL);
    urlObj.views += 1;

    urlObj.visits[visitor] = urlObj.visits[visitor] || {
      visitor,
      visitsTimeStamp: []
    };

    urlObj.visits[visitor].visitsTimeStamp.push(new Date());

    // urlObj.uniqueVisits =
    urlObj.uniqueVisits = Object.keys(urlObj.visits).length;

    console.log(urlObj.visits);
  } else {
    res.send("url doesn't exists!");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.put("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const { longURL } = req.body;

  urlDatabase[shortURL].url = longURL;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.status(302).redirect("/urls");
});

app.delete("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  if (urlDatabase[shortURL]) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
