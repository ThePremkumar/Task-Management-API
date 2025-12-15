import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Category from '../src/models/Category.js';

dotenv.config();

const run = async () => {
  try {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is missing in .env");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const users = await User.find();
    console.log(`Found ${users.length} users.`);

    for (const u of users) {
        console.log(`\nUser: ${u.username} (${u.email}) ID: ${u._id}`);
        const cats = await Category.find({ user: u._id });
        if (cats.length === 0) {
            console.log("  No categories found.");
        } else {
            console.log("  Categories:");
            cats.forEach(c => console.log(`    - ${c.name}: ${c._id}`));
        }
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

run();
