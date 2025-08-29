import Game from '../models/gameModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import sendResponse from '../utils/sendResponse.js';
import Requirement from '../models/reqModel.js';

export const getTopDownloadedGames = catchAsync(async (req, res, next) => {
  const games = await Game.find()
    .sort({ downloads: -1 })
    .limit(10)
    .select('name developers profilePicture ratingsAverage downloads');
  if (!games || games.length === 0) {
    return next(new AppError('No games found', 404));
  }
  sendResponse('success', res, games, 'Top downloaded games fetched successfully!');
});

//// get games accord to platform
export const getGamesByPlatform = catchAsync(async (req, res, next) => {
    const { platform } = req.params;
    const games = await Game.find({ platform });
    if (!games.length) {
      return next(new AppError(`No games found for platform: ${platform}`, 404));
    }
    sendResponse('success', res, games, `Games for ${platform} fetched successfully!`);
  });
  
  //// get featured games
  export const getFeaturedGames = catchAsync(async (req, res, next) => {
    const games = await Game.find({ featured: true });
    if (!games.length) {
      return next(new AppError('No featured games found!', 404));
    }
    sendResponse('success', res, games, 'Featured games fetched successfully!');
  });

  //// get most popular games
  export const getMostPopularGames = catchAsync(async (req, res, next) => {
    const games = await Game.find()
      .sort({ ratingsAverage: -1, ratingsQuantity: -1 ,downloads:-1}) // sort by average rating first, then quantity
      .limit(8)
      .select('name profilePicture ratingsAverage developers downloads');
    sendResponse('success', res, games, 'Most popular games fetched successfully!');
  });
  //// Get all Recquirments
export const getAllRequirements = catchAsync(async (req, res, next) => {
  const requirements = await Requirement.find();
  if(!requirements){
    return next(new AppError('N0 REQ FOUND.', 404));
  }
  sendResponse('success', res, requirements, 'All requirements fetched successfully!');
});
