import quizTemplatesData from "./quiz-templates.json";

// Type definitions based on the schema
type QuantifierType = "all" | "none" | "some" | "some_none" | "unknown";

interface Statement {
  type: Exclude<QuantifierType, "unknown">;
  subject: "X" | "Y" | "Z";
  object: "X" | "Y" | "Z";
}

interface Conclusion {
  type: QuantifierType;
  subject: "X" | "Y" | "Z";
  object: "X" | "Y" | "Z";
}

interface QuizTemplate {
  statements: [Statement, Statement];
  correct: Conclusion[];
}

interface QuizData {
  $schema: string;
  data: QuizTemplate[];
}

describe("Quiz Templates Data Validation", () => {
  const { data } = quizTemplatesData as QuizData;

  describe("Syllogistic Logic Rules", () => {
    it("should validate all-all chain produces all conclusion (Barbara syllogism)", () => {
      // Find: All X are Y, All Y are Z → All X are Z
      const barbaraTemplate = data.find(
        (t) =>
          t.statements[0].type === "all" &&
          t.statements[1].type === "all" &&
          t.statements[0].object === t.statements[1].subject
      );

      expect(barbaraTemplate).toBeDefined();
      expect(barbaraTemplate!.correct).toHaveLength(1);
      expect(barbaraTemplate!.correct[0].type).toBe("all");
      expect(barbaraTemplate!.correct[0].subject).toBe(
        barbaraTemplate!.statements[0].subject
      );
      expect(barbaraTemplate!.correct[0].object).toBe(
        barbaraTemplate!.statements[1].object
      );
    });

    it("should validate all-none chain produces none conclusions (Celarent syllogism)", () => {
      // Find: All X are Y, No Y are Z → No X are Z, No Z are X
      const celarentTemplate = data.find(
        (t) =>
          t.statements[0].type === "all" &&
          t.statements[1].type === "none" &&
          t.statements[0].object === t.statements[1].subject
      );

      expect(celarentTemplate).toBeDefined();
      expect(celarentTemplate!.correct).toHaveLength(2);
      celarentTemplate!.correct.forEach((answer) => {
        expect(answer.type).toBe("none");
      });
    });

    it("should validate some-all chain produces some conclusion (Darii syllogism)", () => {
      // Find: Some X are Y, All Y are Z → Some X are Z
      const dariiTemplate = data.find(
        (t) =>
          t.statements[0].type === "some" &&
          t.statements[1].type === "all" &&
          t.statements[0].object === t.statements[1].subject
      );

      expect(dariiTemplate).toBeDefined();
      expect(dariiTemplate!.correct).toHaveLength(1);
      expect(dariiTemplate!.correct[0].type).toBe("some");
    });

    it("should validate some-none chain produces some_none conclusion (Ferio syllogism)", () => {
      // Find: Some X are Y, No Y are Z → Some X are not Z
      const ferioTemplate = data.find(
        (t) =>
          t.statements[0].type === "some" &&
          t.statements[1].type === "none" &&
          t.statements[0].object === t.statements[1].subject
      );

      expect(ferioTemplate).toBeDefined();
      expect(ferioTemplate!.correct).toHaveLength(1);
      expect(ferioTemplate!.correct[0].type).toBe("some_none");
    });

    it("should validate same subject patterns produce valid conclusions", () => {
      // Find: All X are Y, All X are Z → Some Y are Z, Some Z are Y
      const sameSubjectTemplate = data.find(
        (t) =>
          t.statements[0].type === "all" &&
          t.statements[1].type === "all" &&
          t.statements[0].subject === t.statements[1].subject
      );

      expect(sameSubjectTemplate).toBeDefined();
      expect(sameSubjectTemplate!.correct).toHaveLength(2);
      sameSubjectTemplate!.correct.forEach((answer) => {
        expect(answer.type).toBe("some");
      });
    });
  });

  describe("Logical Completeness", () => {
    it("should cover all valid statement type combinations", () => {
      const combinations = new Set<string>();
      const statementTypes = ["all", "none", "some", "some_none"];

      data.forEach((template) => {
        const combo = `${template.statements[0].type}-${template.statements[1].type}`;
        combinations.add(combo);
      });

      // Should have 4×4 = 16 unique combinations
      expect(combinations.size).toBe(16);

      // Verify all theoretical combinations are present
      statementTypes.forEach((type1) => {
        statementTypes.forEach((type2) => {
          const expectedCombo = `${type1}-${type2}`;
          expect(combinations.has(expectedCombo)).toBe(true);
        });
      });
    });

    it("should cover all relationship patterns", () => {
      const patterns = new Set<string>();

      data.forEach((template) => {
        const stmt1 = template.statements[0];
        const stmt2 = template.statements[1];

        if (stmt1.object === stmt2.subject) {
          patterns.add("chain");
        } else if (stmt1.subject === stmt2.subject) {
          patterns.add("common-subject");
        } else if (stmt1.object === stmt2.object) {
          patterns.add("common-object");
        }
      });

      expect(patterns.has("chain")).toBe(true);
      expect(patterns.has("common-subject")).toBe(true);
      expect(patterns.has("common-object")).toBe(true);
      expect(patterns.size).toBe(3);
    });

    it("should have 16 templates per pattern (one per type combination)", () => {
      const patternCounts = {
        chain: 0,
        "common-subject": 0,
        "common-object": 0,
      };

      data.forEach((template) => {
        const stmt1 = template.statements[0];
        const stmt2 = template.statements[1];

        if (stmt1.object === stmt2.subject) {
          patternCounts.chain++;
        } else if (stmt1.subject === stmt2.subject) {
          patternCounts["common-subject"]++;
        } else if (stmt1.object === stmt2.object) {
          patternCounts["common-object"]++;
        }
      });

      expect(patternCounts.chain).toBe(16);
      expect(patternCounts["common-subject"]).toBe(16);
      expect(patternCounts["common-object"]).toBe(16);
    });
  });

  describe("Answer Consistency", () => {
    it("should have symmetric bidirectional relationships", () => {
      data.forEach((template, index) => {
        if (template.correct.length === 2) {
          const answer1 = template.correct[0];
          const answer2 = template.correct[1];

          // If both answers have the same type, they should be symmetric
          if (answer1.type === answer2.type) {
            const isSymmetric =
              answer1.subject === answer2.object &&
              answer1.object === answer2.subject;
            expect(isSymmetric).toBe(true);
          }
        }
      });
    });

    it("should not duplicate given statements in answers", () => {
      data.forEach((template, index) => {
        const statementPairs = new Set<string>();
        template.statements.forEach((stmt) => {
          statementPairs.add(`${stmt.type}:${stmt.subject}-${stmt.object}`);
        });

        template.correct.forEach((answer) => {
          const answerPair = `${answer.type}:${answer.subject}-${answer.object}`;
          expect(statementPairs.has(answerPair)).toBe(false);
        });
      });
    });

    it("should have all conclusion entities present in statements", () => {
      data.forEach((template, index) => {
        const statementEntities = new Set<string>();

        template.statements.forEach((stmt) => {
          statementEntities.add(stmt.subject);
          statementEntities.add(stmt.object);
        });

        template.correct.forEach((answer) => {
          expect(statementEntities.has(answer.subject)).toBe(true);
          expect(statementEntities.has(answer.object)).toBe(true);
        });
      });
    });
  });

  describe("Data Quality Checks", () => {
    it("should use consistent entity naming (X, Y, Z only)", () => {
      const allowedEntities = new Set(["X", "Y", "Z"]);

      data.forEach((template) => {
        template.statements.forEach((stmt) => {
          expect(allowedEntities.has(stmt.subject)).toBe(true);
          expect(allowedEntities.has(stmt.object)).toBe(true);
        });

        template.correct.forEach((answer) => {
          expect(allowedEntities.has(answer.subject)).toBe(true);
          expect(allowedEntities.has(answer.object)).toBe(true);
        });
      });
    });

    it("should not have reflexive relationships", () => {
      data.forEach((template) => {
        template.statements.forEach((stmt) => {
          expect(stmt.subject).not.toBe(stmt.object);
        });

        template.correct.forEach((answer) => {
          expect(answer.subject).not.toBe(answer.object);
        });
      });
    });

    it("should have meaningful conclusions (not empty correct arrays)", () => {
      data.forEach((template, index) => {
        expect(template.correct.length).toBeGreaterThan(0);
        expect(template.correct.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe("Golden Rules of Implication", () => {
    function containsType(statements: Statement[], type: QuantifierType) {
      return statements.some((s) => s.type === type);
    }

    it('Rule 1: Two statements using "some" can never result in a valid conclusion', () => {
      const matches = data.filter((t) =>
        t.statements.every((s) => s.type === "some")
      );

      matches.forEach((t) => {
        t.correct.forEach((c) => {
          expect(c.type).toBe("unknown");
        });
      });
    });

    it('Rule 2: Two statements using "none" can never result in a valid conclusion', () => {
      const matches = data.filter((t) =>
        t.statements.every((s) => s.type === "none")
      );

      matches.forEach((t) => {
        t.correct.forEach((c) => {
          expect(c.type).toBe("unknown");
        });
      });
    });

    it('Rule 3: If none of the statements use "none", then the conclusion must not use "none" either', () => {
      const matches = data.filter((t) => !containsType(t.statements, "none"));

      matches.forEach((t) => {
        t.correct.forEach((c) => {
          expect(c.type).not.toBe("none");
        });
      });
    });

    it('Rule 4: If one of the statements uses "none", then the conclusion must also use "none"', () => {
      const matches = data.filter(
        (t) =>
          containsType(t.statements, "none") ||
          containsType(t.statements, "some_none")
      );

      matches.forEach((t) => {
        const types = t.correct.map((c) => c.type);
        expect(
          types.every(
            (type) =>
              type === "none" || type === "some_none" || type === "unknown"
          )
        ).toBe(true);
      });
    });

    it('Rule 5: If one of the statements uses "some", then the conclusion must also use "some"', () => {
      const matches = data.filter(
        (t) =>
          containsType(t.statements, "some") ||
          containsType(t.statements, "some_none")
      );

      matches.forEach((t) => {
        const types = t.correct.map((c) => c.type);
        expect(
          types.every(
            (type) =>
              type === "some" || type === "some_none" || type === "unknown"
          )
        ).toBe(true);
      });
    });
  });

  describe("Performance and Integration", () => {
    it("should be efficiently processable", () => {
      const startTime = Date.now();

      // Simulate typical processing operations
      let processedCount = 0;
      data.forEach((template) => {
        template.statements.forEach(() => processedCount++);
        template.correct.forEach(() => processedCount++);
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processedCount).toBe(
        96 + data.reduce((sum, t) => sum + t.correct.length, 0)
      );
      expect(processingTime).toBeLessThan(100); // Should be very fast
    });

    it("should serialize to valid JSON", () => {
      expect(() => {
        JSON.stringify(quizTemplatesData);
      }).not.toThrow();
    });

    it("should have reasonable file size", () => {
      const serialized = JSON.stringify(quizTemplatesData);
      const sizeKB = serialized.length / 1024;

      // Should be under 20KB for good performance
      expect(sizeKB).toBeLessThan(20);
    });
  });
});
