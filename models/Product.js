import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  dimensions: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    default: "uncategorized"
  },
  description: {
    type: String,
    required: true
  },
  availability: {
    type: Boolean,
    required: true,
    default: true
  },
  image: {
    type: [String],
    required: true,
    default: [
      "https://static.vecteezy.com/system/resources/previews/009/734/564/non_2x/default-avatar-profile-icon-of-social-media-user-vector.jpg"
    ]
  }
});

// 🔐 FIX: Prevent model overwrite during nodemon reload
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
