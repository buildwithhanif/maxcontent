import { invokeLLM } from "./_core/llm";
import type { BrandProfile } from "../drizzle/schema";

export interface AgentConfig {
  name: string;
  role: string;
  platformKnowledge: string;
  outputFormat: string;
}

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  blog: {
    name: "Blog Agent",
    role: "SEO-optimized long-form content specialist",
    platformKnowledge: `
      - Optimal length: 1500-2500 words
      - H2/H3 heading structure every 300 words
      - SEO keyword density: 1-2%
      - Include meta description (150-160 chars)
      - Internal and external linking opportunities
      - Featured snippet optimization
      - Conversational yet authoritative tone
    `,
    outputFormat: "Full blog article with title, meta description, headings, and body content"
  },
  twitter: {
    name: "Twitter Agent",
    role: "Viral thread and engagement specialist",
    platformKnowledge: `
      - Thread hook: first tweet must grab attention immediately
      - Optimal thread length: 5-10 tweets
      - 280 character limit per tweet
      - Use line breaks for readability
      - Hashtags: 2-3 max, strategically placed
      - End with strong CTA
      - Conversational, punchy tone
      - Best posting times: 8-10 AM, 6-9 PM
    `,
    outputFormat: "Twitter thread with 5-10 tweets, each under 280 characters"
  },
  linkedin: {
    name: "LinkedIn Agent",
    role: "B2B professional content and thought leadership specialist",
    platformKnowledge: `
      - Professional tone with personality
      - Optimal length: 1200-1500 words for articles
      - Data and statistics integration
      - Industry insights and trends
      - Clear value proposition
      - Call-to-action for networking
      - Document post formatting with emojis sparingly
      - Focus on business outcomes and ROI
    `,
    outputFormat: "LinkedIn article or post with professional formatting and business focus"
  },
};

/**
 * Build brand context string from profile for LLM prompts
 */
export function buildBrandContext(profile: BrandProfile): string {
  return `
BRAND CONTEXT:
Company: ${profile.companyName}
Industry: ${profile.industry || "Not specified"}
Description: ${profile.description || "Not specified"}
Product/Service: ${profile.productService || "Not specified"}
Target Audience: ${profile.targetAudience || "Not specified"}
Brand Voice: ${profile.brandVoice}
Value Propositions: ${profile.valuePropositions || "Not specified"}
Competitors: ${profile.competitors || "Not specified"}
Marketing Goals: ${profile.marketingGoals || "Not specified"}
`.trim();
}

/**
 * Super Agent - Campaign orchestrator and strategist
 */
