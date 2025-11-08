import { drizzle } from "drizzle-orm/mysql2";
import { campaigns, generatedContent, agentActivities } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const campaign = await db.select().from(campaigns).where(eq(campaigns.id, 1));
console.log("Campaign:", campaign[0]);

const content = await db.select().from(generatedContent).where(eq(generatedContent.campaignId, 1));
console.log("\nGenerated Content Count:", content.length);

const activities = await db.select().from(agentActivities).where(eq(agentActivities.campaignId, 1));
console.log("Activities Count:", activities.length);

if (activities.length > 0) {
  console.log("\nLatest Activity:", activities[activities.length - 1]);
}
