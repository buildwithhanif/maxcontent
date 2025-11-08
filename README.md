# MaxContent - GEO Agent Swarm

**Get Your Brand Cited by AI Search Engines**

MaxContent is an autonomous AI agent platform that creates citation-worthy, authoritative content optimized for Generative Engine Optimization (GEO). Deploy intelligent agents to research keywords, develop content strategies, and generate platform-specific content that gets cited by ChatGPT, Perplexity, Claude, and Gemini.

## 🎯 What is GEO (Generative Engine Optimization)?

Traditional SEO optimizes for Google's "10 blue links." GEO optimizes for AI search engines that synthesize answers from multiple sources. MaxContent helps your brand become the authoritative source that AI engines cite when answering user queries.

## ✨ Features

### 🔍 Keyword Researcher Agent
- Analyzes AI search landscape for high-opportunity keywords
- Identifies citation potential and competition levels
- Discovers 4+ targeted keywords per campaign
- Provides strategic recommendations

### 🎯 GEO Master Agent
- Creates comprehensive content strategies based on keyword research
- Coordinates content agents across multiple platforms
- Integrates brand context into all content
- Responds to user feedback in real-time

### 📝 Content Generation Agents
- **Blog Agent**: 2500+ word authoritative whitepapers and articles
- **Twitter Agent**: 10-tweet thought leadership threads with data points
- **LinkedIn Agent**: Professional insights and industry analysis

### 💬 Interactive Chat
- Provide real-time feedback to agents during campaigns
- Agents acknowledge and adapt to your input
- All communication logged in activity feed

### 🏢 Brand Context Integration
- Inject company information into every piece of content
- Maintain consistent brand voice across all platforms
- Reference competitors and value propositions automatically

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- pnpm
- MySQL or TiDB database

### Installation

```bash
# Clone the repository
git clone https://github.com/buildwithhanif/maxcontent.git
cd maxcontent

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API credentials

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Wouter (routing)
- **Backend**: Express 4, tRPC 11
- **Database**: MySQL with Drizzle ORM
- **AI**: LLM API (OpenAI GPT-4o-mini)
- **Type Safety**: TypeScript, Zod validation

## 📦 Project Structure

```
maxcontent/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # tRPC client setup
├── server/                # Express + tRPC backend
│   ├── agents.ts          # AI agent logic
│   ├── routers.ts         # tRPC API routes
│   └── db.ts              # Database queries
├── drizzle/               # Database schema
│   └── schema.ts          # Table definitions
└── shared/                # Shared types and constants
```

## 🔑 Environment Variables

Required environment variables (see `.env.example`):

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# LLM API
BUILT_IN_FORGE_API_URL=https://api.manus.im/llm
BUILT_IN_FORGE_API_KEY=your_api_key_here

# Application
VITE_APP_TITLE=MaxContent - GEO Agent
VITE_APP_ID=maxcontent
JWT_SECRET=your_random_secret_here
```

## 🎮 Usage

### 1. Set Up Brand Profile
Navigate to "Brand Profile" and enter your company information:
- Company name, industry, description
- Products/services
- Target audience
- Brand voice
- Value propositions
- Competitors

### 2. Launch a GEO Campaign
1. Enter your campaign goal (e.g., "Get cited as the authority on AI workflow automation")
2. Click "Launch Campaign" or "Demo Mode"
3. Watch agents work in real-time:
   - Keyword Researcher discovers high-opportunity keywords
   - GEO Master creates content strategy
   - Content agents generate platform-specific pieces

### 3. Provide Feedback (Optional)
- Use the chat input to send feedback to agents
- GEO Master acknowledges and adapts strategy
- All communication logged in activity feed

### 4. Review Generated Content
- View content organized by platform (Blog, Twitter, LinkedIn)
- Copy content with one click
- See estimated reach and engagement metrics

## 🏗️ Architecture

### tRPC API Flow
```
Frontend → trpc.campaign.launch.useMutation()
         → Backend tRPC Router
         → Keyword Researcher Agent (discovers keywords)
         → GEO Master Agent (creates strategy)
         → Content Agents (generate content in parallel)
         → Database (stores activities and content)
         → Frontend (polls for updates every 2s)
```

### Agent Workflow
1. **Keyword Research**: Analyze AI search landscape, identify opportunities
2. **Strategy Creation**: GEO Master develops content plan based on keywords
3. **Content Generation**: Platform agents create optimized content
4. **User Feedback**: Interactive chat allows real-time guidance
5. **Completion**: All content delivered with metrics

## 📊 Database Schema

- **campaigns**: Campaign metadata (goal, status, keywords)
- **agent_activities**: Real-time activity feed (agent actions, messages)
- **generated_content**: Platform-specific content pieces
- **brand_profiles**: Company information and brand context
- **users**: User authentication (optional)

## 🧪 Development

```bash
# Run development server with hot reload
pnpm dev

# Type check
pnpm tsc --noEmit

# Database operations
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio

# Build for production
pnpm build
pnpm start
```

## 🚢 Deployment

### Option 1: Manus Platform (Recommended)
1. Click "Publish" in Management UI
2. Site goes live at `https://your-domain.manus.space`
3. All environment variables auto-configured

### Option 2: Vercel/Railway/Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy with build command: `pnpm build`
4. Start command: `pnpm start`

## 🤝 Contributing

This project was built for a hackathon. Contributions, issues, and feature requests are welcome!

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

- Built with [Manus](https://manus.im) - AI-powered development platform
- Powered by OpenAI GPT-4o-mini
- UI components from [shadcn/ui](https://ui.shadcn.com)

---

**Built by [@buildwithhanif](https://github.com/buildwithhanif)**
