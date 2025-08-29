
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Game from '../models/gameModel.js';
import sendResponse from '../utils/sendResponse.js';
import si from 'systeminformation'; // Import the systeminformation library

// this is experimental maybe it chnages in the future or not . give warnings so i comment it
// import hardwareScores from '../data/hardwareScores.json' assert { type: "json" };   // you can direct like this
import fs from 'fs';
const hardwareScores = JSON.parse(
  fs.readFileSync(new URL('../data/hardwareScores.json', import.meta.url))
);

//////// GET RECOMMEND GAMES AI
// Load hardware scores JSON once
export const recommendGames = catchAsync(async (req, res, next) => {
  const { cpu, gpu, ram, storage, os } = req.body;

  // Validate if provided cpu/gpu exists in score list
  const cpuScore = hardwareScores.cpu[cpu];
  const gpuScore = hardwareScores.gpu[gpu];

  if (!cpuScore || !gpuScore) {
    return next(
      new AppError('Unsupported CPU or GPU provided for recommendation.', 400)
    );
  }
  // Fetch all games with their minimum requirements populated
  const games = await Game.find().populate('minimumReq');

  const recommendedGames = games.filter((game) => {
    const minReq = game.minimumReq;
    if (!minReq) return false;

    const minCpuScore = hardwareScores.cpu[minReq.cpu];
    const minGpuScore = hardwareScores.gpu[minReq.gpu];
    // If game's CPU/GPU not in scores list — skip it
    if (!minCpuScore || !minGpuScore) return false;

    // Now compare everything
    return (
      cpuScore >= minCpuScore &&
      gpuScore >= minGpuScore &&
      ram >= minReq.ram &&
      storage >= minReq.storage
    );
  });

  // Map essential details
  const finalList = recommendedGames.map((game) => ({
    id: game.id,
    name: game.name,
    genre: game.genre,
    ratingsAverage: game.ratingsAverage,
    profilePicture: game.profilePicture,
  }));

  // Limit to top 5 based on rating + downloads
  const topRecommended = finalList
    .sort((a, b) => {
      if (b.ratingsAverage !== a.ratingsAverage) {
        return b.ratingsAverage - a.ratingsAverage;
      }
      return b.downloads - a.downloads;
    })
    .slice(0, 18);
  sendResponse(
    'success',
    res,
    topRecommended,
    'Top recommended games based on your system specs!'
  );
});
  //// check game compatibility and suggest upgrades also
  export const checkGameCompatibility = catchAsync(async (req, res, next) => {
    const { gameId } = req.params;
    const { cpu, gpu, ram, storage } = req.body;
    const game = await Game.findById(gameId)
      .populate('minimumReq')
      .populate('recommendedReq');
  
    if (!game) {
      return next(new AppError('No game found with that ID', 404));
    }
  
    const minReq = game.minimumReq;
    const recReq = game.recommendedReq;
    // Lookup scores
    const userCpuScore = hardwareScores.cpu[cpu] || 0;
    const userGpuScore = hardwareScores.gpu[gpu] || 0;
    const minCpuScore = hardwareScores.cpu[minReq.cpu] || 0;
    const minGpuScore = hardwareScores.gpu[minReq.gpu] || 0;
    const recCpuScore = hardwareScores.cpu[recReq.cpu] || 0;
    const recGpuScore = hardwareScores.gpu[recReq.gpu] || 0;
    let result;
    let suggestions = [];
  
    // Check Recommended
    if (
      ram >= recReq.ram &&
      storage >= recReq.storage &&
      userCpuScore >= recCpuScore &&
      userGpuScore >= recGpuScore
    ) {
      result = '✅ Your system meets the recommended requirements. Enjoy smooth gameplay!';
    }
    // Check Minimum
    else if (
      ram >= minReq.ram &&
      storage >= minReq.storage &&
      userCpuScore >= minCpuScore &&
      userGpuScore >= minGpuScore
    ) {
      result = '⚠️ You meet the minimum requirements. The game will run, but performance may vary.';
    }
    // Fails both — suggest upgrades
    else {
      result = '❌ Your system does not meet the minimum requirements for this game.';
  
      if (ram < minReq.ram) suggestions.push(`💾 Upgrade your RAM to at least ${minReq.ram} GB.`);
      if (storage < minReq.storage)
        suggestions.push(`🗂️ Ensure at least ${minReq.storage} GB free storage space.`);
      if (userCpuScore < minCpuScore)
        suggestions.push(`🖥️ Upgrade your CPU to at least equivalent of ${minReq.cpu}.`);
      if (userGpuScore < minGpuScore)
        suggestions.push(`🎮 Upgrade your GPU to at least equivalent of ${minReq.gpu}.`);
    }
  
    sendResponse(
      'success',
      res,
      {
        game: game.name,
        result,
        upgradeSuggestions: suggestions.length > 0 ? suggestions : undefined,
      },
      'Compatibility checked successfully!'
    );
  });
  
  
  // fecthing deatils of your pc
export const getSystemDetails = catchAsync(async (req, res, next) => {
  // Fetching the system details
  const cpu = await si.cpu();
  const memory = await si.mem();
  const os = await si.osInfo();
  const disk = await si.diskLayout();
  const graphics = await si.graphics(); // Fetching GPU details

  // If any error occurs while fetching the data
  if (!cpu || !memory || !os || !disk || !graphics) {
    return next(new AppError('Failed to fetch system details', 500));
  }

  // Convert memory to GB
  const totalMemoryGB = memory.total / (1024 ** 3); // Convert bytes to GB
  // Convert disk space to GB
 const totalDiskGB = disk.reduce((acc, d) => acc + d.size, 0) / (1024 ** 3); // Sum up disk sizes and convert to GB

  // Extract GPU information
  const gpu = graphics.controllers.map((gpuInfo) => ({
    vendor: gpuInfo.vendor,
    model: gpuInfo.model,
    vram: gpuInfo.vram, // VRAM in MB
  }));

  // Prepare the data to send in the response
  const systemDetails = {
    cpu: cpu.brand ,
    gpu : gpu[0].model,
    memory: +totalMemoryGB.toFixed(2), // Number without "GB"
    os: os.distro, // OS name
    disk: +totalDiskGB.toFixed(2), // Total disk space in GB
  };

  // Sending the response back to the client
  sendResponse('success', res, systemDetails, 'System details fetched successfully!');
});