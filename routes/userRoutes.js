import { Router } from 'express';
import { protect , signUp , login, logout , forgotPassword , resetPassword , assignRole, updatePassword , verifyOtp} from '../controllers/authController.js'; 
import { getMe , getAllUsers , updateMe , deleteUser } from "../controllers/userController.js"
const userRouter = Router();

//// route for user auth
//  signUP and login , logout
userRouter.route("/signup").post(signUp);
userRouter.route("/login").post(login);
userRouter.route("/logout").post(logout);

userRouter.route("/forgotPassword").post(forgotPassword);
userRouter.route("/verifyOtp").post(verifyOtp);
userRouter.route("/updatePassword").post(protect,updatePassword);
userRouter.route("/resetPassword").patch(resetPassword);
userRouter.route("/role/:id").patch(assignRole);

//// route for users simple 
userRouter.route("/getMe").get(protect,getMe);
userRouter.route("/deleteUser/:id").delete(deleteUser);
userRouter.route("/updateMe").patch(protect,updateMe);
userRouter.route("/getAllUsers").get(getAllUsers);

export default userRouter;