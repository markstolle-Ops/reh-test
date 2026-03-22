import { describe, it, expect } from "vitest";
import {
  getFormSchemaForState,
  getAvailableFormSchemas,
  LAUNCH_STATE_SCHEMAS,
} from "./form-schema";

describe("form-schema", () => {
  describe("LAUNCH_STATE_SCHEMAS", () => {
    it("has entries for all 51 states (50 states + DC)", () => {
      const states = Object.keys(LAUNCH_STATE_SCHEMAS);
      // Original 10 launch states
      expect(states).toContain("CA");
      expect(states).toContain("TX");
      expect(states).toContain("FL");
      expect(states).toContain("NY");
      expect(states).toContain("GA");
      expect(states).toContain("NC");
      expect(states).toContain("AZ");
      expect(states).toContain("OH");
      expect(states).toContain("PA");
      expect(states).toContain("IL");
      // New states — spot checks
      expect(states).toContain("WA");
      expect(states).toContain("CO");
      expect(states).toContain("DC");
      expect(states).toHaveLength(51);
    });
  });

  describe("getFormSchemaForState", () => {
    it("returns California TDS schema with required=true", () => {
      const schema = getFormSchemaForState("CA");
      expect(schema).not.toBeNull();
      expect(schema!.state).toBe("CA");
      expect(schema!.formName).toBeTruthy();
      expect(schema!.required).toBe(true);
    });

    it("returns Georgia schema with required=false", () => {
      const schema = getFormSchemaForState("GA");
      expect(schema).not.toBeNull();
      expect(schema!.state).toBe("GA");
      expect(schema!.required).toBe(false);
    });

    it("returns null for unknown state", () => {
      const schema = getFormSchemaForState("ZZ");
      expect(schema).toBeNull();
    });

    it("CA schema has fields as parseable JSON array", () => {
      const schema = getFormSchemaForState("CA");
      const fields = JSON.parse(schema!.fields);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
    });

    it("each field has required shape properties", () => {
      const schema = getFormSchemaForState("CA");
      const fields = JSON.parse(schema!.fields);
      for (const field of fields) {
        expect(field).toHaveProperty("id");
        expect(field).toHaveProperty("label");
        expect(field).toHaveProperty("type");
        expect(field).toHaveProperty("section");
        expect(["text", "textarea", "boolean", "select"]).toContain(field.type);
      }
    });

    it("TX schema has fields for TREC Form OP-H structure", () => {
      const schema = getFormSchemaForState("TX");
      expect(schema).not.toBeNull();
      const fields = JSON.parse(schema!.fields);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
    });

    it("returns WA schema with valid fields JSON", () => {
      const schema = getFormSchemaForState("WA");
      expect(schema).not.toBeNull();
      expect(schema!.state).toBe("WA");
      expect(schema!.required).toBe(true);
      const fields = JSON.parse(schema!.fields);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
    });

    it("returns CO schema with valid fields JSON", () => {
      const schema = getFormSchemaForState("CO");
      expect(schema).not.toBeNull();
      expect(schema!.state).toBe("CO");
      expect(schema!.required).toBe(true);
      const fields = JSON.parse(schema!.fields);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
    });

    it("returns DC schema with valid fields JSON", () => {
      const schema = getFormSchemaForState("DC");
      expect(schema).not.toBeNull();
      expect(schema!.state).toBe("DC");
      expect(schema!.required).toBe(true);
      const fields = JSON.parse(schema!.fields);
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
    });

    it("all 51 schemas have valid JSON in fields property", () => {
      for (const schema of Object.values(LAUNCH_STATE_SCHEMAS)) {
        let fields: unknown;
        expect(() => {
          fields = JSON.parse(schema.fields);
        }).not.toThrow();
        expect(Array.isArray(fields)).toBe(true);
        expect((fields as unknown[]).length).toBeGreaterThan(0);
      }
    });
  });

  describe("getAvailableFormSchemas", () => {
    it("returns schemas for all 51 states (50 states + DC)", () => {
      const schemas = getAvailableFormSchemas();
      expect(schemas).toHaveLength(51);
    });

    it("each returned schema has state, formName, version, fields, required", () => {
      const schemas = getAvailableFormSchemas();
      for (const schema of schemas) {
        expect(schema).toHaveProperty("state");
        expect(schema).toHaveProperty("formName");
        expect(schema).toHaveProperty("version", "1.0");
        expect(schema).toHaveProperty("fields");
        expect(typeof schema.required).toBe("boolean");
      }
    });
  });
});
