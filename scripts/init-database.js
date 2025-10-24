#!/usr/bin/env node

/**
 * Database initialization script
 * This script will create all necessary collections and indexes for the application
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set in .env.local');
  process.exit(1);
}

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();

    const db = client.db('image_qa_rewards');

    console.log('📊 Creating collections...');

    // Create collections with validation
    const collections = [
      {
        name: 'users',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'createdAt'],
            properties: {
              email: { bsonType: 'string' },
              name: { bsonType: 'string' },
              image: { bsonType: 'string' },
              profile: {
                bsonType: 'object',
                properties: {
                  expertise: { bsonType: 'string' },
                  bio: { bsonType: 'string' },
                },
              },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' },
            },
          },
        },
      },
      {
        name: 'submissions',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'question', 'answer', 'status', 'createdAt'],
            properties: {
              userId: { bsonType: 'objectId' },
              artifactUrl: { bsonType: 'string' },
              question: { bsonType: 'string' },
              answer: { bsonType: 'string' },
              englishQuestion: { bsonType: 'string' },
              englishAnswer: { bsonType: 'string' },
              status: {
                bsonType: 'string',
                enum: ['PENDING', 'PROCESSING', 'ACCEPTED', 'REJECTED'],
              },
              pointsAwarded: { bsonType: 'int' },
              n8nWorkflowId: { bsonType: 'string' },
              n8nRunId: { bsonType: 'string' },
              reviewerNotes: { bsonType: 'string' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' },
            },
          },
        },
      },
      {
        name: 'wallets',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'pointsBalance'],
            properties: {
              userId: { bsonType: 'objectId' },
              pointsBalance: { bsonType: 'int' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' },
            },
          },
        },
      },
      {
        name: 'bankdetails',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId'],
            properties: {
              userId: { bsonType: 'objectId' },
              accountHolder: { bsonType: 'string' },
              accountNumber: { bsonType: 'string' },
              ifsc: { bsonType: 'string' },
              upiId: { bsonType: 'string' },
              updatedAt: { bsonType: 'date' },
            },
          },
        },
      },
      {
        name: 'redemptionrequests',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['userId', 'points', 'status', 'method', 'createdAt'],
            properties: {
              userId: { bsonType: 'objectId' },
              points: { bsonType: 'int' },
              status: {
                bsonType: 'string',
                enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID'],
              },
              method: {
                bsonType: 'string',
                enum: ['BANK', 'UPI'],
              },
              payoutRef: { bsonType: 'string' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' },
            },
          },
        },
      },
      {
        name: 'webhookevents',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['submissionId', 'payload', 'source', 'createdAt'],
            properties: {
              submissionId: { bsonType: 'string' },
              payload: { bsonType: 'object' },
              source: { bsonType: 'string' },
              signature: { bsonType: 'string' },
              createdAt: { bsonType: 'date' },
            },
          },
        },
      },
      {
        name: 'wallettransactions',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['walletId', 'deltaPoints', 'reason', 'createdAt'],
            properties: {
              walletId: { bsonType: 'objectId' },
              deltaPoints: { bsonType: 'int' },
              reason: { bsonType: 'string' },
              createdAt: { bsonType: 'date' },
            },
          },
        },
      },
    ];

    for (const collection of collections) {
      try {
        await db.createCollection(collection.name, {
          validator: collection.validator,
        });
        console.log(`✅ Created collection: ${collection.name}`);
      } catch (error) {
        if (error.code === 48) {
          // Collection already exists
          console.log(`⚠️  Collection already exists: ${collection.name}`);
        } else {
          console.error(
            `❌ Error creating collection ${collection.name}:`,
            error.message,
          );
        }
      }
    }

    console.log('📈 Creating indexes...');

    // Create indexes for better performance
    const indexes = [
      { collection: 'users', index: { email: 1 }, options: { unique: true } },
      { collection: 'submissions', index: { userId: 1 } },
      { collection: 'submissions', index: { status: 1 } },
      { collection: 'submissions', index: { createdAt: -1 } },
      {
        collection: 'wallets',
        index: { userId: 1 },
        options: { unique: true },
      },
      {
        collection: 'bankdetails',
        index: { userId: 1 },
        options: { unique: true },
      },
      { collection: 'redemptionrequests', index: { userId: 1 } },
      { collection: 'redemptionrequests', index: { status: 1 } },
      { collection: 'webhookevents', index: { submissionId: 1 } },
      { collection: 'webhookevents', index: { createdAt: -1 } },
      { collection: 'wallettransactions', index: { walletId: 1 } },
      { collection: 'wallettransactions', index: { createdAt: -1 } },
    ];

    for (const { collection, index, options = {} } of indexes) {
      try {
        await db.collection(collection).createIndex(index, options);
        console.log(
          `✅ Created index on ${collection}:`,
          JSON.stringify(index),
        );
      } catch (error) {
        console.error(
          `❌ Error creating index on ${collection}:`,
          error.message,
        );
      }
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('\n📋 Collections created:');
    console.log('  - users (with profile field)');
    console.log('  - submissions (with englishQuestion/englishAnswer fields)');
    console.log('  - wallets');
    console.log('  - bankdetails');
    console.log('  - redemptionrequests');
    console.log('  - webhookevents');
    console.log('  - wallettransactions');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the initialization
initializeDatabase();
