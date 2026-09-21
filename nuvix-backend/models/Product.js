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

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    basePrice: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    sizes: [
      {
        type: String,
        trim: true
      }
    ],
    gsm: {
      type: String,
      default: "GSM 180"
    },
    gsms: [
      {
        type: String
      }
    ],
    gsmPrices: [
      {
        gsm: { type: String },
        price: { type: Number }
      }
    ],
    colors: [String],
    images: [String],
    status: {
      type: String,
      enum: ["Draft", "Active", "Archived"],
      default: "Active"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    modelPath: {
      type: String,
      default: "/images/models/male normal t-shirt1.glb"
    },
    defaultColor: {
      type: String,
      default: "#ffffff"
    },
    averageRating: {
      type: Number,
      default: 0
    },
    ratingsCount: {
      type: Number,
      default: 0
    },
    layers: [LayerSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", ProductSchema);