export async function superAgentCreateStrategy(
  campaignGoal: string,
  brandContext: string,
  keywords?: string
): Promise<{
  strategy: string;
  keywords: string;
  assignments: Array<{ agent: string; task: string; count: number }>;
}> {
  const keywordContext = keywords ? `\n\nTARGET KEYWORDS (from Keyword Researcher): ${keywords}` : '';
  
  const prompt = `You are the GEO Master Agent, an expert in Generative Engine Optimization (GEO) - optimizing content to be cited by AI search engines like ChatGPT, Perplexity, Claude, and Gemini.

${brandContext}${keywordContext}

CAMPAIGN GOAL: ${campaignGoal}

Your task:
1. Analyze the campaign goal and brand context
2. Create a GEO-optimized content strategy focused on becoming the cited authority
3. Assign specific tasks to specialized content agents (blog, twitter, linkedin)

Focus on creating citation-worthy, authoritative content:
- Blog Agent: Long-form authority content (2000+ words) optimized for AI citation
- Twitter Agent: Thought leadership threads that establish topical authority
- LinkedIn Agent: Professional insights AI engines cite for business queries

IMPORTANT: Generate ONLY 1 piece of content per agent for faster execution.

Respond in JSON format:
{
  "strategy": "2-3 sentence GEO strategy overview focusing on citation potential",
  "assignments": [
    { "agent": "blog", "task": "specific task description with keyword integration", "count": 1 },
    { "agent": "twitter", "task": "specific task description with keyword integration", "count": 1 },
    { "agent": "linkedin", "task": "specific task description with keyword integration", "count": 1 }
  ]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a master campaign strategist. Always respond in valid JSON format." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "campaign_strategy",
        strict: true,
        schema: {
          type: "object",
          properties: {
            strategy: { type: "string" },
            keywords: { type: "string" },
            assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  agent: { type: "string" },
                  task: { type: "string" },
                  count: { type: "number" }
                },
                required: ["agent", "task", "count"],
                additionalProperties: false
              }
            }
          },
          required: ["strategy", "keywords", "assignments"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const result = JSON.parse(contentStr || "{}");
  return result;
}

/**
 * Generate content with a specialized agent
 */
export async function generateContent(
  agentType: "blog" | "twitter" | "linkedin",
  task: string,
  brandContext: string
): Promise<{ title: string; body: string; metadata?: string }> {
  const config = AGENT_CONFIGS[agentType];
  if (!config) {
    throw new Error(`Invalid agent type: ${agentType}. Must be one of: ${Object.keys(AGENT_CONFIGS).join(", ")}`);
  }
  
  const prompt = `You are the ${config.name}, a ${config.role}.

${brandContext}

PLATFORM KNOWLEDGE:
${config.platformKnowledge}

TASK: ${task}

Generate high-quality, on-brand content that follows platform best practices.
Output format: ${config.outputFormat}

Respond in JSON format:
{
  "title": "compelling title/headline",
  "body": "full content body",
  "metadata": "optional metadata like hashtags, keywords, etc."
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: `You are ${config.name}. Create exceptional, platform-optimized content. Always respond in valid JSON format.` },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "content_output",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            body: { type: "string" },
            metadata: { type: "string" }
          },
          required: ["title", "body"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const result = JSON.parse(contentStr || "{}");
  return result;
}


/**
 * Keyword Researcher Agent - Analyzes AI search landscape and identifies high-opportunity keywords
 */
export async function keywordResearcherAgent(
  campaignGoal: string,
  brandContext: string
): Promise<{
  keywords: Array<{ keyword: string; citationPotential: string; competition: string; reasoning: string }>;
  summary: string;
}> {
  const prompt = `You are the Keyword Researcher Agent, an expert in analyzing AI search engine queries and identifying high-opportunity keywords for Generative Engine Optimization (GEO).

${brandContext}

CAMPAIGN GOAL: ${campaignGoal}

Your task:
1. Analyze what queries users ask AI engines (ChatGPT, Perplexity, Claude, Gemini) related to this campaign goal
2. Identify 3-5 high-opportunity keywords/queries where the brand can become the cited authority
3. Evaluate each keyword's citation potential and competition level
4. Provide strategic reasoning for each keyword

Focus on:
- Keywords with high citation potential (AI engines frequently cite sources for these queries)
- Low to medium competition (gaps where no clear authority exists yet)
- Alignment with brand expertise and unique value propositions
- Queries that require authoritative, data-driven answers

Respond in JSON format:
{
  "keywords": [
    {
      "keyword": "specific keyword or query phrase",
      "citationPotential": "High/Medium/Low",
      "competition": "High/Medium/Low",
      "reasoning": "1-2 sentence explanation of why this keyword is valuable"
    }
  ],
  "summary": "2-3 sentence summary of the keyword research findings and recommended focus"
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert keyword researcher specializing in GEO. Always respond in valid JSON format." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "keyword_research",
        strict: true,
        schema: {
          type: "object",
          properties: {
            keywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  citationPotential: { type: "string" },
                  competition: { type: "string" },
                  reasoning: { type: "string" }
                },
                required: ["keyword", "citationPotential", "competition", "reasoning"],
                additionalProperties: false
              }
            },
            summary: { type: "string" }
          },
          required: ["keywords", "summary"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const result = JSON.parse(contentStr || "{}");
  return result;
}
