
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import sendResponse from '../utils/sendResponse.js';
import User from '../models/userModel.js';

//// get me
export const getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    sendResponse('success', res, user, 'User profile fetched successfully!');
  });
  
//// update me 
export const updateMe = catchAsync(async(req,res,next)=>{
    const allowedFields = [
      'name',
      'badge',
      'favoriteGenre',
      'contentCreator',
      'skillLevel',
      'photo'
    ];

    const updates = {};
    for (let field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
  const user = await User.findById(req.user.id);
    const updatedUser = await User.findByIdAndUpdate(
       user,
      { $set: updates },
      { new: true}
    );
    sendResponse('success', res, updatedUser, 'User updated successfully!');
})


  //// getAllUSers 
  export const getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find().select('name email role');
  
    if (!users || users.length === 0) {
      return next(new AppError('No users found', 404));
    }
  
    sendResponse('success', res, users, 'Users fetched successfully!');
  });


  export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  sendResponse('success', res, null, 'User deleted successfully!');
});
