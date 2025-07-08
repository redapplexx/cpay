# Firebase MCP Server for RedAppleX

This directory contains the Firebase Model Context Protocol (MCP) server implementation for the RedAppleX platform.

## Overview

The Firebase MCP server enables AI assistants to interact directly with Firebase services through a standardized protocol, allowing for:

- User management (create, read, update, delete)
- Firestore document operations
- Real-time database queries
- Authentication operations
- Cloud Functions invocation

## Setup

### Prerequisites

1. Firebase Admin SDK credentials file (`redapplex-ai-platform-firebase-adminsdk-fbsvc-3f41372c29.json`)
2. Node.js 18+ and npm
3. TypeScript and tsx

### Installation

```bash
npm install @modelcontextprotocol/sdk
npm install -D tsx
```

### Running the MCP Server

```bash
npm run mcp:firebase
```

## Available Tools

### 1. firebase_get_user
Get user information by UID
```json
{
  "uid": "user_uid_here"
}
```

### 2. firebase_create_user
Create a new user
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "displayName": "User Name"
}
```

### 3. firebase_get_document
Get a document from Firestore
```json
{
  "collection": "users",
  "documentId": "user123"
}
```

### 4. firebase_set_document
Set a document in Firestore
```json
{
  "collection": "users",
  "documentId": "user123",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active"
  }
}
```

### 5. firebase_query_collection
Query a Firestore collection
```json
{
  "collection": "users",
  "field": "status",
  "operator": "==",
  "value": "active",
  "limit": 10
}
```

## Available Resources

1. **firebase://users** - Firebase Authentication users
2. **firebase://firestore** - Firestore database collections

## Integration with Cursor

The Firebase MCP server is configured to work with Cursor's AI assistant. The `.cursorrules` file contains the configuration and usage examples.

## Security

- Uses Firebase Admin SDK with service account credentials
- All operations are performed server-side
- Proper error handling and validation
- No sensitive data exposed in responses

## Development

### Adding New Tools

1. Add the tool definition in `setupToolHandlers()`
2. Implement the tool logic in a private method
3. Add the case in the switch statement in `CallToolRequestSchema` handler

### Testing

```bash
tsx src/mcp/test-mcp.ts
```

## Project Context

This MCP server is part of the RedAppleX platform - a unified, AI-powered business, marketing, and operations suite designed for absolute dominance and 1B+ pesos in revenue/assets within 1-2 years.

### Key Features Supported:
- User management and authentication
- Document storage and retrieval
- Real-time data queries
- Multi-tenant operations
- Analytics and reporting

## Troubleshooting

### Common Issues

1. **Service Account Not Found**: Ensure the Firebase service account JSON file is in the project root
2. **Permission Denied**: Verify the service account has the necessary Firebase permissions
3. **Connection Issues**: Check that the Firebase project ID is correct

### Logs

The MCP server logs to stderr. Check the console output for error messages and debugging information. 