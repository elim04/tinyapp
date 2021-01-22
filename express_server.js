const express = require("express");
const {generateRandomString, userAlreadyExists, userAuthenticator, userIDReturner, urlsForUser} = require('./helpers');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));

app.set("view engine", "ejs");

//Global url database for current users
const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID:"userRandomID"},
  "9sm5xK": {longURL:"http://www.google.ca", userID:"user2RandomID"}
};

//Global object for users database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("puppies", saltRounds)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("kitties", saltRounds)
  }
};

//Routing GET requests below

app.get("/", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  if (currentUser) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  if (currentUser) {
    let userSpecificURLs = urlsForUser(urlDatabase, currentUser["id"]);
    const templateVars = {
      user: currentUser,
      urls: userSpecificURLs
    };
    res.render("urls_index", templateVars);
  } else {
    const templateVars = {
      user: false //needs to be false to to show error on page to login/register
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  const templateVars = {
    user: currentUser
  };
  //Only allow registered and logged in users to create tiny URLS
  if (!currentUser) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/register", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  const templateVars = {
    user: currentUser,
    error: null //to stop error from showing on page because POST request has error response
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  const templateVars = {
    user: currentUser,
    error: null //to stop error from showing up on page because POST request has error response
  };

  res.render("login", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  let currentUser = users[req.session["user_id"]];
  let display;
  //to determine if url belongs to current user
  if (urlsForUser(urlDatabase, currentUser.id)[req.params.shortURL]) {
    display = true; //will show urls on page
  } else {
    display = false; //will trigger error on page
  }
  //check if long URL is true/false to determine if can show page or not
  if (longURL) {
    const templateVars = {
      user: currentUser,
      shortURL: req.params.shortURL,
      longURL: longURL,
      display
    };
    res.render("urls_shows", templateVars);
  } else {
    res.send("URL does not exist.");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//POST requests below

app.post("/urls", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  let id = generateRandomString();
  urlDatabase[id] = {longURL: req.body.longURL, userID: currentUser.id};
  res.redirect(`/urls/${id}`);
});

app.delete("/urls/:shortURL", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  // check if current user is logged in
  if (currentUser) {
    //check if url belongs to urls for user before allowing them to delete
    if (urlsForUser(urlDatabase, currentUser.id)[req.params.shortURL]) {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/urls");
    }
  } else {
    //send status code Forbidden if not on their list
    res.status(403).redirect("/login");
  }
});

//To Update a long url
app.put("/urls/:shortURL", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  //check if URL belongs to user's list then they can edit
  if (urlsForUser(urlDatabase, currentUser.id)[req.params.shortURL]) {
    let newURL = req.body.newURL;
    //updating new URL to database
    urlDatabase[req.params.shortURL].longURL = newURL;
    res.redirect("/urls");
  }
});
 
app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  let userID = userIDReturner(users, userEmail);
  //check if it exists and using right credentials for user
  if (userAuthenticator(users, userEmail, userPassword)) {
    //if both pass, set user_id cookie matching users random ID and redirect to /urls
    req.session['user_id'] = userID;
    res.redirect("/urls");
  } else {
    const templateVars = {
      error: "Error in credentials",
      user: null
    };
    res.render("login", templateVars);
    // res.status(403).redirect("/login"); -- alternative way to send error
  }
});

app.post("/logout", (req, res) => {
  // req.session['user_id'] = null; -- also another way to delete cookies?
  delete req.session['user_id'];
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let newId = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;
  //if email or password send error msg
  if (!newEmail || !newPassword) {
    const templateVars = {
      user: null,
      error: "Email or Password input error!"
    };
    res.render("register", templateVars);
    // res.status(400).redirect("/login"); --alternative send status code and redirect to login
  } else if (userAlreadyExists(users, newEmail)) {
    const templateVars = {
      user: null,
      error: "Email already exists as user!"
    };
    res.render("register", templateVars);
    // res.status(400).redirect("/login"); --alternative send status code and redirect to login
  } else {
    const newUser = {
      id: newId,
      email: newEmail,
      password: bcrypt.hashSync(newPassword, saltRounds),
    };
    //Adding new user to database
    users[newId] = newUser;
    //add encypted cookies
    req.session['user_id'] = newId; 
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});