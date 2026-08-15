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
  url: String,
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
        enum: ["S", "M", "L", "XL", "XXL"]
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
