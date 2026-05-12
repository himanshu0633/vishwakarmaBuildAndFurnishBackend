const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Category = require('../models/Category');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';

const fixCategoryIndexes = async () => {
  await mongoose.connect(MONGODB_URI);

  await Category.updateMany(
    {
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: '' }
      ]
    },
    [
      {
        $set: {
          category: '$name'
        }
      }
    ]
  );

  try {
    await Category.collection.dropIndex('category_1');
    console.log('Dropped old category_1 unique index');
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      console.log('Old category_1 index not found, nothing to drop');
    } else {
      throw error;
    }
  }

  await Category.syncIndexes();
  console.log('Category indexes synced successfully');

  await mongoose.disconnect();
};

fixCategoryIndexes().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
