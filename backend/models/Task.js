const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' ,required:false, default:null},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed'],
      default: 'todo',
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    labels: [{ type: String }],
    dueDate: { type: Date },
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Virtual: isOverdue
taskSchema.virtual('isOverdue').get(function () {
  return this.dueDate && this.status !== 'completed' && new Date() > this.dueDate;
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
