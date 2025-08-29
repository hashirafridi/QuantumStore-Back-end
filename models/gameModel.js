// models/gameModel.js
import mongoose from 'mongoose';
import Requirement from './reqModel.js';

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A game must have a name'],
    trim: true,
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: 1.0,
    max: 5.0,
    set: val => parseFloat(val.toFixed(2)),
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  developers: {
    type: String,
  },
  ratings: {
    type: Number,
    min: [0, 'Rating must be at least 0.0'],
    max: [5, 'Rating must be at most 5.0'],
    default: 0,
  },
  downloads: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
  },
  video: {
    type: String,
  },
  profilePicture:{
    type:String,
  },
  filesPath:{
    type:String,
  },
  pictures: {
    type: [String],
  },
  minimumReq: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requirement',  // Reference to the Requirement model
  },
  recommendedReq: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requirement',  // Reference to the Requirement model
  },
  featured: {
    type: Boolean,
    default: false,
  },  
  platform: {
    type: String,
    required: [true, 'Please specify platform'],
    enum: ['mobile', 'console', 'pc'],
    default: 'pc'
  },
  genre: {
    type: [String],
  },
  releaseYear:{type:String},
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  });
// for reviews to populate easily 
gameSchema.virtual('reviews', {
  ref: 'Rating',      // Reference to Rating model
  foreignField: 'game',  // 'game' field in Rating model points to Game
  localField: '_id'   // _id in Game model is what we match in 'game' field in Rating model
});

// Virtual field to populate minimum and recommended requirements automatically
gameSchema.virtual('minReqDetails', {
    ref: 'Requirement',
    localField: 'minimumReq',
    foreignField: '_id',
    justOne: true,
  });
  gameSchema.virtual('recReqDetails', {
    ref: 'Requirement',
    localField: 'recommendedReq',
    foreignField: '_id',
    justOne: true,
  });
//   const game = await Game.findById(gameId)
//   .populate('minReqDetails') // populate virtual
//   .populate('recReqDetails'); // optional: populate recommended too

const Game = mongoose.model('Game', gameSchema);
export default Game;
