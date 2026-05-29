function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

const ROLES = {
  student: 'student',
  sports_secretary: 'sports_secretary',
  sports_incharge: 'sports_incharge',
  office_staff: 'office_staff',
  principal: 'principal'
};

const DASHBOARD_ROUTES = {
  [ROLES.student]: '/views/student.html',
  [ROLES.sports_secretary]: '/views/sports-secretary.html',
  [ROLES.sports_incharge]: '/views/sports-incharge.html',
  [ROLES.office_staff]: '/views/office-staff.html',
  [ROLES.principal]: '/views/principal.html'
};

module.exports = {
  requireAuth,
  requireRole,
  ROLES,
  DASHBOARD_ROUTES
};
