import { relations } from "drizzle-orm";
import {
  boolean,
  geometry,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["buyer", "seller"]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "offer_submitted",
  "counter_pending",
  "offer_accepted",
  "attorney_review",
  "inspection_period",
  "financing_period",
  "pending_closing",
  "closed_won",
  "closed_lost",
]);

export const propertyTypeEnum = pgEnum("property_type", [
  "single_family",
  "condo",
  "townhouse",
  "land_lot",
]);

export const listingStatusEnum = pgEnum("listing_status", ["draft", "active", "pending", "sold"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").default("buyer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Listings ─────────────────────────────────────────────────────────────────

export const listings = pgTable("listings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  streetAddress: text("street_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  price: integer("price").notNull(), // in cents
  bedrooms: integer("bedrooms"), // nullable — land_lot allows null
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }), // nullable
  sqft: integer("sqft"),
  lotSizeSqft: integer("lot_size_sqft"),
  yearBuilt: integer("year_built"),
  description: text("description"),
  descriptionStatus: text("description_status").default("pending").notNull(),
  status: listingStatusEnum("status").default("draft").notNull(),
  photoOrder: text("photo_order").array().default([]).notNull(),
  // NOTE: location column is added via raw SQL migration (migrations/0001_add_postgis_location.sql)
  // Drizzle ignores SRID in DDL generation — this declaration is for type-safe queries only.
  location: geometry("location", { type: "point", mode: "xy", srid: 4326 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

// ─── Listing Photos ───────────────────────────────────────────────────────────

export const listingPhotos = pgTable("listing_photos", {
  id: text("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  r2Key: text("r2_key").notNull(),
  r2Url: text("r2_url").notNull(),
  width: integer("width"),
  height: integer("height"),
  sizeBytes: integer("size_bytes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// ─── Showing Requests ─────────────────────────────────────────────────────────

export const showingRequests = pgTable("showing_requests", {
  id: text("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  buyerUserId: text("buyer_user_id"),
  requestedDate: timestamp("requested_date").notNull(),
  status: text("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Knowledge Chunks ─────────────────────────────────────────────────────────
// Note: vector(1536) embedding column is added via raw SQL migration, not Drizzle schema.

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  state: text("state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Saved Listings ───────────────────────────────────────────────────────────
// Buyer favorites — toggles for both platform and MLS listings (SRCH-05)

export const savedListings = pgTable("saved_listings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  listingId: text("listing_id"), // platform listing (nullable)
  mlsListingId: text("mls_listing_id"), // MLS listing (nullable)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Saved Searches ───────────────────────────────────────────────────────────
// Buyer saved search filters + alert config (SRCH-04)

export const savedSearches = pgTable("saved_searches", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  filters: text("filters").notNull(), // JSON blob of SearchParams
  active: boolean("active").default(true).notNull(),
  lastAlertSentAt: timestamp("last_alert_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Disclosure Forms ─────────────────────────────────────────────────────────
// State disclosure form answers per listing (DISC-01/02/04)

export const disclosureForms = pgTable("disclosure_forms", {
  id: text("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id),
  userId: text("user_id").notNull(), // seller user ID
  state: text("state").notNull(),
  formSchemaId: text("form_schema_id").notNull(),
  answers: text("answers").notNull(), // JSON blob of field answers
  status: text("status").default("draft").notNull(), // draft | complete
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Disclosure Form Schemas ───────────────────────────────────────────────────
// Per-state form definitions — attorney-reviewed before activation (DISC-01)

export const disclosureFormSchemas = pgTable("disclosure_form_schemas", {
  id: text("id").primaryKey(),
  state: text("state").notNull(),
  formName: text("form_name").notNull(),
  version: text("version").notNull(),
  fields: text("fields").notNull(), // JSON schema for the form fields
  required: boolean("required").default(true).notNull(),
  attorneyReviewedAt: timestamp("attorney_reviewed_at"),
  attorneyName: text("attorney_name"),
  active: boolean("active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Signature Envelopes ──────────────────────────────────────────────────────
// SignWell document records + audit trails (SIGN-01/02/03)

export const signatureEnvelopes = pgTable("signature_envelopes", {
  id: text("id").primaryKey(),
  signwellDocumentId: text("signwell_document_id").notNull(),
  listingId: text("listing_id").references(() => listings.id),
  disclosureFormId: text("disclosure_form_id"),
  status: text("status").default("pending").notNull(), // pending | completed | declined
  auditTrail: text("audit_trail"), // JSON from SignWell webhook
  documentPdfR2Key: text("document_pdf_r2_key"), // R2 storage key for signed PDF
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ─── MLS Listings ─────────────────────────────────────────────────────────────
// SimplyRETS-ingested listings staging table (MLS-02/03)
// Note: geometry(point, 4326) column is added via raw SQL migration.

export const mlsListings = pgTable("mls_listings", {
  id: text("id").primaryKey(), // SimplyRETS mlsId or RESO ListingKey
  mlsSource: text("mls_source").notNull(), // "simplyrets" or "reso:{boardId}"
  rawData: text("raw_data").notNull(), // JSON blob from source
  streetAddress: text("street_address"), // RESO UnparsedAddress (Phase 6 addition)
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  price: integer("price"),
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }),
  sqft: integer("sqft"),
  propertyType: text("property_type"),
  status: text("status"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  photoUrls: text("photo_urls").array().default([]),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
});

// ─── RESO Boards ───────────────────────────────────────────────────────────────
// Per-board RESO Web API configuration for direct MLS integration (MLS-04)
// Each board has its own credentials, coverage states, and sync schedule.

export const resoBoards = pgTable("reso_boards", {
  id: text("id").primaryKey(), // e.g. "crmls"
  name: text("name").notNull(), // "CRMLS", "Bright MLS", etc.
  apiUrl: text("api_url").notNull(), // RESO Web API base URL
  apiToken: text("api_token").notNull(), // Bearer token (encrypted at rest via Supabase)
  coverageStates: text("coverage_states").array().default([]).notNull(), // ["CA","AZ"]
  active: boolean("active").default(false).notNull(),
  syncIntervalMinutes: integer("sync_interval_minutes").default(60).notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  lastSyncError: text("last_sync_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Transactions ─────────────────────────────────────────────────────────────
// Event-sourced offer-to-close lifecycle (TXCO-02)

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id),
  buyerUserId: text("buyer_user_id").notNull(),
  sellerUserId: text("seller_user_id").notNull(),
  propertyState: text("property_state").notNull(),
  currentStatus: transactionStatusEnum("current_status").default("offer_submitted").notNull(),
  offerPriceCents: integer("offer_price_cents").notNull(),
  counterPriceCents: integer("counter_price_cents"),
  closingDate: timestamp("closing_date"),
  inspectionDeadline: timestamp("inspection_deadline"),
  financingContingencyDeadline: timestamp("financing_contingency_deadline"),
  closingDisclosureDeadline: timestamp("closing_disclosure_deadline"),
  // Serialized XState state snapshot for workflow engine
  xstateSnapshot: text("xstate_snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Transaction Events ───────────────────────────────────────────────────────
// Append-only event log — rows are NEVER updated or deleted

export const transactionEvents = pgTable("transaction_events", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(), // JSON string
  actorUserId: text("actor_user_id"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

// ─── Transaction Deadlines ────────────────────────────────────────────────────

export const transactionDeadlines = pgTable("transaction_deadlines", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  deadlineType: text("deadline_type").notNull(),
  dueAt: timestamp("due_at").notNull(),
  reminderSentAt: timestamp("reminder_sent_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Wire Instructions ────────────────────────────────────────────────────────
// Secure in-app wire instruction storage — NEVER emailed, MFA-gated display
// TODO: Add column-level encryption via Supabase Vault (pgsodium) before production

export const wireInstructions = pgTable("wire_instructions", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .unique()
    .references(() => transactions.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  routingNumber: text("routing_number").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  referenceNote: text("reference_note"),
  setByUserId: text("set_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── MLS Syndications ─────────────────────────────────────────────────────────
// Tracks flat-fee MLS broker partner submission status per listing (MLS-01)

export const mlsSyndicationStatusEnum = pgEnum("mls_syndication_status", [
  "submitted",
  "confirmed",
  "rejected",
]);

export const mlsSyndications = pgTable("mls_syndications", {
  id: text("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  submissionId: text("submission_id").notNull(),
  status: mlsSyndicationStatusEnum("status").default("submitted").notNull(),
  brokerEmail: text("broker_email").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  rejectionReason: text("rejection_reason"),
});

// ─── Agent Profiles ───────────────────────────────────────────────────────────
// Licensed real estate agents onboarded for agent-for-hire marketplace (AGNT-01)

export const agentProfiles = pgTable("agent_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  licenseStates: text("license_states").array().default([]).notNull(), // array of state codes
  licenseNumber: text("license_number").notNull(),
  stripeAccountId: text("stripe_account_id"), // nullable until Stripe Express onboarding
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false).notNull(),
  verified: boolean("verified").default(false).notNull(),
  availableForDispatch: boolean("available_for_dispatch").default(false).notNull(),
  flatFeeCents: integer("flat_fee_cents").default(50000).notNull(), // $500 flat fee
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Agent License Checks ─────────────────────────────────────────────────────
// ARELLO verification + manual fallback results per agent per state (AGNT-03)

export const agentLicenseCheckMethodEnum = pgEnum("agent_license_check_method", [
  "arello",
  "manual",
]);

export const agentLicenseChecks = pgTable("agent_license_checks", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agentProfiles.id, { onDelete: "cascade" }),
  state: text("state").notNull(),
  method: agentLicenseCheckMethodEnum("method").notNull(),
  arelloResult: text("arello_result"), // JSON blob of ARELLO response (nullable)
  verified: boolean("verified").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Agent Requests ───────────────────────────────────────────────────────────
// Buyer requests for agent-for-hire services per transaction (AGNT-04)

export const agentRequestStatusEnum = pgEnum("agent_request_status", [
  "pending",
  "accepted",
  "completed",
  "cancelled",
]);

export const agentRequests = pgTable("agent_requests", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  agentId: text("agent_id").references(() => agentProfiles.id), // nullable until assigned
  state: text("state").notNull(),
  status: agentRequestStatusEnum("status").default("pending").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
});

// ─── Buyer Events ─────────────────────────────────────────────────────────────
// Behavioral event log for buyer matching algorithm (AGNT-04)

export const buyerEvents = pgTable("buyer_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  eventType: text("event_type").notNull(),
  listingId: text("listing_id"), // nullable — some events not tied to a listing
  metadata: text("metadata").notNull(), // JSON blob
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const listingsRelations = relations(listings, ({ many }) => ({
  photos: many(listingPhotos),
  showingRequests: many(showingRequests),
  disclosureForms: many(disclosureForms),
  signatureEnvelopes: many(signatureEnvelopes),
  transactions: many(transactions),
  mlsSyndications: many(mlsSyndications),
}));

export const mlsSyndicationsRelations = relations(mlsSyndications, ({ one }) => ({
  listing: one(listings, {
    fields: [mlsSyndications.listingId],
    references: [listings.id],
  }),
}));

export const listingPhotosRelations = relations(listingPhotos, ({ one }) => ({
  listing: one(listings, {
    fields: [listingPhotos.listingId],
    references: [listings.id],
  }),
}));

export const showingRequestsRelations = relations(showingRequests, ({ one }) => ({
  listing: one(listings, {
    fields: [showingRequests.listingId],
    references: [listings.id],
  }),
}));

export const disclosureFormsRelations = relations(disclosureForms, ({ one }) => ({
  listing: one(listings, {
    fields: [disclosureForms.listingId],
    references: [listings.id],
  }),
}));

export const signatureEnvelopesRelations = relations(signatureEnvelopes, ({ one }) => ({
  listing: one(listings, {
    fields: [signatureEnvelopes.listingId],
    references: [listings.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  listing: one(listings, {
    fields: [transactions.listingId],
    references: [listings.id],
  }),
  events: many(transactionEvents),
  deadlines: many(transactionDeadlines),
  wireInstructions: one(wireInstructions, {
    fields: [transactions.id],
    references: [wireInstructions.transactionId],
  }),
}));

export const wireInstructionsRelations = relations(wireInstructions, ({ one }) => ({
  transaction: one(transactions, {
    fields: [wireInstructions.transactionId],
    references: [transactions.id],
  }),
}));

export const transactionEventsRelations = relations(transactionEvents, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionEvents.transactionId],
    references: [transactions.id],
  }),
}));

export const transactionDeadlinesRelations = relations(transactionDeadlines, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionDeadlines.transactionId],
    references: [transactions.id],
  }),
}));

export const agentProfilesRelations = relations(agentProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [agentProfiles.userId],
    references: [users.id],
  }),
  licenseChecks: many(agentLicenseChecks),
  requests: many(agentRequests),
}));

export const agentLicenseChecksRelations = relations(agentLicenseChecks, ({ one }) => ({
  agent: one(agentProfiles, {
    fields: [agentLicenseChecks.agentId],
    references: [agentProfiles.id],
  }),
}));

export const agentRequestsRelations = relations(agentRequests, ({ one }) => ({
  transaction: one(transactions, {
    fields: [agentRequests.transactionId],
    references: [transactions.id],
  }),
  agent: one(agentProfiles, {
    fields: [agentRequests.agentId],
    references: [agentProfiles.id],
  }),
}));
