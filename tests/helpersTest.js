const { assert } = require('chai');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const {generateRandomString, getUserByEmail, userAlreadyExists, userAuthenticator, userIDReturner, urlsForUser} = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("puppies", saltRounds)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("kitties", saltRounds)
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "user3@example.com",
    password: bcrypt.hashSync("turtles", saltRounds)
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.deepEqual(user, expectedOutput);
  });

  it('should return undefined if non-existent email in user database', function() {

    const user = getUserByEmail("emlovescookies@cookiemonster.com", testUsers);
    const expectedOutput = undefined;
    assert.deepEqual(user, expectedOutput);
  });

});

describe('generateRandomString', function() {
  it('should return a generated random string of 6 characters', function() {
    const newID = generateRandomString();
    const expectedOutput = 6;
    assert.equal(newID.length, expectedOutput);
  });
});

describe('userAlreadyExists', function() {
  it('should return true if user already exists in database based on email', function() {
    const user = userAlreadyExists(testUsers, "user2@example.com");
    const expectedOutput = true;
    assert.equal(user, expectedOutput);
  });

  it('should return false if user already exists in database based on email', function() {
    const user = userAlreadyExists(testUsers, "emdislikespeanuts@nuts.com");
    const expectedOutput = false;
    assert.equal(user, expectedOutput);
  });
});

describe('userAuthenticator', function() {
  it('should return true if user inputted email and password are correct', function() {
    const user = userAuthenticator(testUsers, "user@example.com", "puppies");
    const expectedOutput = true;
    assert.equal(user, expectedOutput);
  });

  it('should return false if user inputted email and password are correct', function() {
    const user = userAuthenticator(testUsers, "user@example.com", "turtles");
    const expectedOutput = false;
    assert.equal(user, expectedOutput);
  });
});

describe('userIDReturner', function() {
  it('should return correct ID of current user based on email', function() {
    const userID = userIDReturner(testUsers, "user@example.com");
    const expectedOutput = "userRandomID";
    assert.equal(userID, expectedOutput);
  });

  it('should return undefined if no email exists within database', function() {
    const userID = userIDReturner(testUsers, "harry_potter@hogwarts.com");
    const expectedOutput = undefined;
    assert.equal(userID, expectedOutput);
  });
});

describe('urlsForUser', function() {
  it('should return filtered object of current users personally created urls', function() {

    const testUrlDatabase = {
      "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID:"userRandomID"},
      "9sm5xK": {longURL:"http://www.google.ca", userID:"user2RandomID"}
    };

    const userURLList = urlsForUser(testUrlDatabase, "userRandomID");
    const expectedOutput = {"b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID:"userRandomID"}};

    assert.deepEqual(userURLList, expectedOutput);
  });

  it('should return empty object for user who has no URLs created based on their userID', function() {
    
    const testUrlDatabase = {
      "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID:"userRandomID"},
      "9sm5xK": {longURL:"http://www.google.ca", userID:"user2RandomID"}
    };

    const userURLList = urlsForUser(testUrlDatabase, "user3RandomID");
    const expectedOutput = {};

    assert.deepEqual(userURLList, expectedOutput);
  });
});