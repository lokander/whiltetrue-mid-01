require('dotenv').config();
const { createApp } = require('./src/app');
const { initializeDatabase } = require('./src/db/schema');
const { seedDatabase } = require('./src/db/seed');

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is required');
  process.exit(1);
}

// Initialize database
initializeDatabase();
seedDatabase();

// Create and start server
const app = createApp();
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
