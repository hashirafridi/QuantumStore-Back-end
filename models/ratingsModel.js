import mongoose from 'mongoose';
import Game from './gameModel.js';

const ratingSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1.0,
      max: 5.0,
    },
    review: {
      type: String,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'Rating must belong to a game'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'Rating must belong to a user'],
    },
  },
  { timestamps: true }
);
// Function to calculate avg and quantity
ratingSchema.statics.calcAverageRatings = async function (gameId) {
  const stats = await this.aggregate([
    { $match: { game: gameId } },
    {
      $group: {
        _id: '$game',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    const avgRating = stats[0].avgRating;
    await Game.findByIdAndUpdate(gameId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: avgRating && !isNaN(avgRating) ? Math.round(avgRating * 100) / 100 : 4.5,
    });
  } else {
    await Game.findByIdAndUpdate(gameId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// After save rating
ratingSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.game);
});

// After findOneAndUpdate, findOneAndDelete
ratingSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.game);
  }
});

ratingSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.game);
  }
});

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;
