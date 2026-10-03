import { describe, expect, it } from "vitest";
import Ajv from "ajv";

import quizTemplatesData from "../../../src/data/quiz-templates.json";
import schema from "../../../src/data/schema.json";

const ajv = new Ajv();
const validate = ajv.compile(schema);

describe("Schema validation", () => {
  it("schema.json should be a valid JSON Schema", () => {
    expect(() => ajv.compile(schema)).not.toThrow();
  });

  it("quiz-templates.json should match schema.json", () => {
    const valid = validate(quizTemplatesData);

    if (!valid) {
      console.error(validate.errors);
    }

    expect(valid).toBe(true);
  });
});
