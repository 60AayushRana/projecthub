const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const logActivity = require('../utils/activityLogger');

// Helper: check project access
const getProject = async (id, userId, role) => {
  const project = await Project.findById(id).populate('owner members', 'name email avatar role');
  if (!project) return null;
  const isMember =
    role === 'admin' ||
    project.owner._id.toString() === userId.toString() ||
    project.members.some((m) => m._id.toString() === userId.toString());
  return isMember ? project : false;
};

// GET /api/projects
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;
    const filter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Project.countDocuments(filter);

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (p) => {
        const tasks = await Task.find({ project: p._id });
        const completed = tasks.filter((t) => t.status === 'completed').length;
        const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
        return { ...p.toJSON(), taskCount: tasks.length, completedTasks: completed, progress };
      })
    );

    res.json({ projects: projectsWithCounts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects
router.post(
  '/',
  protect,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Project name required'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description, deadline, priority, members, tags } = req.body;
      const project = await Project.create({
        name, description, deadline, priority, tags,
        owner: req.user._id,
        members: members || [],
      });
      await project.populate('owner members', 'name email avatar');
      await logActivity({ user: req.user._id, action: 'created project', entity: 'project', entityId: project._id, entityName: project.name });
      res.status(201).json(project);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/projects/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await getProject(req.params.id, req.user._id, req.user.role);
    if (!project) return res.status(404).json({ message: 'Project not found or access denied' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('owner members', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await logActivity({ user: req.user._id, action: 'updated project', entity: 'project', entityId: project._id, entityName: project.name });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Task.deleteMany({ project: req.params.id });
    await logActivity({ user: req.user._id, action: 'deleted project', entity: 'project', entityId: project._id, entityName: project.name });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/:id/members
router.post('/:id/members', protect, adminOnly, async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.members.includes(userId)) project.members.push(userId);
    await project.save();
    await project.populate('owner members', 'name email avatar');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', protect, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.members = project.members.filter((m) => m.toString() !== req.params.userId);
    await project.save();
    await project.populate('owner members', 'name email avatar');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
