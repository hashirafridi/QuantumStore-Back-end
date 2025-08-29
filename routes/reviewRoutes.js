import { Router } from 'express';
import { protect } from '../controllers/authController.js'; 
import { createRating , setGameUserIds , getAllReviews } from '../controllers/reviewController.js'; 
const reviewRouter = Router();

reviewRouter.route("/:gameId/createReview").post( protect , setGameUserIds , createRating );
reviewRouter.route("/:gameId/getAllReviews").get( protect , setGameUserIds , getAllReviews );
  
export default reviewRouter;

