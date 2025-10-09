// src/models/TreatmentPlan.js
const mongoose = require("mongoose");

const treatmentPlanSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor reference is required"],
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient reference is required"],
    },
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: [true, "Consultation reference is required"],
    },
    treatmentType: {
      type: String,
      required: [true, "Treatment type is required"],
      enum: [
        "Panchakarma",
        "Kayachikitsa (Internal Medicine)",
        "Shalakya Tantra (ENT & Ophthalmology)",
        "Shalya Tantra (Surgery)",
        "Kaumarbhritya (Pediatrics)",
        "Agadatantra (Toxicology)",
        "Rasayana (Rejuvenation)",
        "Vajikarana (Aphrodisiac)",
        "Yoga Therapy",
        "Dietary Consultation",
        "Lifestyle Counseling",
      ],
    },
    treatmentPlan: {
      type: String,
      required: [true, "Treatment plan description is required"],
      minlength: [10, "Treatment plan must be at least 10 characters"],
      maxlength: [2000, "Treatment plan cannot exceed 2000 characters"],
    },
    duration: {
      type: String,
      required: [true, "Treatment duration is required"],
    },
    scheduledFor: {
      type: Date,
    },
    preInstructions: {
      type: String,
      maxlength: [1000, "Pre-instructions cannot exceed 1000 characters"],
    },
    postInstructions: {
      type: String,
      maxlength: [1000, "Post-instructions cannot exceed 1000 characters"],
    },
    medicines: [
      {
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],
    protocols: [
      {
        name: String,
        description: String,
        frequency: String,
        notes: String,
      },
    ],
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled", "deleted"],
      default: "active",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    startedAt: Date,
    completedAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
treatmentPlanSchema.index({ doctorId: 1, createdAt: -1 });
treatmentPlanSchema.index({ patientId: 1 });
treatmentPlanSchema.index({ status: 1 });
treatmentPlanSchema.index({ scheduledFor: 1 });

module.exports = mongoose.model("TreatmentPlan", treatmentPlanSchema);
