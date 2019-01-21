const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
// const cookieParser  = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser());

app.use(
  cookieSession({
    name: 'session',
    keys: ['aqua-blue-turtle'],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

// urlDatabase['b2xVn2'].longUrl

const urlDatabase = {
  b2xVn2: {
    shortUrl: 'b2xVn2',
    longUrl: 'http://www.lighthouselabs.ca',
    userId: 'userRandomID',
  },
  '9sm5xK': {
    shortUrl: '9sm5xK',
    longUrl: 'http://www.google.com',
    userId: 'user2RandomID',
  },
};

const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur',
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk',
  },
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

function addNewURL(shortUrl, longUrl, userId) {
  // {
  //   shortUrl: 'b2xVn2',
  //     longUrl: 'http://www.lighthouselabs.ca',
  //       userId: 'userRandomID',
  // }
  urlDatabase[shortUrl] = {
    shortUrl: shortUrl,
    longUrl: longUrl,
    userId: userId,
  };
}

function addNewUser(email, password) {
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password,
  };
  return id;
}

function urlsForUser(id) {
  const filteredUrls = {};

  // {
  //   shortUrl: 'b2xVn2',
  //   longUrl: 'http://www.lighthouselabs.ca',
  //   userId: 'userRandomID',
  // }

  for (const shortUrl in urlDatabase) {
    const urlObj = urlDatabase[shortUrl];

    if (urlObj.userId === id) {
      // url belongs to that user
      // the urlObj needs to be part of the filterdUrls object
      filteredUrls[shortUrl] = urlObj;
    }
  }
  return filteredUrls;
}

// const filteredUsers = {};
// for (const shortURL in urlDatabase) {
//   if (urlDatabase[shortURL].userID === id) {
//     filteredUsers[shortURL] = urlDatabase[shortURL];
//   }
// }

// const urlArr = Object.keys(urlDatabase);
// return urlArr.reduce((filteredUrls, shortURL) => {
//   if (urlDatabase[shortURL].userID === id) {
//     filteredUrls[shortURL] = urlDatabase[shortURL];
//   }
//   return filteredUrls;
// }, {});
// }

app.post('/urls', (req, res) => {
  // const { longURL } = req.body;
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  // const userId = req.cookies("user_id");
  const userId = req.session.user_id;

  addNewURL(shortURL, longURL, userId);

  res.redirect(`/urls/${shortURL}`);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = findUser(email);
  const authenticated = user && bcrypt.compareSync(password, user.password);

  if (authenticated) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  } else {
    res.render('urls_login');
  }
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (email && password && !findUser(email)) {
    const id = addNewUser(email, bcrypt.hashSync(password, 10));
    req.session.user_id = id;
    res.redirect('/urls');
  } else {
    res.status(400).send('Please provide a valid email and password');
  }
});

app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render('urls_register', templateVars);
});

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  // const userId = req.cookies("user_id")
  const userId = req.session.user_id;

  const templateVars = {
    // communicating the filtered version of urlDatabase for the currently
    // loggedin User

    urls: urlsForUser(userId),
    user: users[userId],
  };
  res.render('urls_index', templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('urls_login', templateVars);
});

app.get('/urls/new', (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = { user };
  if (user) {
    res.render('urls_new', templateVars);
  } else {
    res.status(302).redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;

  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].longUrl,
    user: users[req.session.user_id],
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
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
      visitsTimeStamp: [],
    };

    urlObj.visits[visitor].visitsTimeStamp.push(new Date());

    // urlObj.uniqueVisits =
    urlObj.uniqueVisits = Object.keys(urlObj.visits).length;

    console.log(urlObj.visits);
  } else {
    res.send("url doesn't exists!");
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/users.json', (req, res) => {
  res.json(users);
});

app.put('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const { longURL } = req.body;

  urlDatabase[shortURL].url = longURL;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.status(302).redirect('/urls');
});

app.delete('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  if (urlDatabase[shortURL]) {
    delete urlDatabase[shortURL];
  }
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
