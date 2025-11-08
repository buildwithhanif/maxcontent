import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
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
import { buildBrandContext, generateContent, superAgentCreateStrategy, keywordResearcherAgent } from "./agents";

// Default user ID for demo purposes (no auth)
const DEFAULT_USER_ID = 1;

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,

  brandProfile: router({
    get: publicProcedure.query(async () => {
      const profile = await getBrandProfileByUserId(DEFAULT_USER_ID);
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
      .mutation(async ({ input }) => {
        const profileId = await createBrandProfile({
          userId: DEFAULT_USER_ID,
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
    list: publicProcedure.query(async () => {
      return await getCampaignsByUserId(DEFAULT_USER_ID);
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
      .mutation(async ({ input }) => {
        // Get brand profile
        const profile = await getBrandProfileByUserId(DEFAULT_USER_ID);
        if (!profile) {
          throw new Error("Brand profile not found");
        }

        // Create campaign
        const campaignId = await createCampaign({
          userId: DEFAULT_USER_ID,
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
            console.error('Campaign generation failed:', error);
            await updateCampaignStatus(campaignId, "failed" as any);
            await createAgentActivity({
              campaignId,
              agentType: "super",
              activityType: "status_update",
              message: `Campaign failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              status: "failed"
            });
          }
        })(); // Execute async function immediately but don't await
        
        // Return immediately
        return { campaignId, success: true };
      }),
    sendMessage: publicProcedure
      .input(z.object({
        campaignId: z.number(),
        message: z.string().min(1)
      }))
      .mutation(async ({ input }) => {
        // Store user message in activity feed
        await createAgentActivity({
          campaignId: input.campaignId,
          agentType: "user",
          activityType: "message",
          message: input.message,
          status: null
        });

        // Get campaign and brand profile for context
        const campaign = await getCampaignById(input.campaignId);
        if (!campaign) {
          throw new Error("Campaign not found");
        }

        const profile = await getBrandProfileByUserId(DEFAULT_USER_ID);
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
            console.error('Failed to generate acknowledgment:', error);
            // Post a fallback acknowledgment
            try {
              await createAgentActivity({
                campaignId: input.campaignId,
                agentType: "super",
                activityType: "message",
                message: "Thank you for your feedback. I'll incorporate that into our campaign strategy.",
                status: "responding"
              });
            } catch (fallbackError) {
              console.error('Failed to post fallback acknowledgment:', fallbackError);
            }
          }
        })();
        
        return { success: true };
      }),
  }),

  demo: router({
    setupAndLaunch: publicProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Create demo brand profile
      const demoProfile = {
        userId: DEFAULT_USER_ID,
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

      // Launch demo GEO campaign
      const demoCampaignGoal = 'Get cited by AI search engines (ChatGPT, Perplexity, Claude) as the authority on AI workflow automation for mid-sized businesses, focusing on ROI metrics and productivity gains';

      const campaignId = await createCampaign({
        userId: DEFAULT_USER_ID,
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
          const fullProfileForStrategy = await getBrandProfileByUserId(DEFAULT_USER_ID);
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

            // buildBrandContext expects full BrandProfile with all fields
            const fullProfile = await getBrandProfileByUserId(DEFAULT_USER_ID);
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
          console.error('Demo campaign generation failed:', error);
          await updateCampaignStatus(campaignId, 'failed' as any);
          await createAgentActivity({
            campaignId,
            agentType: 'super',
            activityType: 'status_update',
            message: `Campaign failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: 'failed'
          });
        }
      })();

      return { success: true, campaignId, profileId };
    })
  }),
});

export type AppRouter = typeof appRouter;
