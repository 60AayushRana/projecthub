const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Comment = require('../models/Comment');
const logActivity = require('../utils/activityLogger');

// GET /api/comments?task=
router.get('/', protect, async (req, res) => {
  try {
    const { task } = req.query;
    const comments = await Comment.find({ task })
      .populate('author', 'name email avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/comments
router.post('/', protect, async (req, res) => {
  try {
    const { task, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });
    const comment = await Comment.create({ task, text, author: req.user._id });
    await comment.populate('author', 'name email avatar');
    await logActivity({ user: req.user._id, action: 'commented on task', entity: 'comment', entityId: comment._id, entityName: text.slice(0, 50) });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
