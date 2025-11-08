import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, Settings, Zap } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

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
  const { data: campaigns } = trpc.campaign.list.useQuery(undefined, { enabled: isAuthenticated });
  
  const [campaignGoal, setCampaignGoal] = useState("");
  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({});
  const [, navigate] = useLocation();
  
  const launchCampaign = trpc.campaign.launch.useMutation({
    onSuccess: (data) => {
      toast.success('Campaign launched successfully!');
      navigate(`/campaign/${data.campaignId}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to launch campaign');
    },
  });

  const launchDemo = trpc.demo.setupAndLaunch.useMutation({
    onSuccess: (data) => {
      toast.success('Demo campaign launched! Watch the AI swarm in action 🚀');
      navigate(`/campaign/${data.campaignId}`);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/brand-profile">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Brand Profile
              </Button>
            </Link>
            <div className="text-sm text-muted-foreground font-medium">{user?.name}</div>
          </div>
        </div>
      </header>

      <div className="container py-12 space-y-12">
        {/* Brand Profile Check */}
        {!profile && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl">Setup Required</CardTitle>
              <CardDescription className="text-base">
                Create your brand profile to ensure high-quality, on-brand content generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/brand-profile">
                <Button size="lg">
                  <Settings className="w-4 h-4 mr-2" />
                  Create Brand Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Campaign Input */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl">Launch Campaign</CardTitle>
            <CardDescription className="text-base">
              Describe your campaign goal and let the AI swarm create coordinated content across all platforms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="campaignGoal" className="text-base font-medium">Campaign Goal</Label>
                <Input
                  id="campaignGoal"
                  placeholder='e.g., "Run a one-day awareness campaign for our new product"'
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => launchDemo.mutate()}
                  disabled={launchDemo.isPending}
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12"
                >
                  {launchDemo.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Launching Demo...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Demo Mode
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleLaunch}
                  disabled={!campaignGoal.trim() || launchCampaign.isPending}
                  className="flex-1 h-12 text-base font-semibold"
                  size="lg"
                >
                  {launchCampaign.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Launch Campaign
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Status Grid */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Agent Swarm</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {AGENT_CONFIGS.map((agent) => (
              <div
                key={agent.id}
                className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${agent.gradient} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-primary/50`}
              >
                <div className="absolute inset-0 bg-card/80 backdrop-blur-sm"></div>
                <div className="relative p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="text-5xl transform transition-transform duration-300 group-hover:scale-110">
                      {agent.icon}
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-xs font-medium bg-background/50 backdrop-blur-sm"
                    >
                      {agentStatuses[agent.id] || "Idle"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg tracking-tight">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{agent.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Campaigns */}
        {campaigns && campaigns.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Recent Campaigns</h2>
            <div className="space-y-4">
              {campaigns.slice(0, 5).map((campaign) => (
                <Link key={campaign.id} href={`/campaign/${campaign.id}`}>
                  <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <CardTitle className="text-lg font-semibold leading-snug">{campaign.goal}</CardTitle>
                          <CardDescription className="text-sm">
                            {new Date(campaign.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={campaign.status === "completed" ? "default" : campaign.status === "running" ? "secondary" : "outline"}
                          className="font-medium"
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
