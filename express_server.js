const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; //default port is 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//Function for generating random string of 6 characters
const generateRandomString = function() {
  const characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = "";

  for (let i = 0; i < 6; i++) {
    let index = Math.ceil(Math.random() * 61);
    result += characters[index];
  }

  return result;
};

//helper function to check if user exists in database
const userAlreadyExists = function(userDatabase, email) {
  for (let user in userDatabase) {
    if (userDatabase[user].email === email) {
      return true;
    } 
  }
};

//helper function to check for correct password

const userAuthenticator = function(userDatabase, email, password) {
  for (let user in userDatabase) {
    console.log("user", user);
    if (userDatabase[user].email === email) {
      if (userDatabase[user].password === password) {
        return true;
      }
    }
  }
  return false;
};

//helper function to return userID
const userIDReturner = function(userDatabase, email) {
  for (let user in userDatabase) {
    if (userDatabase[user].email === email) {
      let userID = userDatabase[user].id;
      return userID;
    } 
  }
};

//function for returning uRLS when userID is equal to id of currently logged in user
const urlsForUser = function(urlDatabase, userID) {
  let userSpecificURLS = {};

  for (let key in urlDatabase) {
    if (userID === urlDatabase[key].userID) {
      userSpecificURLS[key] = urlDatabase[key];
    }
  }
  console.log("userSpecificURLS", userSpecificURLS)
  return userSpecificURLS;
};

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID:"userRandomID"},
  "9sm5xK": {longURL:"http://www.google.ca", userID:"user2RandomID"}
};

//Global object for users
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "puppies"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

//Routing
app.get("/urls", (req, res) => {
  let currentUser = users[req.cookies["user_id"]];
  if (currentUser) {
    let userSpecificURLs = urlsForUser(urlDatabase, currentUser["id"]);
    const templateVars = {
      user: currentUser,
      urls: userSpecificURLs
    }; //note when sending variables to EJS template, we need to send them inside an object
        res.render("urls_index", templateVars);
  } else {
    const templateVars = {
      user: false
    }
    res.render("urls_index", templateVars);
  }

});

app.get("/urls/new", (req, res) => {
  let currentUser = users[req.cookies["user_id"]];
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
  let currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser
  };
  res.render("register", templateVars);
})

app.get("/login", (req, res) => {
  let currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser
  };

  res.render("login", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  //route parameter is req.params.shortURL
  //determine if longURL exists, if it does not redirect to homepage
  let longURL = urlDatabase[req.params.shortURL].longURL;
  let currentUser = users[req.cookies["user_id"]];
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


//Posting

app.post("/urls", (req, res) => {
  let currentUser = users[req.cookies["user_id"]]
  let id = generateRandomString();
  urlDatabase[id] = {longURL: req.body.longURL, userID: currentUser.id};
  res.redirect(`/urls/${id}`);
  
});

//To delete a url from database
app.post("/urls/:shortURL/delete", (req, res) => {
  let currentUser = users[req.cookies["user_id"]];
  //deleting the url from the urlDatabase using the req params info
  if (urlsForUser(urlDatabase, currentUser.id)[req.params.shortURL]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
//add urls_shows conditional to display error if trying to delete not their own.
});

//to Update a long url 
app.post("/urls/:shortURL", (req, res) => {
  let currentUser = users[req.cookies["user_id"]];
  
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
  let userPassword =req.body.password;
  let userID = userIDReturner(users, userEmail);
  //look up email address in user object
  
  //check if it exists using helper function
  if (userAuthenticator(users, userEmail, userPassword)) {
    //if both pass, set user_id cookie matching users random ID and redirect to /urls
    console.log("YAY");
    res.cookie('user_id', userID);
    res.redirect("/urls");
  } else {
    res.sendStatus(403);
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id', req.cookies["user_id"]);
  res.redirect("/login")
});

//generating a new user request
app.post("/register", (req, res) => {
  
  let newId = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;
  //creating new user object
  //if email or password is empty render 400 status code
  if (!newEmail || !newPassword) {
    res.sendStatus(400);
  } else if (userAlreadyExists(users, newEmail)) {
    res.sendStatus(400);
  } else {
    const newUser = {
      id: newId,
      email: newEmail,
      password: newPassword
    };
    //adding new user to database
    users[newId] = newUser;
    // console.log(users);
    res.cookie('user_id', newId);
    res.redirect("/urls");
  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});