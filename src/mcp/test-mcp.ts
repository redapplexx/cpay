import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testFirebaseMCP() {
  const transport = new StdioClientTransport();
  const client = new Client({
    name: 'firebase-mcp-test',
    version: '1.0.0',
  });

  try {
    await client.connect(transport);

    // Test listing tools
    console.log('Testing Firebase MCP Server...');
    
    const tools = await client.listTools();
    console.log('Available tools:', tools.tools.map(t => t.name));

    const resources = await client.listResources();
    console.log('Available resources:', resources.resources.map(r => r.name));

    console.log('Firebase MCP Server is working correctly!');
    
    await client.close();
  } catch (error) {
    console.error('Error testing Firebase MCP Server:', error);
  }
}

testFirebaseMCP(); 