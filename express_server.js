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

//helper function for register route
const userAlreadyExists = function(userDatabase, email) {
  for (let user in userDatabase) {
    if (userDatabase[user].email === email) {
      return true;
    } else {
      return false;
    }
  }
};

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.ca"
};

//Global object for users
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
};

//Routing
app.get("/urls", (req, res) => {
  let currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser,
    urls: urlDatabase
  }; //note when sending variables to EJS template, we need to send them inside an object
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/register", (req, res) => {
  let currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser
  };
  res.render("register", templateVars);
})

app.get("/urls/:shortURL", (req, res) => {
  //route parameter is req.params.shortURL
  //determine if longURL exists, if it does not redirect to homepage
  let longURL = urlDatabase[req.params.shortURL];
  let currentUser = users[req.cookies["user_id"]];
  if (longURL) {   
    const templateVars = { 
      user: currentUser,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]
     };
    res.render("urls_shows", templateVars);
  } else {
    res.send("URL does not exist.");
  }
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


//Posting

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
  
});

//To delete a url from database
app.post("/urls/:shortURL/delete", (req, res) => {
  //deleting the url from the urlDatabase using the req params info
  let URLToDelete = urlDatabase[req.params.shortURL];
  delete URLToDelete;
  res.redirect("/urls");
});

//to Update a long url 
app.post("/urls/:shortURL", (req, res) => {
  let newURL = req.body.newURL;
  //adding URL to database
  urlDatabase[req.params.shortURL] = newURL;
  res.redirect("/urls");
});

//to login to your profile route
app.post("/login", (req, res) => {
  
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id', req.cookies["user_id"]);
  res.redirect("/urls")
});

//generating a new user request
app.post("/register", (req, res) => {
  
  let newId = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;
  //creating new user object
  //if email or password is empty render 400 status code
  if (!newEmail || !newPassword) {
    res.status(400).send('ERROR 400');
  } else if (userAlreadyExists(users, newEmail)) {
    res.status(400).send('ERROR 400');
  } else {
    const newUser = {
      id: newId,
      email: newEmail,
      password: newPassword
    };
    //adding new user to database
    users[newId] = newUser;
  
    res.cookie('user_id', newId);
    res.redirect("/urls");
  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});