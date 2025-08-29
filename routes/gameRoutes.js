import { Router } from 'express';
import { protect } from '../controllers/authController.js'; 
import { getAllGames , createGame , deleteGame , updateGame , getGame , createRequirement , downloadGame } from '../controllers/gameController.js'; 
import {getTopDownloadedGames , getGamesByPlatform , getFeaturedGames , getMostPopularGames , getAllRequirements} from "../controllers/gamesFactoryController.js"
import { addToLibrary , markAsDownloaded , getLibrary , removeFromLibrary } from '../controllers/libraryController.js';
import { uploadGameAssets } from "../utils/upoad.js";
import { recommendGames , checkGameCompatibility , getSystemDetails} from "../controllers/AI_GameController.js";
import { searchGamesBySpecs , searchGames } from "../controllers/searchGameController.js"
const gameRouter = Router();

//// for admin controll
// Get all games
gameRouter.route("/getAllGames").get(getAllGames);
// get all req
gameRouter.route("/getAllRequirements").get(getAllRequirements);
// Create a new game
gameRouter.route("/createGame").post(
     uploadGameAssets ,        // fro games pics and files
       createGame             
    );
// download game
gameRouter.route("/downloadGame/:gameId").get(downloadGame);

// make a requirement createRequirement
gameRouter.route("/createRequirement").post(createRequirement);
// Delete a game by ID
gameRouter.route("/deleteGame/:id").delete(deleteGame);
// Update a game by ID
gameRouter.route("/updateGame/:id").patch(uploadGameAssets,updateGame);
// Get a single game by ID
gameRouter.route("/getGame/:id").get(getGame);


//// Mostly for users
// Get TOP downloads
gameRouter.route('/topDownloads').get(getTopDownloadedGames);
// get games via platform
gameRouter.route('/platform/:platform').get(getGamesByPlatform);
// get featured games
gameRouter.route('/featuredGames').get(getFeaturedGames);
// get most popular games
gameRouter.route('/mostPopularGames').get(getMostPopularGames);


//// library routes 
//add game in library
gameRouter.route('/addToLibrary/:gameId').post(protect,addToLibrary);
//mark as downloaded
gameRouter.route('/markDownloaded/:gameId').patch(protect,markAsDownloaded);
// get all games from library
gameRouter.route('/getLibraryGames/:id').get(protect,getLibrary);
// remove a game from library
gameRouter.route('/removeLibraryGame/:id').delete(protect,removeFromLibrary);

///// AI_GameController routes 
gameRouter.route('/recommendGames').post(recommendGames);
gameRouter.route('/checkGameCompatibility/:gameId').post(checkGameCompatibility);
gameRouter.route('/getSystemDetails').get(getSystemDetails);

//// For Search Controller
gameRouter.route('/searchGamesBySpecs').get(searchGamesBySpecs);
gameRouter.route('/search').get(searchGames);

export default gameRouter;
