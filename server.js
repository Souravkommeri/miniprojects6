require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const sportsSecretaryRoutes = require('./routes/sportsSecretary');
const sportsInchargeRoutes = require('./routes/sportsIncharge');
const officeStaffRoutes = require('./routes/officeStaff');
const principalRoutes = require('./routes/principal');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'sports_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);
app.use('/api', sportsSecretaryRoutes);
app.use('/api', sportsInchargeRoutes);
app.use('/api', officeStaffRoutes);
app.use('/api', principalRoutes);

app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    const { DASHBOARD_ROUTES } = require('./middleware/auth');
    const redirect = DASHBOARD_ROUTES[req.session.role] || '/';
    return res.redirect(redirect);
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sports Management System running on http://localhost:${PORT}`);
});
