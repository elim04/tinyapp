//helpers.js
//helper functions for express_server.js

//Need bcrypt for userAuthenticator() function to work
const bcrypt = require('bcrypt');

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

//helper function to retrieve user
//Note from EL: I didn't actually use this function and made it after the fact when compass told me to. I had previous helper functions made to help with this.
const getUserByEmail = function(email, userDatabase) {
  for (let user in userDatabase) {
    if (userDatabase[user].email === email) {
      return user;
    }
  }
};

//helper function to check if user exists in database
const userAlreadyExists = function(userDatabase, email) {
  for (let user in userDatabase) {
    if (userDatabase[user].email === email) {
      return true;
    }
  }
  return false;
};

//helper function to check for correct password for user email first check if email exists then password
const userAuthenticator = function(userDatabase, email, password) {
  for (let user in userDatabase) {
    if (userDatabase[user].email === email) {
      if (bcrypt.compareSync(password, userDatabase[user].password)) {
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
  // console.log("userSpecificURLS", userSpecificURLS)
  return userSpecificURLS;
};

module.exports = {generateRandomString, getUserByEmail, userAlreadyExists, userAuthenticator, userIDReturner, urlsForUser};
