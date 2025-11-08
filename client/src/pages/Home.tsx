import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, Settings } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

const AGENT_CONFIGS = [
  { id: "super", name: "Super Agent", icon: "🎯", description: "Campaign Orchestrator" },
  { id: "blog", name: "Blog Agent", icon: "📝", description: "SEO-optimized articles" },
  { id: "twitter", name: "Twitter Agent", icon: "🐦", description: "Viral threads" },
  { id: "linkedin", name: "LinkedIn Agent", icon: "💼", description: "B2B content" },
  { id: "youtube", name: "YouTube Agent", icon: "🎥", description: "Video descriptions" },
  { id: "medium", name: "Medium Agent", icon: "📖", description: "Thought leadership" },
  { id: "reddit", name: "Reddit Agent", icon: "🗣️", description: "Community engagement" },
  { id: "quora", name: "Quora Agent", icon: "❓", description: "Q&A content" },
  { id: "pinterest", name: "Pinterest Agent", icon: "📌", description: "Visual discovery" },
  { id: "podcast", name: "Podcast Agent", icon: "🎙️", description: "Audio scripts" },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: profile } = trpc.brandProfile.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: campaigns } = trpc.campaign.list.useQuery(undefined, { enabled: isAuthenticated });
  
  const [campaignGoal, setCampaignGoal] = useState("");
  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({});
  const [, setLocation] = useLocation();
  
  const launchCampaign = trpc.campaign.launch.useMutation({
    onSuccess: (data) => {
      toast.success("Campaign launched successfully!");
      setLocation(`/campaign/${data.campaignId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to launch campaign");
    }
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-3xl">{APP_TITLE}</CardTitle>
            <CardDescription className="text-lg mt-2">
              AI Marketing Swarm for High-Quality Content Generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center mb-6">
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
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/brand-profile">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Brand Profile
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">{user?.name}</span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Brand Profile Check */}
        {!profile && (
          <Card className="mb-6 border-primary/50">
            <CardHeader>
              <CardTitle>Setup Required</CardTitle>
              <CardDescription>
                Please set up your brand profile first to ensure high-quality, on-brand content generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/brand-profile">
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Create Brand Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Campaign Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Launch Campaign</CardTitle>
            <CardDescription>
              Describe your campaign goal and let the AI swarm create coordinated content across all platforms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignGoal">Campaign Goal</Label>
                <Input
                  id="campaignGoal"
                  placeholder='e.g., "Run a one-day awareness campaign for our new product"'
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button 
                size="lg" 
                className="w-full"
                disabled={!profile || !campaignGoal.trim() || launchCampaign.isPending}
                onClick={handleLaunch}
              >
                {launchCampaign.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Launch Campaign
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agent Status Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Agent Swarm</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {AGENT_CONFIGS.map((agent) => (
              <Card key={agent.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">{agent.icon}</div>
                    <Badge variant="outline" className="text-xs">
                      {agentStatuses[agent.id] || "Idle"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <CardDescription className="text-sm">{agent.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Campaigns */}
        {campaigns && campaigns.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Campaigns</h2>
            <div className="space-y-4">
              {campaigns.slice(0, 5).map((campaign) => (
                <Link key={campaign.id} href={`/campaign/${campaign.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{campaign.goal}</CardTitle>
                          <CardDescription>
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
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
