const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const logActivity = require('../utils/activityLogger');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: check task access
const canAccessTask = (task, user) => {
  if (user.role === 'admin') return true;
  return (
    task.createdBy?.toString() === user._id.toString() ||
    task.assignedTo?.toString() === user._id.toString()
  );
};

// GET /api/tasks?project=&status=&priority=&assignedTo=&overdue=
router.get('/', protect, async (req, res) => {
  try {
    const { project, status, priority, assignedTo, overdue, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };

    // For members, only show tasks in their projects
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      filter.project = filter.project ? filter.project : { $in: projectIds };
    }

    let tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (overdue === 'true') {
      tasks = tasks.filter((t) => t.isOverdue);
    }

    const total = await Task.countDocuments(filter);
    res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post(
  '/',
  protect,
  adminOnly,
  [body('title').trim().notEmpty().withMessage('Task title required'), body('project').notEmpty()],
  validate,
  async (req, res) => {
    try {
const { title, description, project, assignedTo, dueDate, priority, labels } = req.body;

// Fix: convert empty string to null for MongoDB ObjectId
const assignedToValue = assignedTo && assignedTo.trim() !== '' ? assignedTo : null;

const task = await Task.create({
  title, description, project,
  assignedTo: assignedToValue,  // ← use cleaned value
  dueDate, priority, labels,
  createdBy: req.user._id,
});
  
      await task.populate('assignedTo createdBy', 'name email avatar');
      await task.populate('project', 'name');
      await logActivity({ user: req.user._id, action: 'created task', entity: 'task', entityId: task._id, entityName: task.title, project });
      res.status(201).json(task);
    }
    catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/tasks/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo createdBy', 'name email avatar')
      .populate('project', 'name owner members');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!canAccessTask(task, req.user)) return res.status(403).json({ message: 'Access denied' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Members can only update status
   if (req.user.role !== 'admin') {
  // Allow if assigned to them OR they are a member of the project
  const project = await Project.findById(task.project);
  const isMember = project?.members?.some(
    m => m.toString() === req.user._id.toString()
  );
  const isAssigned = task.assignedTo?.toString() === req.user._id.toString();

  if (!isMember && !isAssigned) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const { status } = req.body;
  task.status = status || task.status;

    } else {
      Object.assign(task, req.body);
    }

    await task.save();
    await task.populate('assignedTo createdBy', 'name email avatar');
    await logActivity({ user: req.user._id, action: `updated task status to ${task.status}`, entity: 'task', entityId: task._id, entityName: task.title, project: task.project });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await logActivity({ user: req.user._id, action: 'deleted task', entity: 'task', entityId: task._id, entityName: task.title });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:id/attachments
router.post('/:id/attachments', protect, upload.single('file'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.attachments.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
    });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
