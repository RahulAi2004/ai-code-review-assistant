import mongoose from 'mongoose';

// An issue is embedded inside a review (mirrors the AI response shape).
const issueSchema = new mongoose.Schema(
  {
    severity: String,
    category: String,
    line: Number,
    title: String,
    description: String,
    suggestion: String,
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: { type: String, enum: ['paste', 'upload', 'github'], default: 'paste' },
    filename: { type: String, default: null },
    language: { type: String, default: 'unknown' },
    score: { type: Number, default: null },
    summary: { type: String, default: '' },
    issues: { type: [issueSchema], default: [] },
    strengths: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Compact shape for history lists (no heavy issue bodies).
reviewSchema.methods.toListJSON = function toListJSON() {
  return {
    id: this._id,
    source: this.source,
    filename: this.filename,
    language: this.language,
    score: this.score,
    summary: this.summary,
    issueCount: this.issues.length,
    createdAt: this.createdAt,
  };
};

export const Review = mongoose.model('Review', reviewSchema);
