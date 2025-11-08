import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  brandProfiles, 
  InsertBrandProfile,
  campaigns,
  Campaign,
  InsertCampaign,
  generatedContent,
  InsertGeneratedContent,
  agentActivities,
  InsertAgentActivity
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Brand Profile queries
export async function createBrandProfile(profile: InsertBrandProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(brandProfiles).values(profile);
  return Number((result[0] as any).insertId);
}

export async function getBrandProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(brandProfiles).where(eq(brandProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateBrandProfile(id: number, profile: Partial<InsertBrandProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(brandProfiles).set(profile).where(eq(brandProfiles.id, id));
}

// Campaign queries
export async function createCampaign(campaign: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(campaigns).values(campaign);
  const id = Number((result[0] as any).insertId);
  console.log("[createCampaign] Created campaign with ID:", id);
  return id;
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getCampaignsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(campaigns.createdAt);
}

export async function updateCampaignStatus(id: number, status: Campaign["status"], strategy?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updates: Partial<InsertCampaign> = { status };
  if (strategy) updates.strategy = strategy;
  if (status === "completed") updates.completedAt = new Date();
  await db.update(campaigns).set(updates).where(eq(campaigns.id, id));
}

// Generated Content queries
export async function createGeneratedContent(content: InsertGeneratedContent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(generatedContent).values(content);
  return Number((result[0] as any).insertId);
}

export async function getContentByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generatedContent).where(eq(generatedContent.campaignId, campaignId)).orderBy(generatedContent.createdAt);
}

// Agent Activity queries
export async function createAgentActivity(activity: InsertAgentActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  console.log("[createAgentActivity] Received activity:", activity);
  console.log("[createAgentActivity] campaignId type:", typeof activity.campaignId, "value:", activity.campaignId);
  if (isNaN(activity.campaignId)) {
    console.error("[createAgentActivity] ERROR: campaignId is NaN!");
    throw new Error(`Invalid campaignId: ${activity.campaignId}`);
  }
  await db.insert(agentActivities).values(activity);
}

export async function getActivitiesByCampaignId(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentActivities).where(eq(agentActivities.campaignId, campaignId)).orderBy(agentActivities.createdAt);
}
