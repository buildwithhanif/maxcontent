import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Copy, Loader2, Sparkles, Target } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

const AGENT_ICONS: Record<string, string> = {
  super: "🎯",
  blog: "📝",
  twitter: "🐦",
  linkedin: "💼",
  youtube: "🎥",
  medium: "📖",
  reddit: "🗣️",
  quora: "❓",
  pinterest: "📌",
  podcast: "🎙️",
};

export default function Campaign() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  
  const { data: campaign, isLoading: campaignLoading } = trpc.campaign.get.useQuery(
    { id: campaignId },
    { enabled: !!campaignId }
  );
  
  const { data: content, isLoading: contentLoading, refetch: refetchContent } = trpc.campaign.getContent.useQuery(
    { campaignId },
    { enabled: !!campaignId, refetchInterval: campaign?.status === "running" ? 2000 : false }
  );
  
  const { data: activities, refetch: refetchActivities } = trpc.campaign.getActivities.useQuery(
    { campaignId },
    { enabled: !!campaignId, refetchInterval: campaign?.status === "running" ? 2000 : false }
  );

  useEffect(() => {
    if (campaign?.status === "running") {
      const interval = setInterval(() => {
        refetchContent();
        refetchActivities();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [campaign?.status, refetchContent, refetchActivities]);

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Content copied to clipboard!");
  };

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Campaign Not Found</CardTitle>
            <CardDescription className="text-base">The campaign you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contentByPlatform = content?.reduce((acc, item) => {
    if (!acc[item.platform]) acc[item.platform] = [];
    acc[item.platform].push(item);
    return acc;
  }, {} as Record<string, typeof content>) || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center gap-6 h-20">
          <Link href="/">
            <Button variant="ghost" size="lg">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Campaign Details</h1>
          </div>
          <Badge 
            variant={campaign.status === "completed" ? "default" : campaign.status === "running" ? "secondary" : "outline"}
            className="text-sm px-4 py-1.5 font-medium"
          >
            {campaign.status}
          </Badge>
        </div>
      </header>

      <div className="container py-12 space-y-8">
        {/* Campaign Info */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <CardTitle className="text-2xl leading-tight">{campaign.goal}</CardTitle>
                <CardDescription className="text-base">
                  Created: {campaign.createdAt ? new Date(campaign.createdAt).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                  {campaign.completedAt && ` • Completed: ${new Date(campaign.completedAt).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {campaign.strategy && (
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-base">Strategy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{campaign.strategy}</p>
              </div>
              {campaign.estimatedReach && (
                <div className="pt-2">
                  <Badge variant="outline" className="text-sm px-3 py-1.5">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Estimated Reach: {campaign.estimatedReach.toLocaleString()}
                  </Badge>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Activity Feed */}
        {activities && activities.length > 0 && (
          <Card className="shadow-lg border-border/50">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl">Activity Feed</CardTitle>
              <CardDescription className="text-base">Real-time agent coordination and status updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-2">
                {activities.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-2xl shrink-0">
                      {AGENT_ICONS[activity.agentType] || "🤖"}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-medium capitalize">
                          {activity.agentType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{activity.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              {campaign.status === "completed" && (
                <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-center">
                    ✅ Campaign completed! Generated {content?.length || 0} pieces of content.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generated Content */}
        {content && content.length > 0 && (
          <Card className="shadow-lg border-border/50">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl">Generated Content</CardTitle>
              <CardDescription className="text-base">
                {content.length} pieces of content across {Object.keys(contentByPlatform).length} platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={Object.keys(contentByPlatform)[0]}>
                <TabsList className="mb-6 h-12">
                  {Object.keys(contentByPlatform).map((platform) => (
                    <TabsTrigger 
                      key={platform} 
                      value={platform} 
                      className="capitalize text-sm font-medium px-4"
                    >
                      {platform} ({contentByPlatform[platform].length})
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {Object.entries(contentByPlatform).map(([platform, items]) => (
                  <TabsContent key={platform} value={platform} className="space-y-6">
                    {items.map((item) => (
                      <Card key={item.id} className="border-border/50">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <CardTitle className="text-lg leading-snug">{item.title}</CardTitle>
                              <CardDescription className="text-sm">
                                {item.contentType} • Est. reach: {item.estimatedReach?.toLocaleString() || "N/A"}
                              </CardDescription>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyContent(`${item.title}\n\n${item.body}`)}
                              className="shrink-0"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                              {item.body}
                            </pre>
                          </div>
                          {item.metadata && (
                            <>
                              <Separator />
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">Metadata:</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{item.metadata}</p>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {campaign.status === "running" && (
          <Card className="shadow-lg border-primary/30 bg-primary/5">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <div className="space-y-1">
                  <p className="text-base font-medium">
                    AI agents are working on your campaign...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This page updates automatically every 2 seconds
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
