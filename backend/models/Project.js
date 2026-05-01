const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    deadline: { type: Date },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['active', 'completed', 'on-hold'], default: 'active' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Auto-calculate progress from tasks
projectSchema.methods.calculateProgress = async function () {
  const Task = mongoose.model('Task');
  const tasks = await Task.find({ project: this._id });
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((done / tasks.length) * 100);
};

module.exports = mongoose.model('Project', projectSchema);
