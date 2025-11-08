// Authentication removed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, Settings, Zap, Target, Copy, CheckCircle2 } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const ALL_AGENTS = [
  { id: "blog", name: "Blog Agent", icon: "📝", description: "Authority articles (2000+ words)", gradient: "from-blue-500/20 to-cyan-500/20", enabled: true },
  { id: "twitter", name: "Twitter Agent", icon: "🐦", description: "Thought leadership threads", gradient: "from-sky-500/20 to-blue-500/20", enabled: true },
  { id: "linkedin", name: "LinkedIn Agent", icon: "💼", description: "Professional insights", gradient: "from-indigo-500/20 to-purple-500/20", enabled: true },
  { id: "youtube", name: "YouTube Agent", icon: "🎥", description: "Video descriptions", gradient: "from-red-500/20 to-pink-500/20", enabled: false },
  { id: "medium", name: "Medium Agent", icon: "📖", description: "Deep-dive articles", gradient: "from-green-500/20 to-emerald-500/20", enabled: false },
  { id: "reddit", name: "Reddit Agent", icon: "🗣️", description: "Community engagement", gradient: "from-orange-500/20 to-red-500/20", enabled: false },
  { id: "quora", name: "Quora Agent", icon: "❓", description: "Q&A content", gradient: "from-rose-500/20 to-pink-500/20", enabled: false },
  { id: "pinterest", name: "Pinterest Agent", icon: "📌", description: "Visual discovery", gradient: "from-pink-500/20 to-rose-500/20", enabled: false },
  { id: "podcast", name: "Podcast Agent", icon: "🎙️", description: "Audio scripts", gradient: "from-violet-500/20 to-purple-500/20", enabled: false },
  { id: "shorts", name: "Video Shorts Agent", icon: "📱", description: "Short-form video", gradient: "from-fuchsia-500/20 to-pink-500/20", enabled: false },
];

const AGENT_CONFIGS = [
  { id: "super", name: "GEO Master", icon: "🎯", description: "Campaign Orchestrator", gradient: "from-purple-500/20 to-indigo-500/20" },
  { id: "keyword_researcher", name: "Keyword Researcher", icon: "🔍", description: "AI query analysis", gradient: "from-emerald-500/20 to-teal-500/20", required: true },
  ...ALL_AGENTS,
];

