const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

//creating a new database and establishing connection between mongoDb and backend
//here 127.0.0.1 -> is known as localhost
mongoose
  .connect(`mongodb://127.0.0.1:27017/employeeRegistration`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(
      `Connection between mongoDb and Backend has been successfully established and a new database named as employeeRegistration is created `
    );
  })
  .catch((err) => {
    console.log(`Unable to connect mongoDb`, err);
  });
