import app from './src/app.js';
import connectDB from './src/config/database.js';

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});