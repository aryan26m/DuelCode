# DuelCode

DuelCode is a real-time competitive coding arena where players can create private battles, join via invite code, or queue for random matchmaking. The app includes live socket updates, auto-judging against Codeforces, Elo-style ratings, daily streak rewards, OTP-based signup verification, and a modern competitive UI.

## Highlights

- Real-time 1v1 coding battles with Socket.IO
- Private room creation and invite-code joining
- Random matchmaking by difficulty
- Automatic Codeforces submission judging
- Elo rating updates after every battle
- Daily streak tracking with milestone rewards
- OTP verification during registration
- Welcome email and verification email flow
- Global leaderboard and player history

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router
- Backend: Node.js, Express, MongoDB, Mongoose, Socket.IO
- Email: Nodemailer with OAuth2
- Authentication: JWT + HTTP cookies
- Data source: Codeforces API

## Project Structure

```text
CodeBattle/
  Backend/
    server.js
    src/
      config/
      controllers/
      middlewares/
      models/
      routes/
      scripts/
      services/
      sockets/
      utils/
  frontend/
    src/
      apis/
      components/
      hooks/
      pages/
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- Codeforces handle for each player
- Gmail OAuth2 credentials for sending OTP and welcome emails

### 1. Clone and install

```bash
git clone <your-repo-url>
cd CodeBattle
```

Backend:

```bash
cd Backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 2. Configure environment variables

Create a `.env` file inside `Backend/`.

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
EMAIL_USER=your_email_address
FRONTEND_URL=http://localhost:8080
```

Keep this file out of git. A template is available in [Backend/.env.example](Backend/.env.example).

### 3. Run the app

Start the backend:

```bash
cd Backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

By default, the frontend runs on Vite and the backend runs on port `3000`.

## Key Features

### Registration and Login

- New users must verify their email with an OTP before account creation.
- After successful registration, a welcome email introduces the 30-day challenge.
- Existing users can log in normally with JWT authentication.

### Daily Streaks

- Every day a user returns, their streak increments by 1.
- Missing a day resets the streak.
- Every 7-day streak grants a bonus rating reward.
- A 30-day streak is highlighted as the major challenge milestone.

### Battles

- Create a private lobby and share an invite code.
- Join a lobby with a valid code.
- Start random matchmaking by difficulty.
- Battles are auto-judged using Codeforces submissions.
- Ratings are updated when a battle ends.

### Leaderboard

- Global ranking is sorted by rating and wins.
- Users can see their own placement, rating, and streak status.

## Deployment Notes

- Do not commit `.env` files.
- Update `FRONTEND_URL` for production email links.
- Make sure the frontend API base URL points to your deployed backend.
- Verify Google OAuth2 email credentials before launching OTP registration.

## Important Security Notes

- Rotate any exposed secrets before deploying.
- If you accidentally committed credentials in the past, remove them from history and rotate the affected tokens and passwords.

## Available Scripts

### Backend

```bash
npm run dev
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run test
```

## License

No license has been set for this project.
