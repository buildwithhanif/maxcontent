/**
 * Background worker for campaign content generation
 * This runs asynchronously without blocking the HTTP response
 */
import { eq } from "drizzle-orm";
import {
  updateCampaignStatus,
  createAgentActivity,
  createGeneratedContent,
  getDb,
} from "./db";
import { buildBrandContext, superAgentCreateStrategy, generateContent } from "./agents";
import type { BrandProfile } from "../drizzle/schema";

export async function runCampaignGeneration(
  campaignId: number,
  goal: string,
  profile: BrandProfile
): Promise<void> {
  try {
    // Log Super Agent activity
    await createAgentActivity({
      campaignId,
      agentType: "super",
      activityType: "status_update",
      message: "Analyzing campaign goal and creating strategy...",
      status: "strategizing"
    });
    
    // Build brand context
    const brandContext = buildBrandContext(profile);

    // Get strategy from Super Agent
    const { strategy, assignments } = await superAgentCreateStrategy(goal, brandContext);

    // Update campaign with strategy
    await updateCampaignStatus(campaignId, "running", strategy);
    
    // Log strategy creation
    await createAgentActivity({
      campaignId,
      agentType: "super",
      activityType: "message",
      message: `Strategy created: ${strategy}`,
      status: "delegating"
    });
    
    // Generate content for each assignment
    let totalReach = 0;
    for (const assignment of assignments) {
      // Log task delegation
      await createAgentActivity({
        campaignId,
        agentType: "super",
        activityType: "message",
        message: `Assigning to ${assignment.agent}: ${assignment.task}`,
        status: "delegating"
      });
      
      // Update agent status
      await createAgentActivity({
        campaignId,
        agentType: assignment.agent,
        activityType: "status_update",
        message: `Working on: ${assignment.task}`,
        status: "generating"
      });
      
      // Generate content
      for (let i = 0; i < assignment.count; i++) {
        const content = await generateContent(
          assignment.agent as "blog" | "twitter" | "linkedin",
          assignment.task,
          brandContext
        );
        
        // Estimate reach based on platform
        const estimatedReach = assignment.agent === "blog" ? 1000 : 
                              assignment.agent === "twitter" ? 500 : 800;
        totalReach += estimatedReach;
        
        // Save generated content
        await createGeneratedContent({
          campaignId,
          agentType: assignment.agent as any,
          platform: assignment.agent,
          contentType: assignment.agent === "blog" ? "article" : 
                      assignment.agent === "twitter" ? "thread" : "post",
          title: content.title,
          body: content.body,
          metadata: content.metadata,
          estimatedReach
        });
        
        // Log content generation
        await createAgentActivity({
          campaignId,
          agentType: assignment.agent,
          activityType: "content_generated",
          message: `Generated: ${content.title}`,
          status: "completed"
        });
      }
    }
    
    // Mark campaign as completed
    await updateCampaignStatus(campaignId, "completed");
    const db = await getDb();
    if (db) {
      const { campaigns } = await import("../drizzle/schema");
      await db.update(campaigns).set({ estimatedReach: totalReach }).where(eq(campaigns.id, campaignId));
    }
    
    // Log completion
    await createAgentActivity({
      campaignId,
      agentType: "super",
      activityType: "status_update",
      message: `Campaign completed! Generated ${assignments.reduce((sum, a) => sum + a.count, 0)} pieces of content.`,
      status: "completed"
    });
  } catch (error) {
    console.error(`[Worker] Campaign ${campaignId} failed:`, error);
    await updateCampaignStatus(campaignId, "failed");
    await createAgentActivity({
      campaignId,
      agentType: "super",
      activityType: "status_update",
      message: `Campaign failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: "failed"
    });
  }
}
