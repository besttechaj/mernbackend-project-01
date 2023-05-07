const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//defining schema
const employeeSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
    unique: true,
  },
  age: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmpassword: {
    type: String,
    required: true,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

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
//whenever we need to call a function through instance we have to use instance.methods."method define"
employeeSchema.methods.generateAuthToken = async function () {
  try {
    //generating a temporary token for every new registration using their _id with the help of this keyword because this refers to the current object..
    console.log('the new registered user id is' + this._id);

    //passing the string id value to token because we are storing the token as a string in out database
    //.env file--> process.env.SECRET_KEY in the form of objects hence there is no need to add quotes("")--> {SECRET_KEY='confidential_data'}
    const token = jwt.sign(
      { _id: this._id.toString() },
      process.env.SECRET_KEY
    );
    console.log(token);

    //adding the generated temporary token to new user field in the database.

    this.tokens = this.tokens.concat({ token: token });
    //to save inside db
    await this.save();

    //since this is a function hence we need to return token
    return token;
  } catch (error) {
    console.log('the error part is', +error);
  }
};

//Password hashing logic

//we have one method inside schema which is act as a middleware called as .pre() method, before storing the data if we want to manipulate the data for some reason eg. hashing of new User's password before saving it inside database.
// .pre() -> takes two parameter one is which function to be call after  performing the middleware and the second parameter is the middleware function itself. So in middleware function we need to pass next() to call the .save() method after the completion of middleware process.
employeeSchema.pre('save', async function (next) {
  //we want to do the below operation for password only if someone is registering for first time or updating its current password with new password hence we are using if(){//logic}...
  if (this.isModified('password')) {
    //here this keyword refers to the current object which contains all the properties of current object

    this.password = await bcrypt.hash(this.password, 10);
    this.confirmpassword = await bcrypt.hash(this.password, 10);

    // //to remove the confirmPassword field inside database
    // this.confirmpassword = undefined;
  }

  next();
});

//now we need to create a collection/Model

const Register = new mongoose.model('Register', employeeSchema);

module.exports = Register;
