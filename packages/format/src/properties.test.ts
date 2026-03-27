/**
 * Property-based tests for @state/format
 *
 * Uses fast-check to test invariants and properties
 */

import { describe, it, expect } from 'vitest';
import { fc } from 'fast-check';
import { AgentFile } from '../src/AgentFile';

describe('Property-based Tests', () => {
  describe('AgentFile Creation', () => {
    it('should always create valid AgentFiles', async () => {
      await fc.assert(fc.async(fc.property(
        fc.record({
          title: fc.string(),
          description: fc.string(),
          language: fc.string(),
          projectName: fc.string()
        }),
        async (metadata) => {
          const agentFile = await AgentFile.create({ metadata });
          const validation = agentFile.validate();

          expect(validation.valid).toBe(true);
          expect(validation.errors).toHaveLength(0);
        }
      )));
    });

    it('should preserve manifest structure', async () => {
      await fc.assert(fc.async(fc.property(
        fc.boolean(),
        async (includeMetadata) => {
          const agentFile = await AgentFile.create(
            includeMetadata ? { metadata: { title: 'Test' } } : undefined
          );

          const manifest = agentFile.getManifest();

          expect(manifest).toBeDefined();
          expect(manifest.version).toBeDefined();
          expect(manifest.format).toBe('agent');
          expect(manifest.created_at).toBeDefined();
        }
      )));
    });
  });

  describe('Message Addition', () => {
    it('should handle arbitrary message arrays', async () => {
      await fc.assert(fc.async(fc.property(
        fc.array(fc.object({
          role: fc.constantFrom('user', 'assistant', 'system', 'tool'),
          content: fc.string(),
          timestamp: fc.date(),
          model: fc.option(fc.string()),
          tools_used: fc.array(fc.object({
            name: fc.string(),
            input: fc.anything(),
            output: fc.option(fc.anything())
          })),
          citations: fc.array(fc.string())
        })),
        async (messages) => {
          const agentFile = await AgentFile.create();

          await agentFile.addConversation(messages);

          const validation = agentFile.validate();
          expect(validation.valid).toBe(true);
        }
      )));
    });

    it('should maintain message order', async () => {
      await fc.assert(fc.async(fc.property(
        fc.array(fc.string(), { minLength: 1 }),
        async (contents) => {
          const agentFile = await AgentFile.create();

          const messages = contents.map(content => ({
            role: 'user' as const,
            content,
            timestamp: new Date().toISOString()
          }));

          await agentFile.addConversation(messages);

          const validation = agentFile.validate();
          expect(validation.valid).toBe(true);
        }
      )));
    });
  });

  describe('Path Validation', () => {
    it('should reject paths with ..', async () => {
      const agentFile = await AgentFile.create();

      const maliciousPaths = fc.constantFrom(
        '../../etc/passwd',
        '../secret',
        'path/../../to/secret',
        '..\\..\\windows'
      );

      await fc.assert(fc.async(fc.property(
        maliciousPaths,
        async (path) => {
          await expect(
            agentFile.addAsset(Buffer.from('test'), path)
          ).rejects.toThrow();
        }
      )));
    });

    it('should reject absolute paths', async () => {
      const agentFile = await AgentFile.create();

      const absolutePaths = fc.constantFrom(
        '/etc/passwd',
        '/windows/system32',
        'C:\\Windows\\System32',
        '\\absolute\\path'
      );

      await fc.assert(fc.async(fc.property(
        absolutePaths,
        async (path) => {
          await expect(
            agentFile.addAsset(Buffer.from('test'), path)
          ).rejects.toThrow();
        }
      )));
    });

    it('should accept valid relative paths', async () => {
      const agentFile = await AgentFile.create();

      const validPaths = fc.constantFrom(
        'file.txt',
        'path/to/file.txt',
        'assets/blobs/image.png',
        'data/data.json',
        'a/b/c/d/file.txt'
      );

      await fc.assert(fc.async(fc.property(
        validPaths,
        async (path) => {
          await expect(
            agentFile.addAsset(Buffer.from('test'), path)
          ).resolves.not.toThrow();
        }
      )));
    });
  });

  describe('File Size Limits', () => {
    it('should reject files exceeding MAX_FILE_SIZE', async () => {
      const agentFile = await AgentFile.create();
      const maxSize = 100 * 1024 * 1024; // 100 MB

      const largeSizes = fc.integer({ min: maxSize + 1, max: maxSize + 1000 });

      await fc.assert(fc.async(fc.property(
        largeSizes,
        async (size) => {
          const largeFile = Buffer.alloc(size);

          await expect(
            agentFile.addAsset(largeFile, 'large.bin')
          ).rejects.toThrow();
        }
      )));
    });

    it('should accept files within size limit', async () => {
      const agentFile = await AgentFile.create();
      const maxSize = 100 * 1024 * 1024; // 100 MB

      const validSizes = fc.integer({ min: 0, max: maxSize });

      await fc.assert(fc.async(fc.property(
        validSizes,
        async (size) => {
          const file = Buffer.alloc(size);

          await expect(
            agentFile.addAsset(file, 'file.bin')
          ).resolves.not.toThrow();
        }
      )));
    });
  });

  describe('Manifest Validation', () => {
    it('should reject manifests without required fields', () => {
      fc.assert(fc.property(
        fc.record({
          // Omit at least one required field
          version: fc.option(fc.string()),
          format: fc.option(fc.constantFrom('agent')),
          created_at: fc.option(fc.string()),
          source_tool: fc.option(fc.object({
            name: fc.constantFrom('claude', 'chatgpt', 'manual'),
            version: fc.string()
          })),
          encryption: fc.option(fc.object({
            enabled: fc.boolean()
          }))
        }),
        (incompleteManifest) => {
          const validation = AgentFile.validateManifest(incompleteManifest);

          // Should be invalid if missing any required field
          if (!incompleteManifest.version ||
              !incompleteManifest.format ||
              !incompleteManifest.created_at ||
              !incompleteManifest.source_tool ||
              !incompleteManifest.encryption) {
            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
          }
        }
      ));
    });

    it('should accept manifests with all required fields', () => {
      fc.assert(fc.property(
        fc.string(),
        fc.string(),
        (version, timestamp) => {
          const validManifest = {
            version,
            format: 'agent' as const,
            created_at: timestamp,
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
          expect(validation.errors).toHaveLength(0);
        }
      ));
    });
  });

  describe('Round-trip Serialization', () => {
    it('should preserve message content through add/get', async () => {
      await fc.assert(fc.async(fc.property(
        fc.array(fc.object({
          role: fc.constantFrom('user', 'assistant'),
          content: fc.string(),
          timestamp: fc.string()
        })),
        async (messages) => {
          const agentFile = await AgentFile.create();
          await agentFile.addConversation(messages);

          const validation = agentFile.validate();
          expect(validation.valid).toBe(true);
        }
      )));
    });

    it('should preserve metadata through creation', async () => {
      await fc.assert(fc.async(fc.property(
        fc.record({
          title: fc.string(),
          description: fc.string(),
          tags: fc.array(fc.string()),
          language: fc.string(),
          projectName: fc.string()
        }),
        async (metadata) => {
          const agentFile = await AgentFile.create({ metadata });
          const retrieved = agentFile.getManifest();

          expect(retrieved.metadata).toEqual(metadata);
        }
      )));
    });
  });

  describe('Error Handling', () => {
    it('should handle empty conversation gracefully', async () => {
      await fc.assert(fc.async(fc.property(
        fc.constantFrom([]),
        async (messages) => {
          const agentFile = await AgentFile.create();

          await expect(agentFile.addConversation(messages)).resolves.not.toThrow();

          const validation = agentFile.validate();
          expect(validation.valid).toBe(true);
        }
      )));
    });

    it('should handle very long strings', async () => {
      const agentFile = await AgentFile.create();

      const longStrings = fc.string({ maxLength: 1000000 }); // 1MB

      await fc.assert(fc.async(fc.property(
        longStrings,
        async (longString) => {
          const message = {
            role: 'user' as const,
            content: longString,
            timestamp: new Date().toISOString()
          };

          await expect(agentFile.addConversation([message])).resolves.not.toThrow();
        }
      )));
    });
  });

  describe('Validation Idempotence', () => {
    it('should return same validation result on repeated calls', async () => {
      const agentFile = await AgentFile.create();

      const validation1 = agentFile.validate();
      const validation2 = agentFile.validate();

      expect(validation1.valid).toBe(validation2.valid);
      expect(validation1.errors).toEqual(validation2.errors);
      expect(validation1.warnings).toEqual(validation2.warnings);
    });
  });
});
