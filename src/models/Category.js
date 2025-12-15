import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
categorySchema.index({ user: 1 });

export default mongoose.model('Category', categorySchema);