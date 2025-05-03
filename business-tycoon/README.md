# Business Tycoon Game

A web-based business simulation game where players can work, invest, build businesses, and grow their wealth.

## Features

- **Authentication System**: User registration, login, and profile management
- **Save Game Progress**: Game progress is saved automatically to the cloud
- **Multiple Game Systems**:
  - Work to earn money
  - Apply for jobs and gain experience
  - Manage assets and banking
  - Invest in the stock market
  - Start and grow your own business
  - Education and skill development

## Setup Instructions

### Firebase Configuration

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password provider)
3. Create a Firestore database
4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Add a web app if you haven't already
   - Copy the Firebase configuration object

5. Update the Firebase configuration in `src/config/firebase.js` with your own values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Installing Dependencies

```bash
npm install
```

### Running the Application Locally

```bash
npm start
```

## Deployment to GitHub Pages

1. Update the `homepage` property in `package.json` to your GitHub Pages URL:

```json
"homepage": "https://yourusername.github.io/business-tycoon"
```

2. Deploy to GitHub Pages:

```bash
npm run deploy
```

## Technology Stack

- React
- Firebase (Authentication and Firestore)
- Chart.js for finance charts
- Tailwind CSS for styling

## Game Mechanics

- **Progression System**: Gain experience and level up
- **Job System**: Apply for jobs, gain experience, and earn higher salaries
- **Stock Market**: Invest in stocks and watch your investments grow
- **Business Management**: Start and grow your own business
- **Education**: Improve your skills through education
- **Ascension System**: Reset your game with bonuses for a new generation

## License

MIT
