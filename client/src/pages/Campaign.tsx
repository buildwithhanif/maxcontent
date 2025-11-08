import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Copy, Loader2, Send, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const AGENT_ICONS: Record<string, string> = {
  super: "🎯",
  keyword_researcher: "🔍",
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

const AGENT_NAMES: Record<string, string> = {
  super: "GEO Master Agent",
  keyword_researcher: "Keyword Researcher Agent",
  blog: "Blog Agent",
  twitter: "Twitter Agent",
  linkedin: "LinkedIn Agent",
  youtube: "YouTube Agent",
  medium: "Medium Agent",
  reddit: "Reddit Agent",
  quora: "Quora Agent",
  pinterest: "Pinterest Agent",
  podcast: "Podcast Agent",
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

  const [chatMessage, setChatMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const sendMessageMutation = trpc.campaign.sendMessage.useMutation({
    onSuccess: () => {
      setChatMessage("");
      setIsSending(false);
      toast.success("Message sent!");
      // Immediately refetch to show user message
      refetchActivities();
    },
    onError: (error) => {
      setIsSending(false);
      toast.error("Failed to send message: " + error.message);
    }
  });
  
  const handleSendMessage = () => {
    if (!chatMessage.trim() || isSending) return;
    setIsSending(true);
    sendMessageMutation.mutate({
      campaignId,
      message: chatMessage.trim()
    });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
      {/* Compact Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center gap-4 h-16">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">Campaign Details</h1>
          </div>
          <Badge 
            variant={campaign.status === "completed" ? "default" : campaign.status === "running" ? "secondary" : "outline"}
            className="text-xs px-3 py-1"
          >
            {campaign.status}
          </Badge>
        </div>
      </header>

      <div className="container py-4">
        {/* Compact Campaign Info */}
        <Card className="mb-4 border-border/50">
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base leading-tight mb-1">{campaign.goal}</CardTitle>
                <CardDescription className="text-xs">
                  Created: {campaign.createdAt ? new Date(campaign.createdAt).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                  {campaign.completedAt && ` • Completed: ${new Date(campaign.completedAt).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Keyword Research Results */}
        {campaign.keywords && (
          <Card className="mb-4 border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center gap-2">
                <div className="text-lg">🔍</div>
                <CardTitle className="text-base">Target Keywords (Discovered by AI)</CardTitle>
              </div>
              <CardDescription className="text-xs">High-opportunity keywords for AI search engine citations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {campaign.keywords.split(", ").map((keyword: string, idx: number) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="px-3 py-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two-Column Layout: Activity Feed (Left) + Generated Content (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 240px)' }}>
          {/* Activity Feed Column */}
          <Card className="border-border/50 flex flex-col">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base">Activity Feed</CardTitle>
              <CardDescription className="text-xs">Real-time agent coordination</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-2 h-full overflow-y-auto pr-2">
                {activities && activities.length > 0 ? (
                  activities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-xl shrink-0">
                        {activity.agentType === "user" ? "👤" : (AGENT_ICONS[activity.agentType] || "🤖")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-xs">{activity.agentType === "user" ? "You" : (AGENT_NAMES[activity.agentType] || activity.agentType)}</span>
                          <span className="text-xs text-muted-foreground">
                            {activity.createdAt ? new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{activity.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    {campaign.status === "running" ? "AI agents are working on your campaign..." : "No activities yet"}
                  </p>
                )}
              </div>
            </CardContent>
            <div className="border-t border-border/50 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Send feedback to agents..."
                  disabled={isSending}
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim() || isSending}
                  className="h-9 w-9 p-0"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>

          {/* Generated Content Column */}
          <Card className="border-border/50 flex flex-col">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base">Generated Content</CardTitle>
              <CardDescription className="text-xs">
                {content?.length || 0} pieces across {Object.keys(contentByPlatform).length} platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {content && content.length > 0 ? (
                <Tabs defaultValue={Object.keys(contentByPlatform)[0]} className="h-full flex flex-col">
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(contentByPlatform).length}, 1fr)` }}>
                    {Object.keys(contentByPlatform).map(platform => (
                      <TabsTrigger key={platform} value={platform} className="text-xs">
                        {platform} ({contentByPlatform[platform].length})
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {Object.keys(contentByPlatform).map(platform => (
                    <TabsContent key={platform} value={platform} className="flex-1 overflow-y-auto mt-3 space-y-3 pr-2">
                      {contentByPlatform[platform].map((item, index) => (
                        <Card key={index} className="bg-muted/30">
                          <CardHeader className="pb-2 pt-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm leading-tight mb-1">{item.title}</CardTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {item.contentType}
                                  </Badge>
                                  {typeof item.metadata === 'object' && item.metadata && 'estimatedReach' in item.metadata && (
                                    <Badge variant="secondary" className="text-xs">
                                      Reach: {(item.metadata as any).estimatedReach.toLocaleString()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => copyContent(item.body)}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                              <Streamdown>{item.body}</Streamdown>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-muted-foreground text-center">
                    {campaign.status === "running" ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating content...
                      </span>
                    ) : "No content generated yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
