import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Copy, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

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
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Not Found</CardTitle>
            <CardDescription>The campaign you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>
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
      <header className="border-b border-border bg-card">
        <div className="container flex items-center gap-4 h-16">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Campaign Details</h1>
          </div>
          <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
            {campaign.status}
          </Badge>
        </div>
      </header>

      <div className="container py-8">
        {/* Campaign Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{campaign.goal}</CardTitle>
            <CardDescription>
              Created: {new Date(campaign.createdAt).toLocaleString()}
              {campaign.completedAt && ` • Completed: ${new Date(campaign.completedAt).toLocaleString()}`}
            </CardDescription>
          </CardHeader>
          {campaign.strategy && (
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Strategy</h3>
                <p className="text-sm text-muted-foreground">{campaign.strategy}</p>
              </div>
              {campaign.estimatedReach && (
                <div className="mt-4">
                  <Badge variant="outline">
                    Estimated Reach: {campaign.estimatedReach.toLocaleString()}
                  </Badge>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Activity Feed */}
        {activities && activities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>Real-time agent coordination and status updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <Badge variant="outline" className="shrink-0">
                      {activity.agentType}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-muted-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Content */}
        {content && content.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>
                {content.length} pieces of content across {Object.keys(contentByPlatform).length} platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={Object.keys(contentByPlatform)[0]}>
                <TabsList className="mb-4">
                  {Object.keys(contentByPlatform).map((platform) => (
                    <TabsTrigger key={platform} value={platform} className="capitalize">
                      {platform} ({contentByPlatform[platform].length})
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {Object.entries(contentByPlatform).map(([platform, items]) => (
                  <TabsContent key={platform} value={platform} className="space-y-4">
                    {items.map((item) => (
                      <Card key={item.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                              <CardDescription>
                                {item.contentType} • Est. reach: {item.estimatedReach?.toLocaleString() || "N/A"}
                              </CardDescription>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyContent(`${item.title}\n\n${item.body}`)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm">{item.body}</pre>
                          </div>
                          {item.metadata && (
                            <>
                              <Separator className="my-4" />
                              <div>
                                <p className="text-xs font-semibold mb-1">Metadata:</p>
                                <p className="text-xs text-muted-foreground">{item.metadata}</p>
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
          <Card className="mt-6">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  AI agents are working on your campaign...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
