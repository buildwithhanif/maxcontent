import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, Settings, Zap, Target, Copy, CheckCircle2 } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const AGENT_CONFIGS = [
  { id: "super", name: "Super Agent", icon: "🎯", description: "Campaign Orchestrator", gradient: "from-purple-500/20 to-indigo-500/20" },
  { id: "blog", name: "Blog Agent", icon: "📝", description: "SEO-optimized articles", gradient: "from-blue-500/20 to-cyan-500/20" },
  { id: "twitter", name: "Twitter Agent", icon: "🐦", description: "Viral threads", gradient: "from-sky-500/20 to-blue-500/20" },
  { id: "linkedin", name: "LinkedIn Agent", icon: "💼", description: "B2B content", gradient: "from-indigo-500/20 to-purple-500/20" },
  { id: "youtube", name: "YouTube Agent", icon: "🎥", description: "Video descriptions", gradient: "from-red-500/20 to-pink-500/20" },
  { id: "medium", name: "Medium Agent", icon: "📖", description: "Thought leadership", gradient: "from-green-500/20 to-emerald-500/20" },
  { id: "reddit", name: "Reddit Agent", icon: "🗣️", description: "Community engagement", gradient: "from-orange-500/20 to-red-500/20" },
  { id: "quora", name: "Quora Agent", icon: "❓", description: "Q&A content", gradient: "from-rose-500/20 to-pink-500/20" },
  { id: "pinterest", name: "Pinterest Agent", icon: "📌", description: "Visual discovery", gradient: "from-pink-500/20 to-rose-500/20" },
  { id: "podcast", name: "Podcast Agent", icon: "🎙️", description: "Audio scripts", gradient: "from-violet-500/20 to-purple-500/20" },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: profile } = trpc.brandProfile.get.useQuery(undefined, { enabled: isAuthenticated });
  
  const [campaignGoal, setCampaignGoal] = useState("");
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [showAgents, setShowAgents] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Poll for campaign data when active
  const { data: campaignData } = trpc.campaign.get.useQuery(
    { id: activeCampaignId! },
    { 
      enabled: activeCampaignId !== null,
      refetchInterval: 2000
    }
  );
  
  const launchCampaign = trpc.campaign.launch.useMutation({
    onSuccess: (data) => {
      toast.success('Campaign launched! Watch the AI swarm work 🚀');
      setActiveCampaignId(data.campaignId);
      setShowAgents(true);
      // Scroll to agents section
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to launch campaign');
    },
  });

  const launchDemo = trpc.demo.setupAndLaunch.useMutation({
    onSuccess: (data) => {
      toast.success('Demo campaign launched! Watch the magic ✨');
      setActiveCampaignId(data.campaignId);
      setShowAgents(true);
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
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
    launchCampaign.mutate({
      goal: campaignGoal,
      brandProfileId: profile.id
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-lg text-muted-foreground">
                AI Marketing Swarm for High-Quality Content
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-center leading-relaxed">
              Generate coordinated, on-brand marketing content across 10+ platforms with context-driven AI agents.
            </p>
            <Button asChild className="w-full" size="lg">
              <a href={getLoginUrl()}>Get Started</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const campaign = campaignData as any;
  const activities = (campaignData as any)?.activities || [];
  const content = (campaignData as any)?.content || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {profile && (
              <Badge variant="outline" className="gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Brand Profile Active
              </Badge>
            )}
            <Button variant="ghost" size="icon" asChild>
              <a href="/brand-profile">
                <Settings className="w-4 h-4" />
              </a>
            </Button>
            <span className="text-sm text-muted-foreground">{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Hero Section - Campaign Launch */}
      <section className="container py-24">
        <div className="max-w-3xl mx-auto space-y-8 text-center">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">
              Launch Your AI Marketing Swarm
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Describe your campaign goal and watch autonomous AI agents create coordinated, on-brand content across multiple platforms.
            </p>
          </div>

          {!profile ? (
            <Card className="p-8 border-2 border-dashed border-muted-foreground/20">
              <div className="space-y-4">
                <Target className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">Setup Required</h3>
                <p className="text-muted-foreground">
                  Create your brand profile to unlock AI-powered content generation
                </p>
                <Button asChild size="lg">
                  <a href="/brand-profile">Create Brand Profile</a>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 shadow-xl">
              <div className="space-y-6">
                <div className="space-y-3 text-left">
                  <Label htmlFor="goal" className="text-base font-semibold">Campaign Goal</Label>
                  <Input
                    id="goal"
                    placeholder='e.g., "Run a one-day awareness campaign for our new product"'
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
            </Card>
          )}
        </div>
      </section>

      {/* Agent Swarm Section - Progressive Disclosure */}
      {showAgents && (
        <section ref={contentRef} className="container py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-bold tracking-tight">AI Agent Swarm</h3>
              <p className="text-muted-foreground text-lg">
                Watch autonomous agents collaborate to create your campaign
              </p>
            </div>

            {/* Agent Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {AGENT_CONFIGS.slice(0, 4).map((agent, index) => {
                const status = agentStatuses[agent.id] || 'idle';
                const isWorking = status === 'working';
                const isCompleted = status === 'completed';
                
                return (
                  <Card
                    key={agent.id}
                    className={`relative overflow-hidden transition-all duration-500 ${
                      isWorking ? 'ring-2 ring-primary shadow-lg shadow-primary/20 animate-pulse' : ''
                    } ${
                      isCompleted ? 'ring-2 ring-green-500 shadow-lg shadow-green-500/20' : ''
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards',
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-50`} />
                    <CardHeader className="relative pb-4">
                      <div className="flex items-start justify-between">
                        <div className="text-4xl">{agent.icon}</div>
                        <div className="flex flex-col gap-1">
                          {isCompleted && (
                            <Badge variant="default" className="bg-green-500 text-white text-xs">
                              Done
                            </Badge>
                          )}
                          {isWorking && (
                            <Badge variant="default" className="bg-primary text-xs">
                              Working
                            </Badge>
                          )}
                          {status === 'idle' && activeCampaignId && (
                            <Badge variant="secondary" className="text-xs">
                              Idle
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription className="text-xs">{agent.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Campaign Info */}
            {campaign && (
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-primary" />
                        <CardTitle className="text-xl">{campaign.goal}</CardTitle>
                      </div>
                      <CardDescription>
                        Created: {new Date(campaign.createdAt).toLocaleString()}
                        {campaign.completedAt && ` • Completed: ${new Date(campaign.completedAt).toLocaleString()}`}
                      </CardDescription>
                    </div>
                    <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                {campaign.strategy && (
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Strategy</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{campaign.strategy}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Activity Feed */}
            {activities.length > 0 && (
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                <CardHeader>
                  <CardTitle className="text-lg">Activity Feed</CardTitle>
                  <CardDescription>Real-time agent coordination and status updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activities.map((activity: any, index: number) => (
                      <div
                        key={activity.id}
                        className="flex gap-3 p-3 rounded-lg bg-muted/30 animate-in fade-in slide-in-from-left-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="text-2xl flex-shrink-0">
                          {AGENT_CONFIGS.find(a => a.id === activity.agentType)?.icon || '🤖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm capitalize">{activity.agentType}</span>
                            <span className="text-xs text-muted-foreground">
                              {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : 'Just now'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {campaign?.status === 'completed' && (
                    <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">Campaign completed! Generated {content.length} pieces of content.</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Generated Content */}
            {content.length > 0 && (
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700">
                <CardHeader>
                  <CardTitle className="text-lg">Generated Content</CardTitle>
                  <CardDescription>{content.length} pieces of content across {new Set(content.map((c: any) => c.platform)).size} platforms</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="blog" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="blog">Blog ({content.filter((c: any) => c.platform === 'blog').length})</TabsTrigger>
                      <TabsTrigger value="twitter">Twitter ({content.filter((c: any) => c.platform === 'twitter').length})</TabsTrigger>
                      <TabsTrigger value="linkedin">LinkedIn ({content.filter((c: any) => c.platform === 'linkedin').length})</TabsTrigger>
                    </TabsList>
                    
                    {['blog', 'twitter', 'linkedin'].map(platform => (
                      <TabsContent key={platform} value={platform} className="space-y-4 mt-6">
                        {content.filter((c: any) => c.platform === platform).map((item: any) => (
                          <Card key={item.id} className="overflow-hidden">
                            <CardHeader>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                    <span>{item.contentType}</span>
                                    <span>•</span>
                                    <span>Est. reach: {item.estimatedReach?.toLocaleString()}</span>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.body);
                                    toast.success('Content copied to clipboard!');
                                  }}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <Streamdown>{item.body}</Streamdown>
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
        </section>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
