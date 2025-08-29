import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import { promisify } from "util";
import crypto from "crypto";
import sendEmail from "../utils/emailSender.js"
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRE_DATE
  })
}

const createAndSentToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookiesOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  }

  if (process.env.NODE_ENV === "production") cookiesOptions.secure = true;
  //remove password from output
  user.password = undefined;
  res.cookie("jwt", token, cookiesOptions);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      theUser: user
    }
  });
}

export const signUp = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this email.' });
  }
  const newUser = await User.create({
    name: req.body.name,
    password: req.body.password,
    role: req.body.role,
    email,
    confirmPassword: req.body.confirmPassword
  });
  createAndSentToken(newUser, 201, res)
});
//// login and create token
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //// check if email and pass exist
  if (!email || !password) return next(new AppError("Please Provide Password and Email", 400));
  //// check if email and pass correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Pass OR Email is incorrect", 401));
  }
  //// if everything ok sent token to client
  createAndSentToken(user, 201, res);
});
//// for logout 
export const logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() - 1000), // expired in the past
    httpOnly: true,
    secure: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'You have been logged out successfully.',
  });
});

///// protect middleware for unauthorize login
export const protect = catchAsync(async (req, res, next) => {
  //// getiing token and chk if its there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError("You are not logged in, Please login to access ", 401));
  }
  //// verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //// chk if user still exists 
  const currUser = await User.findById(decoded.id);
  if (!currUser) {
    return next(new AppError("the USer belonging to this token does not exist , please sign up again", 401));
  }
  //// chk if password changed after token been issued
  if (currUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("user recently changed the password, please login again ", 401));
  }
  //// grant access to protected route
  req.user = currUser;
  next();
});

//// restrict some routes for only admins
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  }
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  //// chk for user for change pass
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }

  //// generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // always 6 digits
  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000; // valid for 5 minutes
  await user.save({ validateBeforeSave: false });
  //// send OTP to user's email
  const message = `Your password reset OTP is: ${otp}.\nIt is valid for 5 minutes.\nIf you didn't request a password reset, please ignore this email.`;

  try {
    // await sendEmail({
    //   from: {
    //     name: 'Hashir Afridi',
    //     address: 'hashirafridi484848@gmail.com',
    //   },
    //   email: user.email,
    //   subject: "Your password reset OTP (valid for 10 minutes)",
    //   message
    // });

    res.status(200).json({
      status: "success",
      message: `OTP ${otp} sent to the email`
    });
  } catch (err) {
    console.log(err);
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("There was an error sending the email. Please try again later", 500));
  }
});

export const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  // 1) Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }

  // 2) Check if OTP matches
  if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
    return next(new AppError("Invalid or expired OTP", 400));
  }
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "OTP verified successfully"
  });
});


//// reseting password with help of token that recive from mail
export const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, password, confirmPassword } = req.body;
  //// 1) Get user based on email and OTP
  const user = await User.findOne({
    email,
    otp
  });
  //// 2) If no user or OTP expired/invalid
  if (!user) {
    return next(new AppError("OTP is invalid or has expired", 400));
  }
  //// 3) Set the new password
  user.password = password;
  user.confirmPassword = confirmPassword;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();
  //// 4) Log the user in, send JWT
  createAndSentToken(user, 201, res);
});


//// update password if you want to OR simple update pass method
export const updatePassword = catchAsync(async (req, res, next) => {
  //// 1) get user from collection
  const user = await User.findById(req.user.id).select("+password");
  //// 2) check if POSTED password is correct
  if (await user.correctPassword(req.body.password, user.password)) {
    user.password = req.body.newPassword
    user.confirmPassword = req.body.newPassword;
  } else {
    next(new AppError("Your password is wrong , Please try again", 401));
  }
  //// 3) if so update the password
  await user.save();
  //// 4) Log user in and sent the JWT
  createAndSentToken(user, 201, res);
});
//// update roles :> only admin can do this
export const assignRole = catchAsync(async (req, res, next) => {
  const { id } = req.params; // Get id from URL parameters
  const { role } = req.body;

  // Validate input
  if (!role) {
    return next(new AppError("Role is required", 400));
  }
  // Find the user by id
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("User does not exist with this id", 404));
  }

  // Check if user already has the role
  if (user.role === role) {
    return next(new AppError("User already has this role", 409));
  }

  // Update role    
  user.role = role;
  await user.save({ validateBeforeSave: false });

  // Send response with token
  createAndSentToken(user, 201, res);
});