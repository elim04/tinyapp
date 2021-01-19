const express = require("express");
const app = express();
const PORT = 8080; //default port is 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

//Function for generating random string of 6 characters
const generateRandomString = function() {
  const characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = "";

  for (let i = 0; i < 6; i++) {
    let index = Math.ceil(Math.random() * characters.length);
    result += characters[index];
  }

  return result;
};

app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.ca"
};

//Routing
app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase}; //note when sending variables to EJS template, we need to send them inside an object
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  //route parameter is req.params.shortURL
  //determine if longURL exists, if it does not redirect to homepage
  let longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
    
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
    res.render("urls_shows", templateVars);

  } else {
    res.send("URL does not exist.");
  }

});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


//Posting
app.post("/urls", (req, res) => {
  console.log(req.body);
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
  
});

//To delete a url from database
app.post("/urls/:shortURL/delete", (req, res) => {
  //deleting the url from the urlDatabase using the req params info
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});