export default function Home() {
  // Authentication removed - public access
  const { data: profile } = trpc.brandProfile.get.useQuery();
  
  const [campaignGoal, setCampaignGoal] = useState("");
  // Campaign state removed - now navigates to dedicated page
  const [enabledAgents, setEnabledAgents] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('maxcontent_enabled_agents');
    if (saved) return JSON.parse(saved);
    return Object.fromEntries(ALL_AGENTS.map(a => [a.id, a.enabled]));
  });
  // contentRef removed - no longer needed
  const contentRef = useRef<HTMLDivElement>(null); // Keep for now to avoid errors
  
  // Save agent selection to localStorage
  useEffect(() => {
    localStorage.setItem('maxcontent_enabled_agents', JSON.stringify(enabledAgents));
  }, [enabledAgents]);
  
  // Campaign polling removed - now on dedicated page
  const campaignData = { content: [], goal: '', createdAt: new Date(), completedAt: null, activities: [] }; // Dummy data for hidden section
  
  const [, setLocation] = useLocation();
  
  const launchCampaign = trpc.campaign.launch.useMutation({
    onSuccess: (data) => {
      toast.success('Campaign launched! Watch the AI swarm work 🚀');
      // Navigate to campaign page
      setLocation(`/campaign/${data.campaignId}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to launch campaign');
    },
  });

  const launchDemo = trpc.demo.setupAndLaunch.useMutation({
    onSuccess: (data) => {
      toast.success('Demo campaign launched! Watch the magic ✨');
      // Navigate to campaign page
      setLocation(`/campaign/${data.campaignId}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to launch demo');
    },
  });
  
  const handleLaunch = () => {
    if (!profile) {
      toast.error("Please create a brand profile first");
      return;
    }
    
    const selectedAgents = Object.entries(enabledAgents)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => id);
    
    if (selectedAgents.length === 0) {
      toast.error("Please enable at least one agent");
      return;
    }
    
    launchCampaign.mutate({
      goal: campaignGoal,
      brandProfileId: profile.id
    });
  };

  const toggleAgent = (agentId: string) => {
    setEnabledAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  // Determine agent statuses based on activities
  const agentStatuses: Record<string, 'idle' | 'working' | 'completed'> = {};
  if ((campaignData as any)?.activities) {
    const activities = (campaignData as any).activities as any[];
    
    // Check each agent
    ['super', 'blog', 'twitter', 'linkedin'].forEach(agentId => {
      const agentActivities = activities.filter((a: any) => a.agentType === agentId);
      if (agentActivities.length === 0) {
        agentStatuses[agentId] = 'idle';
      } else {
        const hasGenerated = agentActivities.some((a: any) => a.status === 'generated');
        const hasWorking = agentActivities.some((a: any) => a.status === 'working');
        agentStatuses[agentId] = hasGenerated ? 'completed' : hasWorking ? 'working' : 'idle';
      }
    });
  }

  // Authentication removed - public access

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✨</div>
            <h1 className="text-xl font-bold tracking-tight">MaxContent - GEO Agent</h1>
          </div>
          <div className="flex items-center gap-4">
            {profile && (
              <Badge variant="outline" className="gap-2">
                <CheckCircle2 className="w-3 h-3" />
                Brand Profile Active
              </Badge>
            )}
            <Button variant="ghost" size="icon" asChild>
              <a href="/brand-profile">
                <Settings className="w-5 h-5" />
              </a>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                U
              </div>
              <span className="text-sm font-medium">User</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold tracking-tight mb-6">
            Get Your Brand Cited by AI Search Engines
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Deploy autonomous AI agents to create citation-worthy, authoritative content optimized for ChatGPT, Perplexity, Claude, and Gemini. Get discovered when millions search with AI.
          </p>

          {/* Campaign Input */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="pt-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="goal" className="text-base font-semibold">GEO Campaign Goal</Label>
                  <Input
                    id="goal"
                    placeholder='e.g., "Get cited as the authority on AI workflow automation for mid-sized businesses"'
                    value={campaignGoal}
                    onChange={(e) => setCampaignGoal(e.target.value)}
                    className="h-12 text-base"
                    disabled={launchCampaign.isPending || launchDemo.isPending}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => launchDemo.mutate()}
                    variant="outline"
                    size="lg"
                    disabled={launchCampaign.isPending || launchDemo.isPending}
                    className="flex-1"
                  >
                    {launchDemo.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Launching Demo...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Demo Mode
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleLaunch}
                    disabled={!campaignGoal.trim() || launchCampaign.isPending || launchDemo.isPending}
                    size="lg"
                    className="flex-[2]"
                  >
                    {launchCampaign.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Launching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Launch Campaign
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Agent Selection */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">GEO Agent Swarm</h3>
            <p className="text-muted-foreground">
              Select which agents will create citation-worthy content for your campaign
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Keyword Researcher - Always Required */}
            <Card className="relative bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/50">
              <CardContent className="p-5">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="text-4xl">🔍</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Keyword Researcher</h4>
                    <p className="text-xs text-muted-foreground">AI query analysis</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="default" className="text-xs bg-emerald-600">
                      REQUIRED
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Runs automatically
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Content Agents */}
            {ALL_AGENTS.map((agent) => {
              const isEnabled = enabledAgents[agent.id];
              const isAvailable = agent.enabled; // Default enabled state
              
              return (
                <Card
                  key={agent.id}
                  className={`relative transition-all duration-300 ${
                    isEnabled
                      ? 'bg-gradient-to-br ' + agent.gradient + ' border-primary/50'
                      : 'bg-card/30 opacity-60'
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="text-4xl">{agent.icon}</div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">{agent.name}</h4>
                        <p className="text-xs text-muted-foreground">{agent.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleAgent(agent.id)}
                          disabled={!isAvailable}
                        />
                        <span className="text-xs font-medium">
                          {isEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      
                      {!isAvailable && (
                        <Badge variant="secondary" className="text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Campaign section removed - now navigates to dedicated page */}
        {false && (
          <div className="hidden">
            {/* Super Agent + Active Agents */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-center">Active Agents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[AGENT_CONFIGS[0], ...AGENT_CONFIGS.filter(a => enabledAgents[a.id])].map((agent) => {
                  const status = agentStatuses[agent.id] || 'idle';
                  const statusConfig = {
                    idle: { badge: 'Idle', color: 'bg-gray-500/20 text-gray-300', pulse: false },
                    working: { badge: 'Working', color: 'bg-yellow-500/20 text-yellow-300', pulse: true },
                    completed: { badge: 'Done', color: 'bg-green-500/20 text-green-300', pulse: false },
                  }[status];

                  return (
                    <Card key={agent.id} className={`bg-gradient-to-br ${agent.gradient} border-border/50 relative overflow-hidden`}>
                      {statusConfig.pulse && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                      )}
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="text-5xl">{agent.icon}</div>
                          <div className="space-y-1">
                            <h4 className="font-semibold">{agent.name}</h4>
                            <p className="text-xs text-muted-foreground">{agent.description}</p>
                          </div>
                          <Badge className={statusConfig.color}>
                            {statusConfig.badge}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Campaign Info */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Target className="w-6 h-6 text-primary mt-1" />
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{(campaignData as any).goal}</CardTitle>
                      <CardDescription>
                        Created: {new Date((campaignData as any).createdAt).toLocaleString()}
                        {(campaignData as any).completedAt && (
                          <> • Completed: {new Date((campaignData as any).completedAt).toLocaleString()}</>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={(campaignData as any).status === 'completed' ? 'default' : 'secondary'}>
                    {(campaignData as any).status}
                  </Badge>
                </div>
              </CardHeader>
              {(campaignData as any).strategy && (
                <CardContent>
                  <h4 className="font-semibold mb-2">Strategy</h4>
                  <p className="text-sm text-muted-foreground">{(campaignData as any).strategy}</p>
                </CardContent>
              )}
            </Card>

            {/* Activity Feed */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>Real-time agent coordination and status updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(campaignData as any).activities?.length > 0 ? (
                    (campaignData as any).activities.map((activity: any, index: number) => (
                      <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="text-2xl flex-shrink-0">
                          {AGENT_CONFIGS.find(a => a.id === activity.agentType)?.icon || '🤖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm capitalize">{activity.agentType}</span>
                            <span className="text-xs text-muted-foreground">
                              {activity.timestamp ? new Date(activity.timestamp as string | number | Date).toLocaleTimeString() : 'Just now'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Waiting for agent activities...
                    </p>
                  )}
                  
                  {(campaignData as any).status === 'completed' && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-green-500">
                        Campaign completed! Generated {(campaignData as any).content?.length || 0} pieces of content.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generated Content */}
            {(campaignData as any).content?.length > 0 && (
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>
                    {(campaignData as any).content.length} pieces of content across {
                      new Set((campaignData as any).content.map((c: any) => c.platform)).size
                    } platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="blog" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="blog">
                        Blog ({(campaignData as any).content.filter((c: any) => c.platform === 'blog').length})
                      </TabsTrigger>
                      <TabsTrigger value="twitter">
                        Twitter ({(campaignData as any).content.filter((c: any) => c.platform === 'twitter').length})
                      </TabsTrigger>
                      <TabsTrigger value="linkedin">
                        LinkedIn ({(campaignData as any).content.filter((c: any) => c.platform === 'linkedin').length})
                      </TabsTrigger>
                    </TabsList>

                    {['blog', 'twitter', 'linkedin'].map(platform => (
                      <TabsContent key={platform} value={platform} className="space-y-4 mt-6">
                        {(campaignData as any).content
                          .filter((c: any) => c.platform === platform)
                          .map((content: any, index: number) => (
                            <Card key={index} className="bg-muted/30">
                              <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1 flex-1">
                                    <CardTitle className="text-lg">{content.title}</CardTitle>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className="text-xs">
                                        {content.contentType}
                                      </Badge>
                                      {content.metadata?.estimatedReach && (
                                        <Badge variant="secondary" className="text-xs">
                                          Est. reach: {content.metadata.estimatedReach.toLocaleString()}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(content.body);
                                      toast.success('Content copied to clipboard');
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <Streamdown>{content.body}</Streamdown>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
