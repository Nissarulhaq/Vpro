import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


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

export { registerUser }