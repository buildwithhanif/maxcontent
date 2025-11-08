import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createBrandProfile,
  getBrandProfileByUserId,
  updateBrandProfile,
  getCampaignsByUserId,
  getCampaignById,
  getContentByCampaignId,
  getActivitiesByCampaignId,
  createCampaign,
  updateCampaignStatus,
  createAgentActivity,
  createGeneratedContent,
  getDb,
} from "./db";
import { campaigns } from "../drizzle/schema";
import { buildBrandContext, generateContent, superAgentCreateStrategy } from "./agents";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  brandProfile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getBrandProfileByUserId(ctx.user.id);
      return profile;
    }),
    create: protectedProcedure
      .input(z.object({
        companyName: z.string().min(1),
        industry: z.string().optional(),
        description: z.string().optional(),
        productService: z.string().optional(),
        targetAudience: z.string().optional(),
        brandVoice: z.enum(["professional", "casual", "friendly", "authoritative"]).default("professional"),
        valuePropositions: z.string().optional(),
        competitors: z.string().optional(),
        marketingGoals: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profileId = await createBrandProfile({
          userId: ctx.user.id,
          ...input,
        });
        return { id: profileId };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().min(1).optional(),
        industry: z.string().optional(),
        description: z.string().optional(),
        productService: z.string().optional(),
        targetAudience: z.string().optional(),
        brandVoice: z.enum(["professional", "casual", "friendly", "authoritative"]).optional(),
        valuePropositions: z.string().optional(),
        competitors: z.string().optional(),
        marketingGoals: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await updateBrandProfile(id, updates);
        return { success: true };
      }),
  }),

  campaign: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getCampaignsByUserId(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const campaign = await getCampaignById(input.id);
        const activities = await getActivitiesByCampaignId(input.id);
        const content = await getContentByCampaignId(input.id);
        return {
          ...campaign,
          activities,
          content
        };
      }),
    getContent: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return await getContentByCampaignId(input.campaignId);
      }),
    getActivities: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return await getActivitiesByCampaignId(input.campaignId);
      }),
    launch: protectedProcedure
      .input(z.object({ 
        goal: z.string().min(1),
        brandProfileId: z.number()
      }))
      .mutation(async ({ ctx, input }) => {
        // Get brand profile
        const profile = await getBrandProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new Error("Brand profile not found");
        }
        
        // Create campaign
        const campaignId = await createCampaign({
          userId: ctx.user.id,
          brandProfileId: input.brandProfileId,
          goal: input.goal,
          status: "running"
        });
        
        // Run content generation in background (don't await)
        (async () => {
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
        const { strategy, assignments } = await superAgentCreateStrategy(input.goal, brandContext);
        
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
            // Normalize agent type (handle "Blog Agent" -> "blog")
            const agentType = assignment.agent.toLowerCase().replace(/ agent$/i, "").trim() as "blog" | "twitter" | "linkedin";
            console.log(`[Campaign ${campaignId}] Normalized agent type: "${assignment.agent}" -> "${agentType}"`);
            
            const content = await generateContent(
              agentType,
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
        
            console.log(`[Campaign ${campaignId}] Completed successfully!`);
          } catch (error) {
            console.error(`[Campaign ${campaignId}] Background generation failed:`, error);
            await updateCampaignStatus(campaignId, "failed" as any).catch(console.error);
          }
        })(); // Execute async function immediately but don't await
        
        // Return immediately
        return { campaignId, success: true };
      }),
  }),

  demo: router({
    setupAndLaunch: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Create demo brand profile
      const demoProfile = {
        userId: ctx.user.id,
        companyName: 'TechFlow AI',
        industry: 'B2B SaaS - Workflow Automation',
        description: 'AI-powered workflow automation platform that helps mid-sized businesses achieve 10x productivity gains',
        targetAudience: 'Operations Managers and IT Directors at mid-sized B2B companies (50-500 employees) struggling with manual processes and scaling challenges',
        brandVoice: 'professional' as const,
        valuePropositions: 'Achieve 10x workflow speed, reduce manual tasks by 90%, seamless integration with existing tools, enterprise-grade security',
        keyDifferentiators: 'AI-powered intelligent automation (not just scripting), proven ROI metrics, white-glove onboarding',
        marketingGoals: 'Increase brand awareness in the B2B automation space, generate qualified leads, establish thought leadership'
      };

      const profileId = await createBrandProfile(demoProfile);

      // Launch demo campaign
      const demoCampaignGoal = 'Launch a one-day awareness campaign showcasing TechFlow AI\'s ability to automate 90% of manual tasks and achieve 10x productivity gains for mid-sized businesses';
      
      const campaignId = await createCampaign({
        userId: ctx.user.id,
        brandProfileId: profileId,
        goal: demoCampaignGoal,
        status: 'running' as any
      });

      // Run campaign generation in background (same as regular launch)
      (async () => {
        try {
          await createAgentActivity({
            campaignId,
            agentType: 'super',
            activityType: 'status_update',
            message: 'Analyzing campaign goal and creating strategy...'
          });

          // Get the full profile from database to pass to buildBrandContext
          const fullProfileForStrategy = await getBrandProfileByUserId(ctx.user.id);
          if (!fullProfileForStrategy) throw new Error('Profile not found');
          const brandContext = buildBrandContext(fullProfileForStrategy);
          const strategyResult = await superAgentCreateStrategy(demoCampaignGoal, brandContext);
          
          await createAgentActivity({
            campaignId,
            agentType: 'super',
            activityType: 'message',
            message: `Strategy created: ${strategyResult.strategy}`
          });

          await db.update(campaigns)
            .set({ 
              strategy: strategyResult.strategy
            })
            .where(eq(campaigns.id, campaignId));

          for (const assignment of strategyResult.assignments) {
            const normalizedAgent = assignment.agent.toLowerCase().replace(' agent', '').replace('agent', '').trim() as 'blog' | 'twitter' | 'linkedin';
            
            await createAgentActivity({
              campaignId,
              agentType: 'super',
              activityType: 'message',
              message: `Assigning to ${assignment.agent.toLowerCase()}: ${assignment.task}`
            });

            await createAgentActivity({
              campaignId,
              agentType: normalizedAgent,
              activityType: 'status_update',
              message: `Working on: ${assignment.task}`
            });

            // buildBrandContext expects full BrandProfile with all fields
            const fullProfile = await getBrandProfileByUserId(ctx.user.id);
            if (!fullProfile) throw new Error('Profile not found');
            const brandContext = buildBrandContext(fullProfile);
            const content = await generateContent(normalizedAgent, assignment.task, brandContext);
            
            await createGeneratedContent({
              campaignId,
              agentType: normalizedAgent,
              platform: normalizedAgent,
              contentType: 'article',
              title: content.title,
              body: content.body,
              metadata: content.metadata || '',
              estimatedReach: 1000
            });

            await createAgentActivity({
              campaignId,
              agentType: normalizedAgent,
              activityType: 'content_generated',
              message: `Generated: ${content.title}`
            });
          }

          await updateCampaignStatus(campaignId, 'completed' as any);
          await createAgentActivity({
            campaignId,
            agentType: 'super',
            activityType: 'message',
            message: `Campaign completed! Generated ${strategyResult.assignments.length} pieces of content.`
          });
        } catch (error) {
          console.error('[Demo Campaign] Error:', error);
          await updateCampaignStatus(campaignId, 'failed' as any).catch(console.error);
        }
      })();

      return { success: true, campaignId, profileId };
    })
  }),
});

export type AppRouter = typeof appRouter;
