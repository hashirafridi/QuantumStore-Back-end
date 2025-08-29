import mongoose, { Schema } from 'mongoose';
import validator from 'validator';  // Import the entire module
import bcrypt from 'bcryptjs';
const { isEmail } = validator;  // Destructure the `isEmail` function from the validator object
import crypto from "crypto";
import { type } from 'os';
const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "a user must have a name"],
  },
  email: {
    type: String,
    required: [true, "a user must have email"],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [isEmail, "please provide a valid email"]
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  badge: {
    type: String,
    enum: ['Top Contributor', "Explorer"],
    default: "Explorer",
  },
  favoriteGenre: {
    type: String,
    default: "Action"
  },
  contentCreator: {
    type: String,
    default: "No",
  },
  skillLevel: {
    type: String,
    default: "Casual"
  },
  photo: {
    type: String,
  },
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  password: {
    type: String,
    required: [true, "Type your password"],
    minLength: [8, "length should larger then 8 Chars"],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please Confirm your password"],
    validate: {
      validator: function (el) {
        return this.password === el;
      },
      message: "Passwords are not the same",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  library: [
    {
      game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
      },
      dateAdded: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['Downloaded', 'Download'],
        default: 'Download',
      },
    },
  ],
}, {
  tojson: { virtuals: true },
  toObject: { virtuals: true }

});
//// decrypt pass
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

//// updating passwordChangedAt property
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 2000;
  next();
});

///// chk pass if correct 
userSchema.methods.correctPassword = async function (candidatePass, userPass) {
  return await bcrypt.compare(candidatePass, userPass);
};

//// chk if password changed after token been issued
userSchema.methods.changedPasswordAfter = function (jwtTimeStanp) {
  if (this.passwordChangedAt) {
    const parsedPCHA = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return parsedPCHA > jwtTimeStanp;
  }
  //// false means not changed
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32)?.toString("hex");
  this.passwordResetToken = crypto.createHash("sha256")?.update(resetToken)?.digest("hex");
  this.PasswordResetDate = Date.now() + 10 * 60 * 1000;  //.. +10 minutes
  return resetToken;
};

//// find only where active is true "that is":acc is not deactivated
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//// for showing top-contributer badge
userSchema.pre('save', function (next) {
  if (this.downloads >= 10) {
    this.badge = 'Top Contributor';
  } else {
    this.badge = null;
  }
  next();
});

const User = mongoose.model("user", userSchema);
export default User;