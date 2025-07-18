// MongoDB initialization script for development
db = db.getSiblingDB('afg_marketplace_dev');

// Create collections
db.createCollection('users');
db.createCollection('stores');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('flags');
db.createCollection('chatmessages');
db.createCollection('reviews');
db.createCollection('favorites');
db.createCollection('viewhistories');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.stores.createIndex({ name: 'text', description: 'text' });
db.stores.createIndex({ city: 1, district: 1 });
db.stores.createIndex({ ownerId: 1 });

db.products.createIndex({ name: 'text', description: 'text' });
db.products.createIndex({ category: 1 });
db.products.createIndex({ storeId: 1 });

db.categories.createIndex({ slug: 1 }, { unique: true });
db.categories.createIndex({ parentCategory: 1 });

db.flags.createIndex({ status: 1 });
db.flags.createIndex({ targetType: 1, targetId: 1 });

db.chatmessages.createIndex({ storeId: 1, timestamp: -1 });
db.chatmessages.createIndex({ senderId: 1, recipientId: 1 });

db.reviews.createIndex({ targetType: 1, targetId: 1 });
db.reviews.createIndex({ reviewerId: 1 });

db.favorites.createIndex({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

db.viewhistories.createIndex({ userId: 1, viewedAt: -1 });
db.viewhistories.createIndex({ sessionId: 1, viewedAt: -1 });

// Insert sample data for development
db.users.insertOne({
  email: 'admin@afghanbazar.com',
  passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewVyLGMhNPKlmLU2', // password: admin123
  name: 'Admin User',
  language: 'en',
  role: 'admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

db.categories.insertMany([
  {
    name: {
      en: 'Electronics',
      fa: 'الکترونیک',
      ps: 'الکترونیکي'
    },
    slug: 'electronics',
    description: {
      en: 'Electronic devices and gadgets',
      fa: 'دستگاه‌های الکترونیکی و گجت‌ها',
      ps: 'الکترونیکي وسایل او ګاجټونه'
    },
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: {
      en: 'Clothing',
      fa: 'پوشاک',
      ps: 'کالي'
    },
    slug: 'clothing',
    description: {
      en: 'Clothing and fashion items',
      fa: 'پوشاک و اقلام مد',
      ps: 'کالي او فیشن توکي'
    },
    isActive: true,
    isFeatured: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: {
      en: 'Food & Beverages',
      fa: 'غذا و نوشیدنی',
      ps: 'خواړه او څښاک'
    },
    slug: 'food-beverages',
    description: {
      en: 'Food items and beverages',
      fa: 'اقلام غذایی و نوشیدنی',
      ps: 'د خواړو توکي او څښاک'
    },
    isActive: true,
    isFeatured: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('MongoDB initialized successfully for development with sample data');