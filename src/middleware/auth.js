const jwt = require('jsonwebtoken');

//to get the data---> module/collection
const Register = require('../models/register');

const auth = async (req, res, next) => {
  try {
    //logic to get the logged-in token from cookie
    const token = req.cookies.jwt;

    //logic to verify the provided token with database existing token
    const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
    console.log(verifyUser); //this will display a _id which belongs to the temporary provided token in the database

    //to get the current user data --> we can fetch it with the help of temporary user's provided token _id.
    const user = await Register.findOne({ _id: verifyUser._id });
    //console.log(user); //this will give me all the information of the user

    //fetching the above user and generated token
    req.token = token;
    req.user = user;

    //with the help of next it will render the page otherwise provided in app.js
    next();
  } catch (error) {
    console.log('your token is not a valid one');
    res.status(401).send(error);
  }
};

module.exports = auth;
