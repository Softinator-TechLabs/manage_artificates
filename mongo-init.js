// MongoDB initialization script
db = db.getSiblingDB('image_qa_rewards');

// Create collections with validation
db.createCollection('users', {
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
});

db.createCollection('submissions', {
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
});

db.createCollection('wallets', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'pointsBalance'],
      properties: {
        userId: { bsonType: 'objectId' },
        pointsBalance: { bsonType: 'int' },
      },
    },
  },
});

db.createCollection('bankdetails', {
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
});

db.createCollection('redemptionrequests', {
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
});

db.createCollection('webhookevents', {
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
});

db.createCollection('wallettransactions', {
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
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.submissions.createIndex({ userId: 1 });
db.submissions.createIndex({ status: 1 });
db.submissions.createIndex({ createdAt: -1 });
db.wallets.createIndex({ userId: 1 }, { unique: true });
db.bankdetails.createIndex({ userId: 1 }, { unique: true });
db.redemptionrequests.createIndex({ userId: 1 });
db.redemptionrequests.createIndex({ status: 1 });
db.webhookevents.createIndex({ submissionId: 1 });
db.webhookevents.createIndex({ createdAt: -1 });
db.wallettransactions.createIndex({ walletId: 1 });
db.wallettransactions.createIndex({ createdAt: -1 });

print('Database initialized successfully');
