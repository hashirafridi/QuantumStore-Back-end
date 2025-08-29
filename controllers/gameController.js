
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Game from '../models/gameModel.js';
import sendResponse from '../utils/sendResponse.js';
import Requirement from '../models/reqModel.js';
import path from 'path';
import url from 'url';
//// get all games
export const getAllGames = catchAsync(async (req, res, next) => {
  // Fetching all games
  const games = await Game.find();
  // If no games are found, return an error
  if (!games || games.length === 0) {
    return next(new AppError('No games found!', 404));
  }
  const filteredGames = games.map(game => ({
    id:game._id,
    name: game.name,
    genre: game.genre,
    ratingsAverage: game.ratingsAverage,
    downloads: game.downloads,
    profilePicture: game.profilePicture
  }));
  // Send success response with games data
  sendResponse('success', res, filteredGames);
});

export const createGame = catchAsync(async (req, res, next) => {
  const allowedFields = [
    'name',
    'developers',
    'ratings',
    'description',
    'video',
    'genre',
    'minimumReq',
    'recommendedReq',
    'featured',
    'platform',
    'releaseYear'
  ];

  const filteredData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      filteredData[field] = req.body[field];
    }
  });
  // Parse genre if it's a stringified array
if (filteredData.genre && typeof filteredData.genre === 'string') {
  try {
    filteredData.genre = JSON.parse(filteredData.genre);
  } catch (e) {
    // fallback: wrap as array if not a valid JSON array
    filteredData.genre = [filteredData.genre];
  }
}

  if (!filteredData.minimumReq || !filteredData.recommendedReq) {
    return next(new AppError('Minimum and Recommended requirements are mandatory', 400));
  }

  const BASE_URL = `${req.protocol}://${req.get('host')}`;

  // Handle profile picture upload and store its path in the database
  if (req.files?.profilePicture?.[0]) {
    const file = req.files.profilePicture[0];
    filteredData.profilePicture = `${BASE_URL}/assets/images/${file.filename}`;
  }

  // Handle gameplay screenshots upload and store their paths in the database
  if (req.files?.pictures?.length > 0) {
    filteredData.pictures = req.files.pictures.map(file => 
      `${BASE_URL}/assets/images/${file.filename}`
    );
  }

  // Handle game file upload (e.g., .zip file) and store its path in the database
  if (req.files?.gameFile?.[0]) {
    const file = req.files.gameFile[0];
    filteredData.filesPath = `${BASE_URL}/assets/files/${file.filename}`; // Storing game file path
  }

  // Create new game entry in the database with all the filtered data
  const newGame = await Game.create(filteredData);

  // Respond with success message and the new game details
  sendResponse('success', res, newGame, 'Game created successfully!');
});

//// download game
export const downloadGame = catchAsync(async (req, res, next) => {
  const gameId = req.params.gameId;

  // 1) Find game by id
  const game = await Game.findById(gameId);
  if (!game) {
    return next(new AppError('No game found with that ID', 404));
  }

  // 2) Extract file URL and parse filename
  const fileUrl = game.filesPath;
  if (!fileUrl) {
    return next(new AppError('Game file not available for download', 404));
  }

  // Get file name from URL (assuming last part after last slash)
  const fileName = fileUrl.split('/').pop();

  // 3) Construct local file path
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const fileDirectory = path.join(__dirname, '../assets/files');
  const filePath = path.join(fileDirectory, fileName);
  // 4) Send the file to client to download
  res.download(filePath, fileName, (err) => {
    if (err) {
      return next(new AppError('Error downloading the file', 500));
    }
  });
});


//// for delete game
export const deleteGame = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const game = await Game.findByIdAndDelete(id);
  if (!game) {
    return next(new AppError('No game found with that ID', 404));
  }
  sendResponse('success', res, null, 'Game deleted successfully!');
});
//// get a game with all details
export const getGame = catchAsync(async (req, res, next) => {
  const game = await Game.findById(req.params.id)
    .populate('minimumReq')
    .populate('recommendedReq')
    .populate('reviews'); // populating virtual field

  if (!game) {
    return next(new AppError('No game found with that ID', 404));
  }

  sendResponse('success', res, game, 'Game fetched successfully!');
});
//// for update game
export const updateGame = catchAsync(async (req, res, next) => {
  const { id } = req.params;
 if (!id) {
    return next(new AppError('No game found with that ID', 404));
  }
  const allowedFields = [
    'name',
    'developers',
    'ratings',
    'downloads',
    'description',
    'video',
    'genre',
    'releaseYear',
    'minimumReq',
    'recommendedReq',
    'platform',
    'featured'
  ];

  const updatedData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updatedData[field] = req.body[field];
    }
  });

  const BASE_URL = `${req.protocol}://${req.get('host')}`;

  // Update profile picture (replace)
  if (req.files?.profilePicture?.[0]) {
    const file = req.files.profilePicture[0];
    updatedData.profilePicture = `${BASE_URL}/assets/images/${file.filename}`;
  }

  // Append new pictures to existing array
  if (req.files?.pictures?.length > 0) {
    const newPictures = req.files.pictures.map(file =>
      `${BASE_URL}/assets/images/${file.filename}`
    );

    // Push to pictures array separately
    await Game.findByIdAndUpdate(id, {
      $push: { pictures: { $each: newPictures } }
    });
  }

  // Update game file path (replace)
  if (req.files?.gameFile?.[0]) {
    const file = req.files.gameFile[0];
    updatedData.filesPath = `${BASE_URL}/assets/files/${file.filename}`;
  }

  // Update the rest of the fields
  const updatedGame = await Game.findByIdAndUpdate(id, updatedData, {
    new: true
  });

  if (!updatedGame) {
    return next(new AppError('some error while updating', 404));
  }

  sendResponse('success', res, updatedGame, 'Game updated successfully!');
});


//// for create a Requirement
export const createRequirement = catchAsync(async (req, res, next) => {
  const { name, cpu, gpu, ram, storage, os, directX } = req.body;
  // Basic validation
  if (!cpu || !gpu || !ram || !storage) {
    return next(new AppError('Please provide required fields: cpu, gpu, ram, storage.', 400));
  }
  const newRequirement = await Requirement.create({
    name,
    cpu,
    gpu,
    ram,
    storage,
    os,
    directX,
  });
  sendResponse('success', res, newRequirement, 'Requirement created successfully!');
});

