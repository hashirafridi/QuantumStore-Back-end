import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema({
  cpu: {
    type: String,
    required: true
  },
  gpu: {
    type: String,
    required: true
  },
  ram: {
    type: Number,
    required: true
  },
  storage: {
    type: Number,
    required: true
  },
  os: {
    type: String
  },
});

const Requirement = mongoose.model('Requirement', requirementSchema);
export default Requirement;

// const reqWithGames = await Requirement.findById(reqId).populate('games');
