# Sports Management System - College of Engineering Adoor

A full-stack Sports Management System with role-based modules for students, sports secretary, sports incharge, office staff, and principal.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js with Express
- **Database:** SQLite

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize the database:
   ```bash
   npm run init-db
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open http://localhost:3000 in your browser.

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Student | student | password123 |
| Sports Secretary | secretary | password123 |
| Sports Incharge | incharge | password123 |
| Office Staff | office | password123 |
| Principal | principal | password123 |

## Modules

- **Student:** View upcoming events, past events, and stock information (no damaged count).
- **Sports Secretary:** View stock with damaged info, add/edit/delete events. Cannot edit stock.
- **Sports Incharge:** Full stock and event management. Generate reports. Stock categories: Cricket, Football, Volleyball, Basketball, Badminton, Table Tennis, Handball, Athletics.
- **Office Staff:** View all data (stock, events, reports). Add comments on reports (visible only to Principal).
- **Principal:** View all data including office comments. Verify and approve reports. Approval status visible to Office Staff and Sports Incharge.
