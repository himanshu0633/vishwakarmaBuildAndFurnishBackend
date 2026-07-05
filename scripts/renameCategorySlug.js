const mongoose = require('mongoose');
const Category = require('../models/Category');

const MONGODB_URI = 'mongodb+srv://clinic:clinic1234@cluster0.lo468v5.mongodb.net/BuildAndFrunish?retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const cat = await Category.findOne({ slug: 'wooden-work-services' });
  if (cat) {
    console.log('Found category:', cat.name, cat.slug);
    cat.image = '/uploads/services/service-1778313028408-572604629.png';
    await cat.save();
    console.log('Updated category image path successfully!');
  } else {
    console.log('Category not found');
  }

  mongoose.disconnect();
}

main().catch(console.error);
