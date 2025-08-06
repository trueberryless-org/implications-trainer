import quizTemplatesData from './quiz-templates.json';

// Type definitions based on the schema
type QuantifierType = 'all' | 'none' | 'some' | 'some_none' | 'unknown';

interface Statement {
  type: Exclude<QuantifierType, 'unknown'>;
  subject: 'X' | 'Y' | 'Z';
  object: 'X' | 'Y' | 'Z';
}

interface Conclusion {
  type: QuantifierType;
  subject: 'X' | 'Y' | 'Z';
  object: 'X' | 'Y' | 'Z';
}

interface QuizTemplate {
  statements: [Statement, Statement];
  correct: Conclusion[];
}

interface QuizData {
  $schema: string;
  data: QuizTemplate[];
}

describe('Quiz Templates Data Validation', () => {
  const { data } = quizTemplatesData as QuizData;

  describe('Schema Compliance', () => {
    it('should reference correct schema file', () => {
      expect(quizTemplatesData.$schema).toBe('./schema.json');
    });

    it('should have data array as required property', () => {
      expect(quizTemplatesData).toHaveProperty('data');
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should contain exactly 48 quiz templates', () => {
      expect(data.length).toBe(48);
    });
  });

  describe('Template Structure Validation', () => {
    it('should have required properties for every template', () => {
      data.forEach((template, index) => {
        expect(template).toHaveProperty('statements');
        expect(template).toHaveProperty('correct');
        expect(Array.isArray(template.statements)).toBe(true);
        expect(Array.isArray(template.correct)).toBe(true);
        expect(template.statements).toHaveLength(2);
        expect(template.correct.length).toBeGreaterThan(0);
      });
    });

    it('should have valid statement structure', () => {
      const validStatementTypes = ['all', 'none', 'some', 'some_none'];
      const validEntities = ['X', 'Y', 'Z'];
      
      data.forEach((template, templateIndex) => {
        template.statements.forEach((statement, statementIndex) => {
          expect(statement).toHaveProperty('type');
          expect(statement).toHaveProperty('subject');
          expect(statement).toHaveProperty('object');
          expect(validStatementTypes).toContain(statement.type);
          expect(validEntities).toContain(statement.subject);
          expect(validEntities).toContain(statement.object);
          expect(statement.subject).not.toBe(statement.object);
        });
      });
    });

    it('should have valid conclusion structure', () => {
      const validConclusionTypes = ['all', 'none', 'some', 'some_none', 'unknown'];
      const validEntities = ['X', 'Y', 'Z'];
      
      data.forEach((template, templateIndex) => {
        template.correct.forEach((answer, answerIndex) => {
          expect(answer).toHaveProperty('type');
          expect(answer).toHaveProperty('subject');
          expect(answer).toHaveProperty('object');
          expect(validConclusionTypes).toContain(answer.type);
          expect(validEntities).toContain(answer.subject);
          expect(validEntities).toContain(answer.object);
          expect(answer.subject).not.toBe(answer.object);
        });
      });
    });

    it('should not have additional properties', () => {
      data.forEach(template => {
        const allowedKeys = ['statements', 'correct'];
        const templateKeys = Object.keys(template);
        templateKeys.forEach(key => {
          expect(allowedKeys).toContain(key);
        });
      });
    });
  });

  describe('Syllogistic Logic Rules', () => {
    it('should validate all-all chain produces all conclusion (Barbara syllogism)', () => {
      // Find: All X are Y, All Y are Z → All X are Z
      const barbaraTemplate = data.find(t => 
        t.statements[0].type === 'all' && 
        t.statements[1].type === 'all' &&
        t.statements[0].object === t.statements[1].subject
      );
      
      expect(barbaraTemplate).toBeDefined();
      expect(barbaraTemplate!.correct).toHaveLength(1);
      expect(barbaraTemplate!.correct[0].type).toBe('all');
      expect(barbaraTemplate!.correct[0].subject).toBe(barbaraTemplate!.statements[0].subject);
      expect(barbaraTemplate!.correct[0].object).toBe(barbaraTemplate!.statements[1].object);
    });

    it('should validate all-none chain produces none conclusions (Celarent syllogism)', () => {
      // Find: All X are Y, No Y are Z → No X are Z, No Z are X
      const celarentTemplate = data.find(t => 
        t.statements[0].type === 'all' && 
        t.statements[1].type === 'none' &&
        t.statements[0].object === t.statements[1].subject
      );
      
      expect(celarentTemplate).toBeDefined();
      expect(celarentTemplate!.correct).toHaveLength(2);
      celarentTemplate!.correct.forEach(answer => {
        expect(answer.type).toBe('none');
      });
    });

    it('should validate some-all chain produces some conclusion (Darii syllogism)', () => {
      // Find: Some X are Y, All Y are Z → Some X are Z
      const dariiTemplate = data.find(t => 
        t.statements[0].type === 'some' && 
        t.statements[1].type === 'all' &&
        t.statements[0].object === t.statements[1].subject
      );
      
      expect(dariiTemplate).toBeDefined();
      expect(dariiTemplate!.correct).toHaveLength(1);
      expect(dariiTemplate!.correct[0].type).toBe('some');
    });

    it('should validate some-none chain produces some_none conclusion (Ferio syllogism)', () => {
      // Find: Some X are Y, No Y are Z → Some X are not Z
      const ferioTemplate = data.find(t => 
        t.statements[0].type === 'some' && 
        t.statements[1].type === 'none' &&
        t.statements[0].object === t.statements[1].subject
      );
      
      expect(ferioTemplate).toBeDefined();
      expect(ferioTemplate!.correct).toHaveLength(1);
      expect(ferioTemplate!.correct[0].type).toBe('some_none');
    });

    it('should validate same subject patterns produce valid conclusions', () => {
      // Find: All X are Y, All X are Z → Some Y are Z, Some Z are Y
      const sameSubjectTemplate = data.find(t => 
        t.statements[0].type === 'all' && 
        t.statements[1].type === 'all' &&
        t.statements[0].subject === t.statements[1].subject
      );
      
      expect(sameSubjectTemplate).toBeDefined();
      expect(sameSubjectTemplate!.correct).toHaveLength(2);
      sameSubjectTemplate!.correct.forEach(answer => {
        expect(answer.type).toBe('some');
      });
    });

    it('should validate converging patterns follow logical rules', () => {
      // Find: All Y are X, All Z are X → Unknown relationship between Y and Z
      const convergingTemplate = data.find(t => 
        t.statements[0].type === 'all' && 
        t.statements[1].type === 'all' &&
        t.statements[0].object === t.statements[1].object &&
        t.statements[0].subject !== t.statements[1].subject
      );
      
      expect(convergingTemplate).toBeDefined();
      expect(convergingTemplate!.correct).toHaveLength(2);
      convergingTemplate!.correct.forEach(answer => {
        expect(answer.type).toBe('unknown');
      });
    });
  });

  describe('Logical Completeness', () => {
    it('should cover all valid statement type combinations', () => {
      const combinations = new Set<string>();
      const statementTypes = ['all', 'none', 'some', 'some_none'];
      
      data.forEach(template => {
        const combo = `${template.statements[0].type}-${template.statements[1].type}`;
        combinations.add(combo);
      });
      
      // Should have 4×4 = 16 unique combinations
      expect(combinations.size).toBe(16);
      
      // Verify all theoretical combinations are present
      statementTypes.forEach(type1 => {
        statementTypes.forEach(type2 => {
          const expectedCombo = `${type1}-${type2}`;
          expect(combinations.has(expectedCombo)).toBe(true);
        });
      });
    });

    it('should cover all relationship patterns', () => {
      const patterns = new Set<string>();
      
      data.forEach(template => {
        const stmt1 = template.statements[0];
        const stmt2 = template.statements[1];
        
        if (stmt1.object === stmt2.subject) {
          patterns.add('chain');
        } else if (stmt1.subject === stmt2.subject) {
          patterns.add('common-subject');
        } else if (stmt1.object === stmt2.object) {
          patterns.add('common-object');
        }
      });
      
      expect(patterns.has('chain')).toBe(true);
      expect(patterns.has('common-subject')).toBe(true);
      expect(patterns.has('common-object')).toBe(true);
      expect(patterns.size).toBe(3);
    });

    it('should have 16 templates per pattern (one per type combination)', () => {
      const patternCounts = {
        chain: 0,
        'common-subject': 0,
        'common-object': 0
      };
      
      data.forEach(template => {
        const stmt1 = template.statements[0];
        const stmt2 = template.statements[1];
        
        if (stmt1.object === stmt2.subject) {
          patternCounts.chain++;
        } else if (stmt1.subject === stmt2.subject) {
          patternCounts['common-subject']++;
        } else if (stmt1.object === stmt2.object) {
          patternCounts['common-object']++;
        }
      });
      
      expect(patternCounts.chain).toBe(16);
      expect(patternCounts['common-subject']).toBe(16);
      expect(patternCounts['common-object']).toBe(16);
    });
  });

  describe('Answer Consistency', () => {
    it('should have symmetric bidirectional relationships', () => {
      data.forEach((template, index) => {
        if (template.correct.length === 2) {
          const answer1 = template.correct[0];
          const answer2 = template.correct[1];
          
          // If both answers have the same type, they should be symmetric
          if (answer1.type === answer2.type) {
            const isSymmetric = 
              (answer1.subject === answer2.object && 
               answer1.object === answer2.subject);
            expect(isSymmetric).toBe(true);
          }
        }
      });
    });

    it('should not duplicate given statements in answers', () => {
      data.forEach((template, index) => {
        const statementPairs = new Set<string>();
        template.statements.forEach(stmt => {
          statementPairs.add(`${stmt.type}:${stmt.subject}-${stmt.object}`);
        });
        
        template.correct.forEach(answer => {
          const answerPair = `${answer.type}:${answer.subject}-${answer.object}`;
          expect(statementPairs.has(answerPair)).toBe(false);
        });
      });
    });

    it('should have all conclusion entities present in statements', () => {
      data.forEach((template, index) => {
        const statementEntities = new Set<string>();
        
        template.statements.forEach(stmt => {
          statementEntities.add(stmt.subject);
          statementEntities.add(stmt.object);
        });
        
        template.correct.forEach(answer => {
          expect(statementEntities.has(answer.subject)).toBe(true);
          expect(statementEntities.has(answer.object)).toBe(true);
        });
      });
    });
  });

  describe('Data Quality Checks', () => {
    it('should use consistent entity naming (X, Y, Z only)', () => {
      const allowedEntities = new Set(['X', 'Y', 'Z']);
      
      data.forEach(template => {
        template.statements.forEach(stmt => {
          expect(allowedEntities.has(stmt.subject)).toBe(true);
          expect(allowedEntities.has(stmt.object)).toBe(true);
        });
        
        template.correct.forEach(answer => {
          expect(allowedEntities.has(answer.subject)).toBe(true);
          expect(allowedEntities.has(answer.object)).toBe(true);
        });
      });
    });

    it('should not have reflexive relationships', () => {
      data.forEach(template => {
        template.statements.forEach(stmt => {
          expect(stmt.subject).not.toBe(stmt.object);
        });
        
        template.correct.forEach(answer => {
          expect(answer.subject).not.toBe(answer.object);
        });
      });
    });

    it('should have meaningful conclusions (not empty correct arrays)', () => {
      data.forEach((template, index) => {
        expect(template.correct.length).toBeGreaterThan(0);
        expect(template.correct.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Performance and Integration', () => {
    it('should be efficiently processable', () => {
      const startTime = Date.now();
      
      // Simulate typical processing operations
      let processedCount = 0;
      data.forEach(template => {
        template.statements.forEach(() => processedCount++);
        template.correct.forEach(() => processedCount++);
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processedCount).toBe(96 + data.reduce((sum, t) => sum + t.correct.length, 0));
      expect(processingTime).toBeLessThan(100); // Should be very fast
    });

    it('should serialize to valid JSON', () => {
      expect(() => {
        JSON.stringify(quizTemplatesData);
      }).not.toThrow();
    });

    it('should have reasonable file size', () => {
      const serialized = JSON.stringify(quizTemplatesData);
      const sizeKB = serialized.length / 1024;
      
      // Should be under 20KB for good performance
      expect(sizeKB).toBeLessThan(20);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle template enumeration correctly', () => {
      // Test that we can iterate through all templates without errors
      let templateCount = 0;
      for (const template of data) {
        expect(template.statements).toHaveLength(2);
        expect(template.correct.length).toBeGreaterThan(0);
        templateCount++;
      }
      expect(templateCount).toBe(48);
    });

    it('should maintain consistent ordering', () => {
      // First template should be the all-all chain case
      const firstTemplate = data[0];
      expect(firstTemplate.statements[0].type).toBe('all');
      expect(firstTemplate.statements[1].type).toBe('all');
      expect(firstTemplate.statements[0].object).toBe(firstTemplate.statements[1].subject);
    });

    it('should not have duplicate templates', () => {
      const templateStrings = new Set<string>();
      
      data.forEach(template => {
        const templateString = JSON.stringify({
          statements: template.statements.sort(),
          correct: template.correct.sort()
        });
        
        expect(templateStrings.has(templateString)).toBe(false);
        templateStrings.add(templateString);
      });
      
      expect(templateStrings.size).toBe(48);
    });

    it('should handle malformed data gracefully', () => {
      // Test with empty data scenario
      const emptyData: QuizTemplate[] = [];
      expect(Array.isArray(emptyData)).toBe(true);
      expect(emptyData.length).toBe(0);
      
      // Test data access doesn't throw
      expect(() => data[0].statements[0].type).not.toThrow();
      expect(() => data[data.length - 1].correct[0].type).not.toThrow();
    });
  });

  describe('Specific Template Validation', () => {
    it('should validate first template (all-all chain)', () => {
      const template0 = data[0];
      expect(template0.statements[0]).toEqual({ type: 'all', subject: 'X', object: 'Y' });
      expect(template0.statements[1]).toEqual({ type: 'all', subject: 'Y', object: 'Z' });
      expect(template0.correct[0]).toEqual({ type: 'all', subject: 'X', object: 'Z' });
    });

    it('should validate template with some-none combination', () => {
      const someNoneTemplate = data.find(t => 
        t.statements[0].type === 'some' && 
        t.statements[1].type === 'none' &&
        t.statements[0].object === t.statements[1].subject
      );
      
      expect(someNoneTemplate).toBeDefined();
      expect(someNoneTemplate!.correct[0].type).toBe('some_none');
      expect(someNoneTemplate!.correct[0].subject).toBe(someNoneTemplate!.statements[0].subject);
      expect(someNoneTemplate!.correct[0].object).toBe(someNoneTemplate!.statements[1].object);
    });

    it('should validate templates with unknown conclusions', () => {
      const unknownTemplates = data.filter(t => 
        t.correct.every(answer => answer.type === 'unknown')
      );
      
      expect(unknownTemplates.length).toBeGreaterThan(20);
      
      unknownTemplates.forEach(template => {
        expect(template.correct).toHaveLength(2);
        // Should be bidirectional unknown relationships
        const answer1 = template.correct[0];
        const answer2 = template.correct[1];
        expect(answer1.subject).toBe(answer2.object);
        expect(answer1.object).toBe(answer2.subject);
      });
    });

    it('should validate some_none template logic', () => {
      const someNoneTemplate = data.find(t => 
        t.statements[0].type === 'all' && 
        t.statements[1].type === 'some_none' &&
        t.statements[0].subject === t.statements[1].subject
      );
      
      expect(someNoneTemplate).toBeDefined();
      expect(someNoneTemplate!.correct).toHaveLength(1);
      expect(someNoneTemplate!.correct[0].type).toBe('some_none');
    });
  });

  describe('Mathematical Properties', () => {
    it('should have balanced distribution of conclusion types', () => {
      const conclusionCounts = {
        all: 0,
        none: 0,
        some: 0,
        some_none: 0,
        unknown: 0
      };
      
      data.forEach(template => {
        template.correct.forEach(answer => {
          conclusionCounts[answer.type]++;
        });
      });
      
      // Should have some of each type
      Object.values(conclusionCounts).forEach(count => {
        expect(count).toBeGreaterThan(0);
      });
      
      // Unknown should be the most common due to logical indeterminacy
      expect(conclusionCounts.unknown).toBeGreaterThan(conclusionCounts.all);
    });

    it('should maintain logical closure properties', () => {
      data.forEach((template, index) => {
        const stmt1 = template.statements[0];
        const stmt2 = template.statements[1];
        
        template.correct.forEach(answer => {
          // Verify that the conclusion entities come from the premises
          const allEntities = new Set([stmt1.subject, stmt1.object, stmt2.subject, stmt2.object]);
          expect(allEntities.has(answer.subject)).toBe(true);
          expect(allEntities.has(answer.object)).toBe(true);
        });
      });
    });

    it('should have proper total count of statements and conclusions', () => {
      const totalStatements = data.reduce((sum, template) => sum + template.statements.length, 0);
      const totalConclusions = data.reduce((sum, template) => sum + template.correct.length, 0);
      
      expect(totalStatements).toBe(96); // 48 templates × 2 statements
      expect(totalConclusions).toBeGreaterThan(48); // Variable number based on logic
      expect(totalConclusions).toBeLessThan(96); // Should be less than double
    });
  });

  describe('Integration with API Usage', () => {
    it('should be compatible with quiz API expectations', () => {
      // Simulate how the data might be used in the API
      data.forEach(template => {
        // Check that each template can be processed for quiz generation
        expect(template.statements.length).toBe(2);
        expect(template.correct.length).toBeGreaterThanOrEqual(1);
        
        // Check that we can extract question data
        const questionText = `Given: ${template.statements[0].type} ${template.statements[0].subject} are ${template.statements[0].object}, and ${template.statements[1].type} ${template.statements[1].subject} are ${template.statements[1].object}`;
        expect(questionText.length).toBeGreaterThan(10);
        
        // Check that we can format answers
        template.correct.forEach(answer => {
          const answerText = `${answer.type} ${answer.subject} are ${answer.object}`;
          expect(answerText.length).toBeGreaterThan(5);
        });
      });
    });

    it('should support random template selection', () => {
      // Test random access patterns that might be used in the API
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomTemplate = data[randomIndex];
        
        expect(randomTemplate).toBeDefined();
        expect(randomTemplate.statements).toHaveLength(2);
        expect(randomTemplate.correct.length).toBeGreaterThan(0);
      }
    });
  });
});