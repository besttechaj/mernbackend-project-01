//hiding secret details
require('dotenv').config();
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const auth = require('./middleware/auth');

//to use cookie-parser as a middleware we need to acknowledge our express,mongo,node using...
app.use(cookieParser());

//BELOW TWO STEPS ARE MANDATORY TO POST AND PUT Request: to get  THE REGISTRATION DATA
//express.json()-> is a function to convert the content to json and send the data.
app.use(express.json());
//The express.urlencoded() function is a built-in middleware function in Express. It parses incoming requests with URL-encoded payloads and is based on a body parser.
app.use(express.urlencoded({ extended: false }));
//requiring...
require('../src/db/conn'); //db
const Register = require('./models/register');

//paths...
const partials_Path = path.join(__dirname, '../templates/partials');
const views_Path = path.join(__dirname, '../templates/views');
const static_path = path.join(__dirname, `../public`);

const port = process.env.PORT || 8000;

//default path
app.use(express.static(static_path)); //this command will be looking for index.html file inside public folder

//setting the new path
app.set('view engine', 'hbs');

//changing the view engine path
app.set('views', views_Path);

//registering partials
hbs.registerPartials(partials_Path);

//REQUEST...
app.get('/', (req, res) => {
  //rendering the index.hbs file
  //NOTE:DELETE THE INDEX.HTML FILE INSIDE PUBLIC FOLDER
  res.render('index'); //rendering index page
});

app.get('/register', (req, res) => {
  res.render('register'); //rendering register page
});

//login page
app.get('/login', (req, res) => {
  res.render('login'); //rendering login page
});

//secret dummy page -> if the user is logged-in , After verifying the jsonwebtoken with the secret key, redirect the user to its corresponding confidential data file.
//adding a middleware  (auth)  before rendering the confidential file.
//due to this auth middleware first it will check whether the user is genuine or not by matching the provided jwt token during logged-in with  the fetched existing jwt token during the user's registration form database.
app.get('/secret', auth, (req, res) => {
  res.render('secret'); //rendering login page
});

//logout logic --> before logging out it will verify the user hence we are providing auth function
app.get('/logout', auth, async (req, res) => {
  try {
    console.log(req.user);
    //LOGIC TO LOGOUT FOR SINGLE MOBILE/LAPTOP LOGGED-IN USER
    //logic to delete the newest temporary provided token from the database>>> due to this you will be logout from current mobile device
    //applying the filter method to tokens field present in the current user's database
    //req.user.tokens-->tokens array list of the current user in database
    //currentElement--> this will take each element(token) from the tokens's Array list and match it with the req.token(newest temporary provided token)
    req.user.tokens = req.user.tokens.filter((currentElement) => {
      return currentElement.token != req.token;
    });

    //LOGIC TO LOGOUT FOR MULTIPLE  MOBILE/LAPTOP LOGGED-IN USING SINGLE GMAIL'S USER ID AND PASSWORD
    //this logic will logout at a time  all the mobiles/laptops or  any device which is using the same email id.
    //req.user.tokens = []; //emptying my array(all temporary jwt provided token)

    //logic to delete cookie..
    //logging-out  with the help of deleting cookie.
    //we have one in-built method inside response ie. res.clearCookie("current provided jwt token")
    //it takes temporary generated token
    res.clearCookie('jwt');

    console.log('logout Successfully'); //till here your temporary token will be finished
    //WE ARE SAVING THE ABOVE TWO OPERATION BELOW IN THE CURRENT USER'S PROFILE
    //to permanently remove  cookie from the website cookies's section
    await req.user.save(); //fetch the current user and save the changes
    res.render('login');
  } catch (error) {
    res.status(500).send(error);
  }
});

