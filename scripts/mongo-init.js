// MongoDB initialization script for production
db = db.getSiblingDB('afg_marketplace');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'passwordHash', 'name', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        passwordHash: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        role: {
          bsonType: 'string',
          enum: ['shopper', 'merchant', 'moderator', 'admin'],
          description: 'must be a valid role'
        }
      }
    }
  }
});

db.createCollection('stores');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('flags');
db.createCollection('chatmessages');
db.createCollection('reviews');
db.createCollection('favorites');
db.createCollection('viewhistories');

// Create indexes for better performance
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

print('MongoDB initialized successfully for production');