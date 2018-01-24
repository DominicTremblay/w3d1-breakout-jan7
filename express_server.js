const express     = require("express");
const app         = express();
const PORT        = process.env.PORT || 8080; // default port 8080
const bodyParser  = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.post("/urls", (req, res) => {
  const longURL   = req.body.longURL;
  const shortURL  = generateRandomString();

  urlDatabase[shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);

});

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  let templateVars = {  shortURL: shortURL,
                        longURL:  urlDatabase[shortURL] };
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