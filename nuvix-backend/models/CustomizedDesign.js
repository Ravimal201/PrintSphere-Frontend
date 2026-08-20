const mongoose = require("mongoose");

const LayerSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: "image"
  },
  name: {
    type: String,
    default: "Layer"
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
    default: [0, 0, 0]
  },
  rotation: {
    type: [Number],
    default: [0, 0, 0]
  },
  scale: {
    type: [Number],
    default: [0.3, 0.3, 0.25]
  },
  aspectRatio: {
    type: Number,
    default: 1
  }
}, { _id: false });

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
    modelPath: {
      type: String
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
      default: "M"
    },
    layers: [LayerSchema], // List of 3D decals projected
    estimatedCost: {
      type: Number,
      default: 0
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
