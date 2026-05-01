const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. "created task", "updated project"
    entity: { type: String }, // "task" | "project" | "comment"
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityName: { type: String },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
