const Activity = require('../models/Activity');

const logActivity = async ({ user, action, entity, entityId, entityName, project }) => {
  try {
    await Activity.create({ user, action, entity, entityId, entityName, project });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

module.exports = logActivity;
