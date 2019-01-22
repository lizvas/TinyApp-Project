var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var cookieSession = require("cookie-session");
const uuidv4 = require("uuid/v4");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"]
  })
);
// app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userId: "userRandomID"
  },

  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    userId: "user2RandomID"
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

const createUser = (email, password) => {
  const userId = generateRandomString();

  const newUser = {
    id: userId,
    email: email,
    password: password
  };
  users[userId] = newUser;
  return userId;
};

function addNewURL(shortUrl, longUrl, userId) {
  urlDatabase[shortURL] = {
    shortUrl: shortUrl,
    longUrl: longUrl,
    userId: userId
  };
}

function urlsForUser(id) {
  const filteredUrls = {};
  for (const shortURL in urlDatabase) {
    const urlObj = urlDatabase[shortURL];

    if (urlObj.userId === id) {
      //url belongs to user
      //urlObj needs to be part of the filteredUrls object
      filteredUrls[shortURL] = urlObj;
    }
  }
  return filteredUrls;
}

function generateRandomString() {
  return uuidv4().substr(0, 6);
}

const emailExist = email => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return userId;
    }
  }
  return false;
};

//List of all the endpoints
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  let shortURL = generateRandomString();
  const userId = req.session["user_id"];

  urlDatabase[shortURL] = { longURL, shortURL, userId };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/", (req, res) => {
  console.log(generateRandomString());
  let templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/login", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  res.render("login", templateVars);
});

//output the list of urls
app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];
  let currentUser = users[userId];
  //communicating the filtered version of userDatabase for the currently
  //logged in user

  let templateVars = {
    urls: currentUser ? urlsForUser(userId) : urlDatabase,
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.post("/login", (req, res) => {
  const lEmail = req.body.email;
  // const lpassword = req.body.password;
  // console.log("password", lpassword);
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  for (var lUser in users) {
    if (
      users[lUser].email === lEmail &&
      users[lUser].password === req.body.password
    ) {
      // res.cookie("user_id", users[lUser].id);
      req.session.user_id = users[lUser].id;
      res.redirect("/urls/");
      return;
    }
  }
  res.send("Wrong email or password!");
});
// const email_password_empty = !email || !password;

//   if (email_password_empty) {
//     res.status(400).send("Please send out the required fields");
//   } else if (!emailExist(email)) {
//     res.status(400).send("User already exists. Please login!");
//   } else {
//     const userId = createUser(email, password);

app.get("/urls/new", (req, res) => {
  let usernameFromCookie = req.session["user_id"];
  let templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
  if (!templateVars) {
    res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let usernameFromCookie = req.session["user_id"];
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send("Url doesn't exist!");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id]) {
    delete urlDatabase[req.params.id];
  }
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie("user_id");
  res.redirect("/urls");
});
app.get("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.send("Cookie deleted");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  // let randomId = generateRandomString();
  // users[randomId] =
  //   id: randomId,
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  console.log("hashedPassword", hashedPassword);
  const email_password_empty = !email || !password;

  if (email_password_empty) {
    res.status(400).send("Please send out the required fields");
  } else if (emailExist(email)) {
    res.status(400).send("User already exists. Please login!");
  } else {
    const userId = createUser(email, password);

    req.session.user_id = userId;
    res.redirect("/urls");
  }
});

app.get("/register", (req, res) => {
  let templateVars = { user: null };
  res.render("register", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
