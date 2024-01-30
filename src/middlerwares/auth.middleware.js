import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import Jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // It finds  the token in the cookies or  header and verifies it 
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      throw new ApiError(401, "Unauthorized Request")
    }

    // We try to find the token that  matches with the one on the database
    const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    // Searches  for a user by its decodedToken id without password and refreshToken
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if (!user) {
      throw new ApiError(401, 'Invalid Access Token')
    }

    // we add a new object namely user and gives the access of user 
    req.user = user;
    // Now Execute the next()function  which means move to the next middleware function
    next()

  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access Token")
  }

})