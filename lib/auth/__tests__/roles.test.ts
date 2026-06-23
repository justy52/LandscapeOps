import { describe, it, expect } from "vitest";
import { ROLE_RANK, hasMinimumRole, mapClerkRole } from "../roles";

// ─────────────────────────────────────────────────────────────────────────────
// ROLE_RANK ordering
// ─────────────────────────────────────────────────────────────────────────────

describe("ROLE_RANK", () => {
  it("OWNER outranks all others", () => {
    expect(ROLE_RANK.OWNER).toBeGreaterThan(ROLE_RANK.ADMIN);
    expect(ROLE_RANK.OWNER).toBeGreaterThan(ROLE_RANK.MANAGER);
    expect(ROLE_RANK.OWNER).toBeGreaterThan(ROLE_RANK.FIELD);
    expect(ROLE_RANK.OWNER).toBeGreaterThan(ROLE_RANK.MEMBER);
  });

  it("ADMIN outranks MANAGER, FIELD, MEMBER", () => {
    expect(ROLE_RANK.ADMIN).toBeGreaterThan(ROLE_RANK.MANAGER);
    expect(ROLE_RANK.ADMIN).toBeGreaterThan(ROLE_RANK.FIELD);
    expect(ROLE_RANK.ADMIN).toBeGreaterThan(ROLE_RANK.MEMBER);
  });

  it("MANAGER outranks FIELD and MEMBER", () => {
    expect(ROLE_RANK.MANAGER).toBeGreaterThan(ROLE_RANK.FIELD);
    expect(ROLE_RANK.MANAGER).toBeGreaterThan(ROLE_RANK.MEMBER);
  });

  it("FIELD outranks MEMBER", () => {
    expect(ROLE_RANK.FIELD).toBeGreaterThan(ROLE_RANK.MEMBER);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hasMinimumRole
// ─────────────────────────────────────────────────────────────────────────────

describe("hasMinimumRole", () => {
  it("OWNER passes every role check", () => {
    expect(hasMinimumRole("OWNER", "OWNER")).toBe(true);
    expect(hasMinimumRole("OWNER", "ADMIN")).toBe(true);
    expect(hasMinimumRole("OWNER", "MANAGER")).toBe(true);
    expect(hasMinimumRole("OWNER", "FIELD")).toBe(true);
    expect(hasMinimumRole("OWNER", "MEMBER")).toBe(true);
  });

  it("ADMIN passes ADMIN and below, fails OWNER", () => {
    expect(hasMinimumRole("ADMIN", "OWNER")).toBe(false);
    expect(hasMinimumRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasMinimumRole("ADMIN", "MANAGER")).toBe(true);
    expect(hasMinimumRole("ADMIN", "FIELD")).toBe(true);
    expect(hasMinimumRole("ADMIN", "MEMBER")).toBe(true);
  });

  it("MANAGER passes MANAGER and below, fails OWNER and ADMIN", () => {
    expect(hasMinimumRole("MANAGER", "OWNER")).toBe(false);
    expect(hasMinimumRole("MANAGER", "ADMIN")).toBe(false);
    expect(hasMinimumRole("MANAGER", "MANAGER")).toBe(true);
    expect(hasMinimumRole("MANAGER", "FIELD")).toBe(true);
    expect(hasMinimumRole("MANAGER", "MEMBER")).toBe(true);
  });

  it("FIELD fails everything above FIELD", () => {
    expect(hasMinimumRole("FIELD", "OWNER")).toBe(false);
    expect(hasMinimumRole("FIELD", "ADMIN")).toBe(false);
    expect(hasMinimumRole("FIELD", "MANAGER")).toBe(false);
    expect(hasMinimumRole("FIELD", "FIELD")).toBe(true);
    expect(hasMinimumRole("FIELD", "MEMBER")).toBe(true);
  });

  it("MEMBER passes only MEMBER check", () => {
    expect(hasMinimumRole("MEMBER", "OWNER")).toBe(false);
    expect(hasMinimumRole("MEMBER", "ADMIN")).toBe(false);
    expect(hasMinimumRole("MEMBER", "MANAGER")).toBe(false);
    expect(hasMinimumRole("MEMBER", "FIELD")).toBe(false);
    expect(hasMinimumRole("MEMBER", "MEMBER")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mapClerkRole
// ─────────────────────────────────────────────────────────────────────────────

describe("mapClerkRole", () => {
  it('maps "org:admin" to ADMIN', () => {
    expect(mapClerkRole("org:admin")).toBe("ADMIN");
  });

  it('maps "org:member" to MEMBER', () => {
    expect(mapClerkRole("org:member")).toBe("MEMBER");
  });

  it("maps unknown Clerk roles to MEMBER as safe default", () => {
    expect(mapClerkRole("org:guest")).toBe("MEMBER");
    expect(mapClerkRole("org:viewer")).toBe("MEMBER");
    expect(mapClerkRole("")).toBe("MEMBER");
  });

  it("does not map to OWNER (OWNER is app-layer only, not sourced from Clerk)", () => {
    expect(mapClerkRole("org:admin")).not.toBe("OWNER");
    expect(mapClerkRole("org:owner")).not.toBe("OWNER");
  });
});
