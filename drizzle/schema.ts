import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Brand context profiles - stores the brand information that guides all content generation
 */
export const brandProfiles = mysqlTable("brandProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 255 }),
  description: text("description"),
  productService: text("productService"),
  targetAudience: text("targetAudience"),
  brandVoice: text("brandVoice"),
  valuePropositions: text("valuePropositions"),
  competitors: text("competitors"),
  marketingGoals: text("marketingGoals"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrandProfile = typeof brandProfiles.$inferSelect;
export type InsertBrandProfile = typeof brandProfiles.$inferInsert;

/**
 * Campaigns - represents a marketing campaign run by the agent swarm
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brandProfileId: int("brandProfileId").notNull(),
  goal: text("goal").notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  strategy: text("strategy"),
  keywords: text("keywords"),
  estimatedReach: int("estimatedReach"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Generated content - stores all content created by the specialized agents
 */
export const generatedContent = mysqlTable("generatedContent", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  agentType: mysqlEnum("agentType", [
    "keyword_researcher",
    "blog",
    "youtube",
    "video_shorts",
    "medium",
    "linkedin",
    "reddit",
    "twitter",
    "quora",
    "pinterest",
    "podcast"
  ]).notNull(),
  platform: varchar("platform", { length: 100 }).notNull(),
  contentType: varchar("contentType", { length: 100 }),
  title: text("title"),
  body: text("body").notNull(),
  metadata: text("metadata"),
  estimatedReach: int("estimatedReach"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = typeof generatedContent.$inferInsert;

/**
 * Agent activities - tracks agent status and inter-agent communication
 */
export const agentActivities = mysqlTable("agentActivities", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  agentType: varchar("agentType", { length: 100 }).notNull(),
  activityType: mysqlEnum("activityType", ["status_update", "message", "content_generated"]).notNull(),
  message: text("message"),
  status: varchar("status", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentActivity = typeof agentActivities.$inferSelect;
export type InsertAgentActivity = typeof agentActivities.$inferInsert;