const express = require("express");
const {generateRandomString, getUserByEmail, userAlreadyExists, userAuthenticator, userIDReturner, urlsForUser} = require('./helpers');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.set("view engine", "ejs");

//Global url Database for current users
const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID:"userRandomID"},
  "9sm5xK": {longURL:"http://www.google.ca", userID:"user2RandomID"}
};

//Global object for users
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

//Routing
app.get("/urls", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  if (currentUser) {
    let userSpecificURLs = urlsForUser(urlDatabase, currentUser["id"]);
    console.log("userSpecific URLS", userSpecificURLs);
    const templateVars = {
      user: currentUser,
      urls: userSpecificURLs
    }; //note when sending variables to EJS template, we need to send them inside an object
    res.render("urls_index", templateVars);
  } else {
    const templateVars = {
      user: false
    };
    res.render("urls_index", templateVars);
  }

});

app.get("/urls/new", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  const templateVars = {
    user: currentUser
  };
  //modify to only allow registered and logged in users to create tiny URLS
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
    error: null
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  const templateVars = {
    user: currentUser,
    error: null
  };

  res.render("login", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  //route parameter is req.params.shortURL
  //determine if longURL exists, if it does not redirect to homepage
  let longURL = urlDatabase[req.params.shortURL].longURL;
  let currentUser = users[req.session["user_id"]];
  let display;
  console.log("currentUser", currentUser);
  //to determine if url belongs to current user to display show page
  if (urlsForUser(urlDatabase, currentUser.id)[req.params.shortURL]) {
    display = true;
  } else {
    display = false;
  }

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


//Posting aka request changes to website via client

app.post("/urls", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  let id = generateRandomString();
  urlDatabase[id] = {longURL: req.body.longURL, userID: currentUser.id};
  res.redirect(`/urls/${id}`);
  
});

//To delete a url from database
app.post("/urls/:shortURL/delete", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  // check if current user is logged in
  if (currentUser) {
    //checking if url belongs to urls for user before allowing them to delete
    if (urlsForUser(urlDatabase, currentUser.id)[req.params.shortURL]) {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/urls");
    }
  } else {
    //status code Forbiddon ooooou
    res.status(403).redirect("/login");
  }

});

//to Update a long url
app.post("/urls/:shortURL", (req, res) => {
  let currentUser = users[req.session["user_id"]];
  //check if URL belongs to user's list then they can edit
  if (urlsForUser(urlDatabase, currentUser.id)[req.params.shortURL]) {
  
    let newURL = req.body.newURL;
    //adding URL to database
    urlDatabase[req.params.shortURL].longURL = newURL;
    res.redirect("/urls");
  }

});

//to login to your profile route
app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  let userID = userIDReturner(users, userEmail);
  //look up email address in user object
  
  //check if it exists using helper function
  if (userAuthenticator(users, userEmail, userPassword)) {
    //if both pass, set user_id cookie matching users random ID and redirect to /urls
    // console.log("YAY");
    req.session['user_id'] = userID;
    res.redirect("/urls");
  } else {
    const templateVars = { 
      error: "Error in credentials",
      user: true //to show login page properly need to set to true to render page
    };
    res.render("login", templateVars)
    // res.status(403).redirect("/login");
  }

});

app.post("/logout", (req, res) => {
  // req.session['user_id'] = null; also another way to delete cookies?
  delete req.session['user_id'];
  res.redirect("/urls");
});

//generating a new user request
app.post("/register", (req, res) => {
  
  let newId = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;

  //creating new user object
  //if email or password is empty render 400 status code
  if (!newEmail || !newPassword) {
    const templateVars = {
      user: true,
      error: "Email or Password input error!"
    }
    res.render("register", templateVars);
    // res.status(400).redirect("/login");
  } else if (userAlreadyExists(users, newEmail)) {
    const templateVars = {
      user: true,
      error: "Email already exists as user!"
    }
    res.render("register", templateVars);
    // res.status(400).redirect("/login");
  } else {
    const newUser = {
      id: newId,
      email: newEmail,
      password: bcrypt.hashSync(newPassword, saltRounds),
    };
    //adding new user to database
    users[newId] = newUser;
    // console.log(users);
    req.session['user_id'] = newId;
    res.redirect("/urls");
  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});