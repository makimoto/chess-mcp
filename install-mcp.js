#!/usr/bin/env node

/**
 * Chess MCP Installation Script
 * 
 * This script configures the Chess MCP server for use with Claude MCP.
 * It can be run automatically during npm install or manually by users.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLAUDE_CONFIG_DIR = path.join(os.homedir(), '.claude');
const CLAUDE_CONFIG_FILE = path.join(CLAUDE_CONFIG_DIR, 'claude_desktop_config.json');

/**
 * Get the package installation directory
 */
function getPackageDir() {
  // Try to find the package directory
  const possiblePaths = [
    path.join(__dirname),
    path.join(process.cwd()),
    path.join(process.cwd(), 'node_modules', '@makimoto', 'chess-mcp')
  ];
  
  for (const dir of possiblePaths) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
  }
  
  return __dirname;
}

/**
 * Read existing Claude configuration
 */
function readClaudeConfig() {
  try {
    if (fs.existsSync(CLAUDE_CONFIG_FILE)) {
      const content = fs.readFileSync(CLAUDE_CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('Warning: Could not read existing Claude configuration:', error.message);
  }
  
  return { mcpServers: {} };
}

/**
 * Write Claude configuration
 */
function writeClaudeConfig(config) {
  try {
    // Ensure the directory exists
    if (!fs.existsSync(CLAUDE_CONFIG_DIR)) {
      fs.mkdirSync(CLAUDE_CONFIG_DIR, { recursive: true });
    }
    
    // Write the configuration
    fs.writeFileSync(CLAUDE_CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing Claude configuration:', error.message);
    return false;
  }
}

/**
 * Configure Chess MCP server
 */
function configureChessMCP() {
  const packageDir = getPackageDir();
  const serverPath = path.join(packageDir, 'dist', 'server.js');
  
  // Verify the server file exists
  if (!fs.existsSync(serverPath)) {
    console.error('Error: Chess MCP server file not found at:', serverPath);
    console.error('Please ensure the package is properly installed and built.');
    return false;
  }
  
  // Read existing configuration
  const config = readClaudeConfig();
  
  // Add Chess MCP server configuration
  config.mcpServers = config.mcpServers || {};
  config.mcpServers['chess-mcp'] = {
    command: 'node',
    args: [serverPath],
    env: {
      NODE_ENV: 'production'
    }
  };
  
  // Write updated configuration
  if (writeClaudeConfig(config)) {
    console.log('✅ Chess MCP server configured successfully!');
    console.log('📁 Configuration file:', CLAUDE_CONFIG_FILE);
    console.log('🔧 Server path:', serverPath);
    console.log('');
    console.log('📖 Available MCP Tools:');
    console.log('  • create_game - Create a new chess game');
    console.log('  • get_game_status - Get current game status');
    console.log('  • make_move - Make a move in the game');
    console.log('  • list_games - List all games');
    console.log('  • get_board_state - Get board state');
    console.log('  • get_legal_moves - Get legal moves');
    console.log('  • validate_move - Validate a move');
    console.log('  • get_move_history - Get move history');
    console.log('  • resign_game - Resign from game');
    console.log('  • offer_draw - Offer a draw');
    console.log('  • accept_draw - Accept draw offer');
    console.log('  • decline_draw - Decline draw offer');
    console.log('  • export_game - Export game as PGN/FEN');
    console.log('  • import_game - Import game from PGN');
    console.log('  • pause_game - Pause an active game');
    console.log('  • resume_game - Resume a paused game');
    console.log('');
    console.log('🚀 Restart Claude to use the Chess MCP server!');
    return true;
  }
  
  return false;
}

/**
 * Remove Chess MCP configuration
 */
function removeChessMCP() {
  const config = readClaudeConfig();
  
  if (config.mcpServers && config.mcpServers['chess-mcp']) {
    delete config.mcpServers['chess-mcp'];
    
    if (writeClaudeConfig(config)) {
      console.log('✅ Chess MCP server removed from configuration');
      console.log('🚀 Restart Claude to apply changes');
      return true;
    }
  } else {
    console.log('ℹ️ Chess MCP server not found in configuration');
    return true;
  }
  
  return false;
}

/**
 * Show help information
 */
function showHelp() {
  console.log('Chess MCP Installation Script');
  console.log('');
  console.log('Usage:');
  console.log('  node install-mcp.js [command]');
  console.log('');
  console.log('Commands:');
  console.log('  install    Configure Chess MCP server (default)');
  console.log('  remove     Remove Chess MCP server configuration');
  console.log('  help       Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node install-mcp.js');
  console.log('  node install-mcp.js install');
  console.log('  node install-mcp.js remove');
}

/**
 * Main function
 */
function main() {
  const command = process.argv[2] || 'install';
  
  switch (command) {
    case 'install':
      if (!configureChessMCP()) {
        process.exit(1);
      }
      break;
      
    case 'remove':
      if (!removeChessMCP()) {
        process.exit(1);
      }
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.error('Unknown command:', command);
      showHelp();
      process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  configureChessMCP,
  removeChessMCP
};