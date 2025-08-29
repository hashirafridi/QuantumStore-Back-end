// controllers/libraryController.js
import catchAsync from '../utils/catchAsync.js';
import User from '../models/userModel.js';
import Game from '../models/gameModel.js';
import AppError from '../utils/appError.js';
import sendResponse from '../utils/sendResponse.js';
import mongoose from 'mongoose';
//// add game to the library
export const addToLibrary = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const gameId = req.params.gameId || req.body.gameId;

  // Check if the game exists
  const game = await Game.findById(gameId);
  if (!game) {
    return next(new AppError('No game found with that ID', 404));
  }

  // Check if the game is already in the user's library
  const user = await User.findById(userId);
  const isAlreadyInLibrary = user.library.some(
    (entry) => entry.game.toString() === gameId.toString()
  );

  if (isAlreadyInLibrary) {
    return next(new AppError('Game already exists in your library', 400));
  }

  // Add the game to the library
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $addToSet: {
        library: {
          game: gameId,
        },
      },
    },
    { new: true }
  ).populate({
    path: 'library.game',
    select: 'name developers profilePicture', // only these fields
  });

  sendResponse('success', res, updatedUser, 'Game added to library successfully!');
});


//// mark as downloaded
export const markAsDownloaded = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
  const gameId = req.params.gameId;

  if (!mongoose.Types.ObjectId.isValid(gameId)) {
    return next(new AppError('Invalid game ID', 400));
  }

  // 1. Update user's library entry to "downloaded"
  const user = await User.findOneAndUpdate(
    { _id: userId, 'library.game': gameId },
    {
      $set: { 'library.$.status': 'Downloaded' }
    },
    { new: true }
  );

  if (!user) {
    return next(new AppError('Game not found in user library', 404));
  }

  // 2. Increment the downloads count on the Game model
  await Game.findByIdAndUpdate(gameId, { $inc: { downloads: 1 } });

  sendResponse('success', res, null, 'Game downloaded successfully!');
  });
  
  // Get all games in library
export const getLibrary = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId).populate({
    path: 'library.game',
    select: 'name developers profilePicture'
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }
  // Map to extract desired fields
  const library = user.library.map(entry => ({
    id:entry.game?._id,
    name: entry.game?.name,
    developers: entry.game?.developers,
    profilePicture: entry.game?.profilePicture,
    dateAdded: entry.dateAdded,
    status: entry.status
  }));
  sendResponse('success', res, library, 'Library fetched successfully!');
});

// remove a game from library

export const removeFromLibrary = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const gameId = req.params.id || req.body.id;

  if (!mongoose.Types.ObjectId.isValid(gameId)) {
    return next(new AppError('Invalid game ID', 400));
  }

  const gameObjectId = new mongoose.Types.ObjectId(gameId);

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $pull: {
        library: { game: gameObjectId }
      }
    },
    { new: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if the game still exists in the updated user's library
  const gameStillExists = user.library.some(entry => entry.game.toString() === gameId);

  if (gameStillExists) {
    return next(new AppError('Game not found in user library', 404));
  }

  sendResponse('success', res, user, 'Game removed from library successfully!');
});


export const downloadGame = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const gameId = req.params.gameId;

  if (!mongoose.Types.ObjectId.isValid(gameId)) {
    return next(new AppError('Invalid game ID', 400));
  }

  // 1. Update user's library entry to "downloaded"
  const user = await User.findOneAndUpdate(
    { _id: userId, 'library.game': gameId },
    {
      $set: { 'library.$.status': 'Downloaded' }
    },
    { new: true }
  );

  if (!user) {
    return next(new AppError('Game not found in user library', 404));
  }

  // 2. Increment the downloads count on the Game model
  await Game.findByIdAndUpdate(gameId, { $inc: { downloads: 1 } });

  sendResponse('success', res, null, 'Game downloaded successfully!');
});
