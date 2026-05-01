const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');

// GET /api/dashboard/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const projectFilter = isAdmin
      ? {}
      : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const userProjects = await Project.find(projectFilter).select('_id');
    const projectIds = userProjects.map((p) => p._id);

    const taskFilter = isAdmin ? {} : { project: { $in: projectIds } };

    const [totalProjects, totalTasks, completedTasks, totalUsers] = await Promise.all([
      Project.countDocuments(projectFilter),
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'completed' }),
      isAdmin ? User.countDocuments() : Promise.resolve(null),
    ]);

    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      ...taskFilter,
      status: { $ne: 'completed' },
      dueDate: { $lt: now },
    });

    const activeTasks = await Task.countDocuments({ ...taskFilter, status: 'in-progress' });

    res.json({ totalProjects, totalTasks, completedTasks, overdueTasks, activeTasks, totalUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/project-progress
router.get('/project-progress', protect, async (req, res) => {
  try {
    const projectFilter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(projectFilter).select('name').limit(10);

    const data = await Promise.all(
      projects.map(async (p) => {
        const tasks = await Task.find({ project: p._id });
        const completed = tasks.filter((t) => t.status === 'completed').length;
        const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
        return { name: p.name, progress, total: tasks.length, completed };
      })
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/task-status
router.get('/task-status', protect, async (req, res) => {
  try {
    const projectFilter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };
    const userProjects = await Project.find(projectFilter).select('_id');
    const projectIds = userProjects.map((p) => p._id);
    const taskFilter = req.user.role === 'admin' ? {} : { project: { $in: projectIds } };

    const [todo, inProgress, completed] = await Promise.all([
      Task.countDocuments({ ...taskFilter, status: 'todo' }),
      Task.countDocuments({ ...taskFilter, status: 'in-progress' }),
      Task.countDocuments({ ...taskFilter, status: 'completed' }),
    ]);

    res.json([
      { name: 'To Do', value: todo },
      { name: 'In Progress', value: inProgress },
      { name: 'Completed', value: completed },
    ]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/user-performance
router.get('/user-performance', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: { $ne: null } })
      .populate('assignedTo', 'name')
      .select('status assignedTo');

    const map = {};
    tasks.forEach((t) => {
      if (!t.assignedTo) return;
      const id = t.assignedTo._id.toString();
      if (!map[id]) map[id] = { name: t.assignedTo.name, completed: 0, total: 0 };
      map[id].total++;
      if (t.status === 'completed') map[id].completed++;
    });

    res.json(Object.values(map).slice(0, 10));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/activity
router.get('/activity', protect, async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
