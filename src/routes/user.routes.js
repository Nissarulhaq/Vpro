import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlerwares/multer.middleware.js"
import { verifyJWT } from "../middlerwares/auth.middleware.js";

const router = Router()

router.route("/register").post(
  // this is middlerware inserted here 
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
)

router.route("/login").post(loginUser)


// secured routes
router.route("/logout").post(verifyJWT, logoutUser)


export default router