//creating a new user in our database whenever this post method is called
app.post('/register', async (req, res) => {
  try {
    //getting all the information of user
    //here req.body.password(password->name attribute given in form)
    //here req.body.confirmpassword(confirmpassword->name attribute given in form)
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;
    if (password === cpassword) {
      const registerEmployee = new Register({
        //here req.body.givenValue(givenValue->name attribute given in form)
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        gender: req.body.gender,
        phone: req.body.phone,
        age: req.body.age,
        password: password,
        confirmpassword: cpassword,
      });
      console.log('the success part' + registerEmployee);

      //ADDING A MIDDLEWARE TO GENERATE TOKEN

      //defining MIDDLEWARE FOR TOKEN PROVIDER

      //to understand below logic ----> [employeeSchema.methods.function]
      //here employeeSchema is an object which contains
      //In JavaScript, objects can also contain functions. For example,

      // object containing method
      /*
const person = {
  name: 'John',
  greet: function () {
    console.log('hello');
  },
};

In the above example, a person object has two keys (name and greet), which have a string value and a function value, respectively.

Hence basically, the JavaScript method is an object property that has a function value.
*/
      const token = await registerEmployee.generateAuthToken();
      console.log(`the token part is`, token);

      //COOKIE....storing the token inside cookie
      //the res.cookies() function is used to set the cookie name to value.
      //the value parameter may be a string or object converted to JSON.
      //syntax: res.cookie(name,value,[options])--> give any name to cookie ,value->pass your token, option-> cookie expire time
      //res.cookie()-> inbuilt
      //passing jwt token name,token,jwt token expiry
      res.cookie('jwt', token, {
        expires: new Date(Date.now() + 600000),
        httpOnly: true,
      });

      //now we need to save the above data in mongo database
      const registered = await registerEmployee.save();
      console.log('the page part' + registered);

      //after completion of above process, displaying the index file
      res.status(201).render('index');
    } else {
      res.send('password are not matching');
    }
  } catch (error) {
    console.log('the error part page');
    res.status(400).send(error);
  }
});

//logic check
app.post('/login', async (req, res) => {
  try {
    //here req.body.email(email->name attribute given in form)
    //here req.body.password(password->name attribute given in form)
    const email = req.body.email;
    const password = req.body.password;

    //checking whether the above email and password is exist or not in our database
    //comparing the provided email with existing email
    const useremail = await Register.findOne({ email: email });

    //comparing the user's given password with the already stored password in the database.
    //useremail contains all the data in object form.hence we are matching the useremail's bcrypt password with the provided transform bcrypt password
    const isMatch = await bcrypt.compare(password, useremail.password);

    console.log('password match:' + isMatch); //true or false. if the isMatch returns true, give access to the user else throw an error

    //adding one middleware--> generating a temporary token whenever user tried to login
    const token = await useremail.generateAuthToken();
    console.log('the token part is' + token);

    //if user logged-in. generate a temporary jwt token and store it on the browser using cookie
    res.cookie('jwt', token, {
      expires: new Date(Date.now() + 600000),
      httpOnly: true,
    });

    if (isMatch) {
      res.status(201).render('index');
    } else {
      res.send('Password are not matching');
    }
  } catch (error) {
    res.status(400).send("Email doesn't Exist");
  }
});

//HASHING...
/*
const securePassword = async (password) => {
  //setting the password using hash
  const passwordHash = await bcrypt.hash(password, 10);
  console.log(passwordHash);

  //matching the passwords using previous hash convert password(passwordHash) with the user entered passing password(password) during login
  const passwordMatch = await bcrypt.compare(password, passwordHash);
  console.log(passwordMatch);
};

securePassword('Mishra@123');
*/

//JSON_WEB_TOKEN...
/*
const createToken = async () => {
  //generating a temporary token for user
  //creating a signature for user so that next time whenever user try to login the website will first verify the user using signature verification
  //.sign returns promise and it takes 3 parameters
  //1)payload: user's id from database
  //2)secret key: minimum 32 characters
  //3)optional->token expiry time..eg whenever using a bank application app some times you get redirected to login page and you need to re-login again that is due to the token expiry
  const token = await jwt.sign(
    { _id: '6455f6bbf48b5f7df8383eb1' },
    'mynameisajaykumarmishrajiyoutuber',
    { expiresIn: '10 seconds' }
  );
  console.log(token); //After token generation, the token consists of 3-parts : header(algorithm and token type),payload(user's id from the database),user's signature

  //verifying the temporary token with the secret key  whenever a existing user try to do some stuff on the website.
  // .verify() will return promise and it takes 2 parameters
  //1) whenever a existing user's send request to website : token
  //2) already stored token(out of three parts it takes user's id -> part present in database) in database
  const userVer = await jwt.verify(token, 'mynameisajaykumarmishrajiyoutuber');
  console.log(userVer); //returns a valid id
};

createToken();
*/
app.listen(port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`server is running successfully at port ${port}`);
});
