import Rating from '../models/ratingsModel.js';
import catchAsync from '../utils/catchAsync.js';
import sendResponse from '../utils/sendResponse.js';
import User from '../models/userModel.js'; 
export const setGameUserIds = catchAsync(async (req, res, next) => {
    if (!req.body.game) req.body.game = req.params.gameId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
  });
  
export const createRating = catchAsync(async (req, res, next) => {
  const newRating = await Rating.create({
    rating: req.body.rating,
    review: req.body.review,
    user: req.user.id,
    game: req.params.gameId || req.body.game,
  });

  sendResponse('success', res, newRating, 'Rating submitted successfully!');
});

export const getAllReviews = catchAsync(async (req, res, next) => {
  const gameId = req.params.gameId;
  const reviews = await Rating.find({ game: gameId })
    .populate({
      path: 'user',
      select: 'name photo',
    })
    .select('review rating');

  sendResponse('success', res, reviews, 'Reviews fetched successfully!');
});