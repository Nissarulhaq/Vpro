import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (userId) => {

  try {

    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefereshToken()


    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  //Get user details from frontend/postman
  //validation-Not empty
  //  check if user already exists  :username, email
  //  check for images  check for avatar 
  // upload to cloudnary,
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response(res) error or success msg


  const { fullName, email, username, password } = req.body
  // console.log('email', email);

  // if (fullName === "") {
  //   throw new ApiError("Please provide your Full Name", 400)
  // }


  // Validation of all the fields 
  // trim()is a string method that removes the whitespaces from string and returns new string without whitespaces
  // console.log(req.body)
  if ([fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }

  // Check for existed user 
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "User with email ro username already exists")
  }

  // console.log(req.files)
  // For uploading avatar and coverimage from cloudinary using localpath and cludinary
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required ")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }


  // Saving Data in Database using create method 
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  // We dont send password and refreshToken to user in response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Successfully !!")
  )

})

const loginUser = asyncHandler(async (req, res) => {

  //get data from req.body
  // username or email
  // check credientials 
  // password check
  //  generate token  like access and refresh token 
  //  send cookies 
  //   send response

  const { email, username, password } = req.body

  if (!username && !email) {
    throw new ApiError(400, "Please provide username or email")
  }

  //  Find user by email or username using findone  method of mongoose 
  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(404, "user does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Credientials ")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  // Store the tokens in cookie

  // it will be modified only by server 
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged in Successfully "
      )

    )


})

const logoutUser = asyncHandler(async (req, res) => {

  // findByIdAndUpdate is the function  which finds with id and updates document in database

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    // The { new: true } option ensures that the updated document is returned after the update operation.
    {
      new: true
    }
    // By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true, findOneAndUpdate() will instead give you the object after update was applied.
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))


})

const refreshAcessToken = asyncHandler(async (req, res) => {

  const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incommingRefreshToken) {
    throw new ErrorAuth(401, "unauthorized Request")
  }

  try {
    const decodedToken = Jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ErrorAuth(401, "Invalid refresh token")
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is not matched ")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token Refreshed Successfully "
        )
      )

  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")

  }

})



export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcessToken,
}