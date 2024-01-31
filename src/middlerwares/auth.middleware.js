import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // It finds  the token in the cookies or  header and verifies it 
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      throw new ApiError(401, "Unauthorized Request")
    }


    // If a token is found, it attempts to verify the token using a secret key 
    const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)


    // It then attempts to find a user in the database based on the user ID extracted from the decoded token.
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if (!user) {
      throw new ApiError(401, 'Invalid Access Token')
    }

    // we add a new object namely user and gives the access of user 
    // If a user is found, it attaches the user object to the request (req.user), excluding sensitive information like the password and refreshToken.
    req.user = user;
    // Now Execute the next()function  which means move to the next middleware function
    next()

  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access Token")
  }

})