
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Game from '../models/gameModel.js';

// this is experimental maybe it chnages in the future or not . give warnings so i comment it
// import hardwareScores from '../data/hardwareScores.json' assert { type: "json" };   // you can direct like this
import fs from 'fs';
const hardwareScores = JSON.parse(
  fs.readFileSync(new URL('../data/hardwareScores.json', import.meta.url))
);
//// search with user specs
export const searchGamesBySpecs = catchAsync(async (req, res, next) => {
  const { cpu, gpu, ram, storage, os } = req.body;
  const userCpuScore = hardwareScores.cpu[cpu];
  const userGpuScore = hardwareScores.gpu[gpu];
  if (!userCpuScore || !userGpuScore) {
    return next(new AppError('Unsupported CPU or GPU provided for search.', 400));
  }
  // Fetch all games with requirements populated
  const games = await Game.find()
    .populate('minimumReq')
    .populate('recommendedReq');

  const smoothGames = [];
  const playableGames = [];

  games.forEach((game) => {
    const minReq = game.minimumReq;
    const recReq = game.recommendedReq;

    if (!minReq) return; // skip if no requirements

    const minCpuScore = hardwareScores.cpu[minReq.cpu] || 0;
    const minGpuScore = hardwareScores.gpu[minReq.gpu] || 0;
    const recCpuScore = recReq ? hardwareScores.cpu[recReq.cpu] || 0 : 0;
    const recGpuScore = recReq ? hardwareScores.gpu[recReq.gpu] || 0 : 0;

    // Check Recommended compatibility
    const meetsRecommended =
      recReq &&
      ram >= recReq.ram &&
      storage >= recReq.storage &&
      os.toLowerCase() === recReq.os.toLowerCase() &&
      userCpuScore >= recCpuScore &&
      userGpuScore >= recGpuScore;

    if (meetsRecommended) {
      smoothGames.push(game);
      return;
    }

    // Check Minimum compatibility
    const meetsMinimum =
      ram >= minReq.ram &&
      storage >= minReq.storage &&
      os.toLowerCase() === minReq.os.toLowerCase() &&
      userCpuScore >= minCpuScore &&
      userGpuScore >= minGpuScore;

    if (meetsMinimum) {
      playableGames.push(game);
    }
  });

  // Combine — recommended first
  const combinedGames = [...smoothGames, ...playableGames].slice(0, 15);
  res.status(200).json({
    status: 'success',
    totalSmoothGames: smoothGames.length,
    totalPlayableGames: playableGames.length,
    data: {
      smoothGames: smoothGames.map((game) => ({
        name: game.name,
        developers: game.developers,
        ratingsAverage: game.ratingsAverage,
        platform: game.platform,
        downloads: game.downloads,
        profilePicture: game.profilePicture,
      })),
      playableGames: playableGames.map((game) => ({
        name: game.name,
        developers: game.developers,
        ratingsAverage: game.ratingsAverage,
        platform: game.platform,
        downloads: game.downloads,
        profilePicture: game.profilePicture,
      })),
    },
  });
});

//// simple search
export const searchGames = catchAsync(async (req, res, next) => {
    const { q, genre, platform, minRating, releaseYear } = req.query;
    const pipeline = [];
    // Text search if q is provided (using $regex)
    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
          ]
        }
      });
    }
    // Filters (genre, platform, rating, release year)
    const matchStage = {};
    // ✅ fixed genre filtering — case-insensitive & works with array
    if (genre) {
        matchStage.genre = {
          $elemMatch: { $regex: genre, $options: 'i' }
        };
      }
    if (platform) matchStage.platform = { $regex: platform, $options: 'i' };
    if (minRating) matchStage.ratingsAverage = { $gte: Number(minRating) };
    if (releaseYear) matchStage.releaseYear = Number(releaseYear);
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    // Limit results
    pipeline.push({ $limit: 24 });
    // Final projection
    pipeline.push({
      $project: {
        name: 1,
        developers: 1,
        genres: 1,
        ratingsAverage: 1,
        downloads: 1,
        releaseYear: 1,
        profilePicture: 1
      }
    });
    // Execute aggregation pipeline
    const games = await Game.aggregate(pipeline);
    res.status(200).json({
      status: 'success',
      totalResults: games.length,
      data: games
    });
  });
  
  