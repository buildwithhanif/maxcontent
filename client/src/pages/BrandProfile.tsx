import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function BrandProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = trpc.brandProfile.get.useQuery();
  const createProfile = trpc.brandProfile.create.useMutation();
  const updateProfile = trpc.brandProfile.update.useMutation();

  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    description: "",
    productService: "",
    targetAudience: "",
    brandVoice: "",
    valuePropositions: "",
    competitors: "",
    marketingGoals: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || "",
        industry: profile.industry || "",
        description: profile.description || "",
        productService: profile.productService || "",
        targetAudience: profile.targetAudience || "",
        brandVoice: profile.brandVoice || "",
        valuePropositions: profile.valuePropositions || "",
        competitors: profile.competitors || "",
        marketingGoals: profile.marketingGoals || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (profile) {
        await updateProfile.mutateAsync({ id: profile.id, ...formData });
        toast.success("Brand profile updated successfully!");
      } else {
        await createProfile.mutateAsync(formData);
        toast.success("Brand profile created successfully!");
        refetch();
      }
    } catch (error) {
      toast.error("Failed to save brand profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="text-2xl">✨</div>
            <h1 className="text-xl font-bold tracking-tight">MaxContent - GEO Agent</h1>
          </div>
        </div>
      </header>
      
      <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Brand Context Profile</CardTitle>
          <CardDescription>
            Set up your brand profile to ensure all AI-generated content is on-brand and consistent.
            This context will be used by all agents to create high-quality, tailored content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry / Niche</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., Enterprise AI Infrastructure"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Leading provider of sovereign AI infrastructure for government and financial institutions, enabling secure, compliant AI deployments with full data sovereignty"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productService">Product / Service Details</Label>
              <Textarea
                id="productService"
                value={formData.productService}
                onChange={(e) => setFormData({ ...formData, productService: e.target.value })}
                placeholder="e.g., Sovereign AI Infrastructure Platform - Private cloud AI deployment, regulatory compliance automation, secure model training environments, data sovereignty guarantees"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience / ICP</Label>
              <Textarea
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="e.g., Government agencies, central banks, financial institutions, and regulated enterprises requiring sovereign AI capabilities with strict data residency and compliance requirements"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandVoice">Brand Voice</Label>
              <Input
                id="brandVoice"
                value={formData.brandVoice}
                onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
                placeholder="e.g., Authoritative, visionary, and technically credible"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valuePropositions">Key Value Propositions</Label>
              <Textarea
                id="valuePropositions"
                value={formData.valuePropositions}
                onChange={(e) => setFormData({ ...formData, valuePropositions: e.target.value })}
                placeholder="e.g., Complete data sovereignty, regulatory compliance by design, enterprise-grade security, seamless integration with existing infrastructure, proven track record with government clients"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitors">Competitors</Label>
              <Input
                id="competitors"
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                placeholder="e.g., Palantir, Databricks Government Cloud, AWS GovCloud, Microsoft Azure Government"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketingGoals">Marketing Goals</Label>
              <Textarea
                id="marketingGoals"
                value={formData.marketingGoals}
                onChange={(e) => setFormData({ ...formData, marketingGoals: e.target.value })}
                placeholder="e.g., Establish thought leadership in sovereign AI space, generate qualified enterprise leads, build trust with government procurement teams"
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={createProfile.isPending || updateProfile.isPending}
            >
              {createProfile.isPending || updateProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                profile ? "Update Profile" : "Create Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
