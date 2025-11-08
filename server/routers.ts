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
import { campaigns, brandProfiles } from "../drizzle/schema";
import { buildBrandContext, generateContent, superAgentCreateStrategy, keywordResearcherAgent } from "./agents";

export const appRouter = router({
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
    get: publicProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id || 0;
      const profile = await getBrandProfileByUserId(userId);
      return profile;
    }),
    create: publicProcedure
      .input(z.object({
        companyName: z.string().min(1),
        industry: z.string().optional(),
        description: z.string().optional(),
        productService: z.string().optional(),
        targetAudience: z.string().optional(),
        brandVoice: z.string().optional(),
        valuePropositions: z.string().optional(),
        competitors: z.string().optional(),
        marketingGoals: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 0;
        const profileId = await createBrandProfile({
          userId,
          ...input,
        });
        return { id: profileId };
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().min(1).optional(),
        industry: z.string().optional(),
        description: z.string().optional(),
        productService: z.string().optional(),
        targetAudience: z.string().optional(),
        brandVoice: z.string().optional(),
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
    list: publicProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id || 0;
      return await getCampaignsByUserId(userId);
    }),
    get: publicProcedure
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
    getContent: publicProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return await getContentByCampaignId(input.campaignId);
      }),
    getActivities: publicProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return await getActivitiesByCampaignId(input.campaignId);
      }),
    launch: publicProcedure
      .input(z.object({ 
        goal: z.string().min(1),
        brandProfileId: z.number()
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 0;
        
        // Get brand profile by ID directly
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const profileResult = await db.select().from(brandProfiles).where(eq(brandProfiles.id, input.brandProfileId)).limit(1);
        const profile = profileResult[0];
        
        if (!profile) {
          throw new Error("Brand profile not found");
        }
        
        // Create campaign
        const campaignId = await createCampaign({
          userId,
          brandProfileId: input.brandProfileId,
          goal: input.goal,
          status: "running"
        });
        
        // Run content generation in background (don't await)
        (async () => {
          try {
        
        // Log GEO Master Agent activity
        await createAgentActivity({
          campaignId,
          agentType: "super",
          activityType: "status_update",
          message: "Analyzing campaign goal and initiating keyword research...",
          status: "strategizing"
        });
        
        // Build brand context
        const brandContext = buildBrandContext(profile);
        
        // Step 1: Keyword Research
        await createAgentActivity({
          campaignId,
          agentType: "keyword_researcher",
          activityType: "status_update",
          message: "Analyzing AI search landscape and identifying high-opportunity keywords...",
          status: "researching"
        });
        
        const keywordResearch = await keywordResearcherAgent(input.goal, brandContext);
        const keywordsStr = keywordResearch.keywords.map(k => k.keyword).join(", ");
        
        await createAgentActivity({
          campaignId,
          agentType: "keyword_researcher",
          activityType: "message",
          message: `Research complete. Identified ${keywordResearch.keywords.length} high-opportunity keywords:\n${keywordResearch.keywords.map(k => `• "${k.keyword}" - Citation Potential: ${k.citationPotential}, Competition: ${k.competition}\n  ${k.reasoning}`).join("\n")}\n\nRecommendation: ${keywordResearch.summary}`,
          status: "completed"
        });
        
        // Step 2: Get strategy from GEO Master Agent with keywords
        await createAgentActivity({
          campaignId,
          agentType: "super",
          activityType: "status_update",
          message: "Creating GEO-optimized content strategy based on keyword research...",
          status: "strategizing"
        });
        
        const { strategy, assignments } = await superAgentCreateStrategy(input.goal, brandContext, keywordsStr);
        
        // Update campaign with strategy and keywords
        await updateCampaignStatus(campaignId, "running", strategy);
        const dbConn = await getDb();
        if (dbConn) {
          await dbConn.update(campaigns).set({ keywords: keywordsStr }).where(eq(campaigns.id, campaignId));
        }
        
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
            const agentType = assignment.agent.toLowerCase().replace(/ agent$/i, "").trim() as "blog" | "twitter" | "linkedin";
            
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
        const dbConn2 = await getDb();
        if (dbConn2) {
          const { campaigns } = await import("../drizzle/schema");
          await dbConn2.update(campaigns).set({ estimatedReach: totalReach }).where(eq(campaigns.id, campaignId));
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
            await updateCampaignStatus(campaignId, "failed" as any);
          }
        })();
        
        // Return immediately
        return { campaignId, success: true };
      }),
    sendMessage: publicProcedure
      .input(z.object({
        campaignId: z.number(),
        message: z.string().min(1)
      }))
      .mutation(async ({ ctx, input }) => {
        // Store user message in activity feed
        await createAgentActivity({
          campaignId: input.campaignId,
          agentType: "user",
          activityType: "message",
          message: input.message,
          status: null
        });
        
        // Get campaign
        const campaign = await getCampaignById(input.campaignId);
        if (!campaign) {
          throw new Error("Campaign not found");
        }
        
        // Get brand profile by campaign's brandProfileId
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const profileResult = await db.select().from(brandProfiles).where(eq(brandProfiles.id, campaign.brandProfileId)).limit(1);
        const profile = profileResult[0];
        
        if (!profile) {
          throw new Error("Brand profile not found");
        }
        
        // Trigger Super Agent acknowledgment in background
        (async () => {
          try {
            const brandContext = buildBrandContext(profile);
            
            // Generate acknowledgment from Super Agent
            const { invokeLLM } = await import("./_core/llm");
            const response = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: `You are the Super Agent coordinating a marketing campaign. The campaign goal is: "${campaign.goal}". The strategy is: "${campaign.strategy || 'In progress'}".

A user has sent you feedback. Acknowledge their message professionally and briefly explain how you'll incorporate it or what action you'll take. Keep your response to 1-2 sentences.`
                },
                {
                  role: "user",
                  content: input.message
                }
              ]
            });
            
            const rawContent = response.choices[0]?.message?.content;
            const acknowledgment = typeof rawContent === 'string' ? rawContent : "Thank you for your feedback. I'll take that into consideration.";
            
            // Post acknowledgment to activity feed
            await createAgentActivity({
              campaignId: input.campaignId,
              agentType: "super",
              activityType: "message",
              message: acknowledgment,
              status: "responding"
            });
          } catch (error) {
            // Silently fail acknowledgment generation
          }
        })();
        
        return { success: true };
      }),
  }),

  demo: router({
    setupAndLaunch: publicProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const userId = ctx.user?.id || 0;

      // Create demo brand profile
      const demoProfile = {
        userId,
        companyName: 'Senti Global',
        industry: 'Enterprise AI Infrastructure',
        description: 'Leading provider of sovereign AI infrastructure for government and financial institutions, enabling secure, compliant AI deployments with full data sovereignty',
        productService: 'Sovereign AI Infrastructure Platform - Private cloud AI deployment, regulatory compliance automation, secure model training environments, data sovereignty guarantees',
        targetAudience: 'Government agencies, central banks, financial institutions, and regulated enterprises requiring sovereign AI capabilities with strict data residency and compliance requirements',
        brandVoice: 'Authoritative, visionary, technically credible - speaking to both C-suite decision makers and technical architects',
        valuePropositions: 'Complete data sovereignty, regulatory compliance by design, enterprise-grade security, seamless integration with existing infrastructure, proven track record with government clients',
        competitors: 'Palantir, Databricks Government Cloud, AWS GovCloud, Microsoft Azure Government',
        marketingGoals: 'Establish thought leadership in sovereign AI space, generate qualified enterprise leads, build trust with government procurement teams'
      };

      const profileId = await createBrandProfile(demoProfile);

      // Launch demo GEO campaign
      const demoCampaignGoal = 'Get cited by AI search engines (ChatGPT, Perplexity, Claude, Gemini) as the authority on sovereign AI infrastructure for government and financial institutions';
      
      const campaignId = await createCampaign({
        userId,
        brandProfileId: profileId,
        goal: demoCampaignGoal,
        status: 'running' as any
      });

      // Run campaign generation in background (same as regular launch)
      (async () => {
        try {
          // Step 1: GEO Master initiates keyword research
          await createAgentActivity({
            campaignId,
            agentType: 'super',
            activityType: 'status_update',
            message: 'Analyzing campaign goal and initiating keyword research...'
          });

          // Get the full profile from database
          const fullProfileResult = await db.select().from(brandProfiles).where(eq(brandProfiles.id, profileId)).limit(1);
          const fullProfileForStrategy = fullProfileResult[0];
          if (!fullProfileForStrategy) throw new Error('Profile not found');
          const brandContext = buildBrandContext(fullProfileForStrategy);
          
          // Step 2: Keyword Researcher Agent
          await createAgentActivity({
            campaignId,
            agentType: 'keyword_researcher',
            activityType: 'status_update',
            message: 'Analyzing AI search landscape for high-opportunity keywords...'
          });
          
          const keywordResearch = await keywordResearcherAgent(demoCampaignGoal, brandContext);
          const keywordsStr = keywordResearch.keywords.map(k => k.keyword).join(", ");
          
          await createAgentActivity({
            campaignId,
            agentType: 'keyword_researcher',
            activityType: 'message',
            message: `Research complete. Identified ${keywordResearch.keywords.length} high-opportunity keywords:\n${keywordResearch.keywords.map(k => `• "${k.keyword}" - Citation Potential: ${k.citationPotential}, Competition: ${k.competition}\n  ${k.reasoning}`).join("\n")}\n\nRecommendation: ${keywordResearch.summary}`
          });
          
          // Step 3: GEO Master creates strategy with keywords
          await createAgentActivity({
            campaignId,
            agentType: 'super',
            activityType: 'status_update',
            message: 'Creating GEO-optimized content strategy based on keyword research...'
          });
          
          const strategyResult = await superAgentCreateStrategy(demoCampaignGoal, brandContext, keywordsStr);
          
          await createAgentActivity({
            campaignId,
            agentType: 'super',
            activityType: 'message',
            message: `GEO Strategy created: ${strategyResult.strategy}`
          });

          await db.update(campaigns)
            .set({ 
              strategy: strategyResult.strategy,
              keywords: keywordsStr
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
          await updateCampaignStatus(campaignId, 'failed' as any);
        }
      })();

      return { success: true, campaignId, profileId };
    })
  }),
});

export type AppRouter = typeof appRouter;
