import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = require('../../redapplex-ai-platform-firebase-adminsdk-fbsvc-3f41372c29.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'redapplex-ai-platform',
  });
}

const db = admin.firestore();
const auth = admin.auth();

class FirebaseMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'firebase-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'firebase_get_user',
            description: 'Get user information by UID',
            inputSchema: {
              type: 'object',
              properties: {
                uid: {
                  type: 'string',
                  description: 'User UID',
                },
              },
              required: ['uid'],
            },
          },
          {
            name: 'firebase_create_user',
            description: 'Create a new user',
            inputSchema: {
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  description: 'User email',
                },
                password: {
                  type: 'string',
                  description: 'User password',
                },
                displayName: {
                  type: 'string',
                  description: 'User display name',
                },
              },
              required: ['email', 'password'],
            },
          },
          {
            name: 'firebase_get_document',
            description: 'Get a document from Firestore',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Collection name',
                },
                documentId: {
                  type: 'string',
                  description: 'Document ID',
                },
              },
              required: ['collection', 'documentId'],
            },
          },
          {
            name: 'firebase_set_document',
            description: 'Set a document in Firestore',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Collection name',
                },
                documentId: {
                  type: 'string',
                  description: 'Document ID',
                },
                data: {
                  type: 'object',
                  description: 'Document data',
                },
              },
              required: ['collection', 'documentId', 'data'],
            },
          },
          {
            name: 'firebase_query_collection',
            description: 'Query a Firestore collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Collection name',
                },
                field: {
                  type: 'string',
                  description: 'Field to query',
                },
                operator: {
                  type: 'string',
                  description: 'Query operator (==, >, <, >=, <=)',
                },
                value: {
                  type: 'string',
                  description: 'Value to compare',
                },
                limit: {
                  type: 'number',
                  description: 'Limit number of results',
                },
              },
              required: ['collection'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'firebase_get_user':
            return await this.getUser(args.uid);

          case 'firebase_create_user':
            return await this.createUser(args);

          case 'firebase_get_document':
            return await this.getDocument(args.collection, args.documentId);

          case 'firebase_set_document':
            return await this.setDocument(args.collection, args.documentId, args.data);

          case 'firebase_query_collection':
            return await this.queryCollection(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'firebase://users',
            name: 'Firebase Users',
            description: 'Firebase Authentication users',
            mimeType: 'application/json',
          },
          {
            uri: 'firebase://firestore',
            name: 'Firestore Database',
            description: 'Firestore database collections',
            mimeType: 'application/json',
          },
        ],
      };
    });
  }

  private async getUser(uid: string) {
    const userRecord = await auth.getUser(uid);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(userRecord.toJSON(), null, 2),
        },
      ],
    };
  }

  private async createUser(args: any) {
    const userRecord = await auth.createUser({
      email: args.email,
      password: args.password,
      displayName: args.displayName,
    });
    return {
      content: [
        {
          type: 'text',
          text: `User created successfully: ${userRecord.uid}`,
        },
      ],
    };
  }

  private async getDocument(collection: string, documentId: string) {
    const doc = await db.collection(collection).doc(documentId).get();
    if (!doc.exists) {
      throw new Error('Document not found');
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(doc.data(), null, 2),
        },
      ],
    };
  }

  private async setDocument(collection: string, documentId: string, data: any) {
    await db.collection(collection).doc(documentId).set(data);
    return {
      content: [
        {
          type: 'text',
          text: 'Document set successfully',
        },
      ],
    };
  }

  private async queryCollection(args: any) {
    let query = db.collection(args.collection);
    
    if (args.field && args.operator && args.value) {
      query = query.where(args.field, args.operator as any, args.value);
    }
    
    if (args.limit) {
      query = query.limit(args.limit);
    }
    
    const snapshot = await query.get();
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(docs, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Firebase MCP Server started');
  }
}

// Start the server
const server = new FirebaseMCPServer();
server.run().catch(console.error); 