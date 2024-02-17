const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { error } = require("console");
const bcrypt = require("bcrypt");

const app = express();
const port = 2000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.use(express.static(path.join(__dirname, "public")));

// app.use("/style", express.static(path.join(__dirname, "style")));

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(
      "mongodb+srv://cynthiaujunwa4:ujunwa123456@ujucluster0.w0pkpjl.mongodb.net/?retryWrites=true&w=majority"
    );

    console.log(`Mongodb connected:${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    console.log("cannot connect to database");
    process.exit(1);
  }
};

connectDB();

//user Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "please enter a name"],
  },
  email: {
    type: String,
    require: [true, "please enter your email address"],
    unique: true,
  },
  contact: {
    type: String,
    require: [true, "please enter your contact"],
  },
  address: {
    type: String,
    require: [true, "please enter your address"],
  },
  password: {
    type: String,
    require: [true, "please enter your password"],
    minlength: [6, "minimum password length is 6 characters"],
  },
});
const User = new mongoose.model("User", userSchema);

module.exports = User;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/", async (req, res) => {
  const { name, email, contact, address, password, confirmpassword } = req.body;
  console.log(req.body);

  //check if password match
  if (password !== confirmpassword) {
    return res.status(400).send("password and confirm password do not match");
  }

  //check if email already exists
  const existingUser = await User.findOne({ email });

  try {
    if (existingUser) {
      throw new Error("User already exists");
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // create new user with hashed password
      const newUser = new User({
        name,
        email,
        contact,
        address,
        password: hashedPassword, //store the hashed password
      });

      await newUser.save(); //save the user to the database

      console.log("New user created:", newUser);
      res.send("User created successfully");
    }
  } catch (err) {
    console.log("Error creating user:", err);

    res.status(400).send(err.message); //send error message as response
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }); //find email

    if (!user) {
      return res.status(401).send("Invalid email or password"); //user not found
    }

    //compare passwords
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    //password match, login
    if (isPasswordMatch) {
      res.send("Login successful");
    } else {
      res.status(401).send("Invalid email or password"); //password don't match
    }
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).send("Error logging in");
  }
});

app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}`);
});
