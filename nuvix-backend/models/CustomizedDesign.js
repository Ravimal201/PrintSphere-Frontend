const mongoose = require("mongoose");

const LayerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["text", "image", "logo", "shape"],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  // Text specific parameters
  text: String,
  fontFamily: String,
  color: String,
  bold: {
    type: Boolean,
    default: false
  },
  italic: {
    type: Boolean,
    default: false
  },
  // Image URL
  url: String,
  // Layer visibility & lock state
  visible: {
    type: Boolean,
    default: true
  },
  locked: {
    type: Boolean,
    default: false
  },
  flipX: {
    type: Boolean,
    default: false
  },
  flipY: {
    type: Boolean,
    default: false
  },
  targetMeshName: String,
  projectedForModel: String,
  // 3D transform metrics (X, Y, Z coordinates and factors)
  position: {
    type: [Number],
    required: true
  },
  rotation: {
    type: [Number],
    required: true
  },
  scale: {
    type: [Number],
    required: true
  },
  aspectRatio: {
    type: Number,
    default: 1
  }
});

const CustomizedDesignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    tShirtType: {
      type: String,
      required: true
    },
    fabricColor: {
      type: String,
      required: true
    },
    material: {
      type: String,
      required: true
    },
    size: {
      type: String,
      enum: ["S", "M", "L", "XL", "XXL"],
      required: true
    },
    layers: [LayerSchema], // List of 3D decals projected
    estimatedCost: {
      type: Number,
      required: true
    },
    thumbnailUrl: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("CustomizedDesign", CustomizedDesignSchema);
