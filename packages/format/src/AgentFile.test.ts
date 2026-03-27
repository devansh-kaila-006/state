/**
 * Unit tests for @state/format
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentFile } from '../src/AgentFile';
import type { Message, SemanticMap, TerminalSession } from '../src/AgentFile';

describe('AgentFile', () => {
  let agentFile: AgentFile;

  beforeEach(async () => {
    agentFile = await AgentFile.create({
      metadata: {
        title: 'Test Conversation',
        language: 'TypeScript'
      }
    });
  });

  describe('Creation', () => {
    it('should create a new AgentFile', async () => {
      expect(agentFile).toBeDefined();
      expect(agentFile).toBeInstanceOf(AgentFile);
    });

    it('should have a valid manifest', () => {
      const manifest = agentFile.getManifest();
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.format).toBe('agent');
      expect(manifest.created_at).toBeDefined();
      expect(manifest.source_tool).toBeDefined();
      expect(manifest.encryption).toBeDefined();
    });

    it('should accept custom metadata', async () => {
      const customFile = await AgentFile.create({
        metadata: {
          title: 'Custom Title',
          description: 'Custom Description',
          tags: ['tag1', 'tag2'],
          language: 'Python',
          project_name: 'My Project'
        }
      });

      const manifest = customFile.getManifest();
      expect(manifest.metadata?.title).toBe('Custom Title');
      expect(manifest.metadata?.description).toBe('Custom Description');
      expect(manifest.metadata?.tags).toEqual(['tag1', 'tag2']);
      expect(manifest.metadata?.language).toBe('Python');
      expect(manifest.metadata?.project_name).toBe('My Project');
    });
  });

  describe('Conversation', () => {
    it('should add conversation messages', async () => {
      const messages: Message[] = [
        {
          role: 'user',
          content: 'Hello, how are you?',
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: 'I am doing well, thank you!',
          timestamp: new Date().toISOString(),
          model: 'claude-3-opus-20240229'
        }
      ];

      await agentFile.addConversation(messages);

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });

    it('should accept array content blocks', async () => {
      const messages: Message[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'Here is some code:'
            },
            {
              type: 'code',
              language: 'typescript',
              text: 'const x = 42;'
            }
          ],
          timestamp: new Date().toISOString()
        }
      ];

      await agentFile.addConversation(messages);

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });

    it('should handle tool use', async () => {
      const messages: Message[] = [
        {
          role: 'assistant',
          content: 'I will run a command for you.',
          timestamp: new Date().toISOString(),
          tools_used: [
            {
              name: 'bash',
              input: { command: 'ls -la' },
              output: { stdout: 'file1.txt\nfile2.txt' }
            }
          ]
        }
      ];

      await agentFile.addConversation(messages);

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });
  });

  describe('Semantic Map', () => {
    it('should add semantic map', async () => {
      const semanticMap: SemanticMap = {
        files: [
          {
            path: 'src/App.tsx',
            language: 'typescript',
            size: 2048,
            functions: ['App', 'useEffect'],
            imports: ['react', 'react-dom']
          },
          {
            path: 'src/utils.ts',
            language: 'typescript',
            size: 1024,
            functions: ['helper']
          }
        ],
        dependencies: {
          'src/App.tsx': ['react', 'react-dom', 'src/utils.ts']
        },
        summaries: {
          'src/App.tsx': 'Main application component',
          'src/utils.ts': 'Utility functions'
        }
      };

      await agentFile.addSemanticMap(semanticMap);

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });

    it('should handle minimal semantic map', async () => {
      const semanticMap: SemanticMap = {
        files: [
          {
            path: 'index.html',
            language: 'html'
          }
        ]
      };

      await agentFile.addSemanticMap(semanticMap);

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });
  });

  describe('Terminal History', () => {
    it('should add terminal sessions', async () => {
      const sessions: TerminalSession[] = [
        {
          id: 'session-1',
          working_directory: '/home/user/project',
          shell: 'zsh',
          commands: [
            {
              command: 'npm install',
              timestamp: '2026-03-27T10:00:00Z',
              exit_code: 0,
              output: 'added 123 packages',
              duration_ms: 15000
            },
            {
              command: 'npm test',
              timestamp: '2026-03-27T10:01:00Z',
              exit_code: 0,
              output: 'Tests passed',
              duration_ms: 5000
            }
          ]
        }
      ];

      await agentFile.addTerminalHistory(sessions);

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });
  });

  describe('Future Plan', () => {
    it('should add plan with markdown', async () => {
      await agentFile.addFuturePlan({
        plan: '# Implementation Plan\n\n## Tasks\n- [ ] Task 1\n- [x] Task 2'
      });

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });

    it('should add plan with tasks', async () => {
      await agentFile.addFuturePlan({
        plan: '# Plan',
        tasks: [
          {
            id: 'task-1',
            title: 'First task',
            status: 'pending',
            priority: 'high'
          },
          {
            id: 'task-2',
            title: 'Second task',
            status: 'completed',
            priority: 'low'
          }
        ]
      });

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });

    it('should add plan with only tasks', async () => {
      await agentFile.addFuturePlan({
        tasks: [
          {
            id: 'task-1',
            title: 'Only task',
            status: 'pending'
          }
        ]
      });

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });
  });

  describe('Assets', () => {
    it('should add asset files', async () => {
      const asset = Buffer.from('test asset content');
      await agentFile.addAsset(asset, 'test.txt');

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });

    it('should add binary assets', async () => {
      const binaryAsset = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      await agentFile.addAsset(binaryAsset, 'binary.bin');

      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate a correct AgentFile', () => {
      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should have no warnings by default', () => {
      const validation = agentFile.validate();
      expect(validation.warnings).toHaveLength(0);
    });
  });

  describe('Manifest', () => {
    it('should return a copy of the manifest', () => {
      const manifest1 = agentFile.getManifest();
      const manifest2 = agentFile.getManifest();

      expect(manifest1).toEqual(manifest2);
      expect(manifest1).not.toBe(manifest2);
    });

    it('should have correct source tool', () => {
      const manifest = agentFile.getManifest();
      expect(manifest.source_tool.name).toBe('manual');
      expect(manifest.source_tool.version).toBeDefined();
    });

    it('should have encryption disabled by default', () => {
      const manifest = agentFile.getManifest();
      expect(manifest.encryption.enabled).toBe(false);
    });
  });

  describe('Static Methods', () => {
    it('should validate manifest structure', () => {
      const validManifest = {
        version: '1.0.0',
        format: 'agent' as const,
        created_at: new Date().toISOString(),
        source_tool: {
          name: 'claude' as const,
          version: '1.0.0'
        },
        encryption: {
          enabled: false
        }
      };

      const validation = AgentFile.validateManifest(validManifest);
      expect(validation.valid).toBe(true);
    });

    it('should reject invalid manifest', () => {
      const invalidManifest = {
        version: 'invalid',
        format: 'agent' as const
      };

      const validation = AgentFile.validateManifest(invalidManifest);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should reject manifest with missing required fields', () => {
      const incompleteManifest = {
        version: '1.0.0'
        // Missing: format, created_at, source_tool, encryption
      };

      const validation = AgentFile.validateManifest(incompleteManifest);
      expect(validation.valid).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should handle a complete .agent file', async () => {
      // Add all components
      await agentFile.addConversation([
        {
          role: 'user',
          content: 'Test message',
          timestamp: new Date().toISOString()
        }
      ]);

      await agentFile.addSemanticMap({
        files: [
          {
            path: 'test.ts',
            language: 'typescript'
          }
        ]
      });

      await agentFile.addTerminalHistory([
        {
          commands: [
            {
              command: 'echo test',
              timestamp: new Date().toISOString()
            }
          ]
        }
      ]);

      await agentFile.addFuturePlan({
        plan: '# Plan\n\n1. Do this\n2. Do that'
      });

      await agentFile.addAsset(Buffer.from('asset'), 'asset.txt');

      // Validate
      const validation = agentFile.validate();
      expect(validation.valid).toBe(true);
    });
  });
});
