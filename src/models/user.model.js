import mongoose, { Schema } from "mongoose";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,  // it is to enable for searching 
    },
    email: {
      type: String,
      unique: true,
      lowerCase: true,
      trim: true,
      required: true,

    },
    fullname: {
      type: String,
      require: true,
      trim: true,
      index: true

    },
    avatar: {
      type: String,
      required: true
    },
    coverImage: {
      type: String,

    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    password: {
      type: String,
      required: [true, 'Password is required']

    },
    refreshToken: {
      type: String
    }

  }, { timestamps: true })



// It Tells db do this thing before saving the password , if password is not modified it will directly run the next() function , if password is changed it will run the bcrypt.hash(this.password, 10)then all the work 
userSchema.pre("save", async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10)
  next()
})


// it is the custome method incerted in userschema  checkeing the previous password with encripted password 
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)
}


// Another custome method used to generated jwt accesstoken with id, email, username, fullname
userSchema.methods.generateAccessToken = function () {
  return Jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}


// This custome method is used to generate jwt refresh token
userSchema.methods.generateRefereshToken = function () {
  return Jwt.sign(
    {
      _id: this._id,

    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}



export const User = mongoose.model("User", userSchema)