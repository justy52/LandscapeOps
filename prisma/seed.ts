/**
 * LandscapeOps — local development seed data
 *
 * Creates a demo org with two user profiles, three customers, and two leads.
 * No financial records (estimates, invoices, payments) are seeded.
 *
 * Run: npx prisma db seed
 * Uses: tsx (configured in package.json prisma.seed)
 *
 * DO NOT run against the production database.
 * These records use placeholder Clerk IDs that will not match real sessions.
 */

import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
  throw new Error("Refusing to run demo seed data in a production environment.");
}

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data…");

  // ── Organization ──────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { clerkOrgId: "demo_org_seed_001" },
    create: {
      clerkOrgId: "demo_org_seed_001",
      name: "Acme Landscaping",
      slug: "acme-landscaping",
    },
    update: {
      name: "Acme Landscaping",
      slug: "acme-landscaping",
    },
  });

  console.log("  org:", org.id, org.name);

  // ── User Profiles ──────────────────────────────────────────────────────────
  const owner = await prisma.userProfile.upsert({
    where: { orgId_clerkUserId: { orgId: org.id, clerkUserId: "demo_user_owner_001" } },
    create: {
      orgId: org.id,
      clerkUserId: "demo_user_owner_001",
      email: "owner@acme-landscaping.example",
      name: "Jordan Mercer",
      role: "OWNER",
    },
    update: { role: "OWNER" },
  });

  const manager = await prisma.userProfile.upsert({
    where: { orgId_clerkUserId: { orgId: org.id, clerkUserId: "demo_user_manager_001" } },
    create: {
      orgId: org.id,
      clerkUserId: "demo_user_manager_001",
      email: "alex@acme-landscaping.example",
      name: "Alex Rivera",
      role: "MANAGER",
    },
    update: { role: "MANAGER" },
  });

  console.log("  profiles:", owner.id, owner.role, "|", manager.id, manager.role);

  // ── Customers ──────────────────────────────────────────────────────────────
  const residential = await prisma.customer.upsert({
    where: { id: "seed_customer_residential_001" },
    create: {
      id: "seed_customer_residential_001",
      orgId: org.id,
      name: "Sarah Chen",
      email: "schen@example.com",
      phone: "555-0101",
      addressLine1: "42 Juniper Ridge Rd",
      city: "Boulder",
      state: "CO",
      postalCode: "80302",
      notes: "HOA-governed front yard. Prefers early morning appointments.",
    },
    update: {},
  });

  const commercial = await prisma.customer.upsert({
    where: { id: "seed_customer_commercial_001" },
    create: {
      id: "seed_customer_commercial_001",
      orgId: org.id,
      name: "Northline Retail Group",
      companyName: "Northline Retail Group LLC",
      email: "facilities@northlineretail.example",
      phone: "555-0202",
      addressLine1: "1400 Commerce Park Dr",
      city: "Broomfield",
      state: "CO",
      postalCode: "80021",
      notes: "Plaza property manager. Requires COI before any site visit.",
    },
    update: {},
  });

  const hoa = await prisma.customer.upsert({
    where: { id: "seed_customer_hoa_001" },
    create: {
      id: "seed_customer_hoa_001",
      orgId: org.id,
      name: "Stonegate HOA",
      companyName: "Stonegate Homeowners Association",
      email: "board@stonegate-hoa.example",
      phone: "555-0303",
      addressLine1: "500 Stonegate Blvd",
      city: "Parker",
      state: "CO",
      postalCode: "80134",
      notes: "Annual maintenance contract. Gate code: 4421. Board approval required for all enhancements.",
    },
    update: {},
  });

  console.log("  customers:", residential.id, "|", commercial.id, "|", hoa.id);

  // ── Leads ──────────────────────────────────────────────────────────────────
  const newLead = await prisma.lead.upsert({
    where: { id: "seed_lead_new_001" },
    create: {
      id: "seed_lead_new_001",
      orgId: org.id,
      customerId: residential.id,
      assignedToId: manager.id,
      title: "Backyard renovation and irrigation install",
      source: "Referral",
      status: "QUALIFIED",
      budgetCents: 1850000,
      siteAddress: "42 Juniper Ridge Rd, Boulder, CO 80302",
      nextActionAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      notes: "Client wants xeriscape with native plantings and drip irrigation. Estimate needed this week.",
    },
    update: {},
  });

  const contactedLead = await prisma.lead.upsert({
    where: { id: "seed_lead_contacted_001" },
    create: {
      id: "seed_lead_contacted_001",
      orgId: org.id,
      customerId: commercial.id,
      assignedToId: manager.id,
      title: "Parking lot island redesign and seasonal color",
      source: "Cold outreach",
      status: "CONTACTED",
      budgetCents: 3200000,
      siteAddress: "1400 Commerce Park Dr, Broomfield, CO 80021",
      nextActionAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      notes: "Facilities manager responded. Needs proposal with before/after rendering.",
    },
    update: {},
  });

  console.log("  leads:", newLead.id, newLead.status, "|", contactedLead.id, contactedLead.status);

  // ── Audit log entry for seed run ───────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      actorId: null,
      action: "seed.ran",
      entityType: "Organization",
      entityId: org.id,
      metadata: { seededAt: new Date().toISOString(), environment: process.env.NODE_ENV },
    },
  });

  console.log("Seeding complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
