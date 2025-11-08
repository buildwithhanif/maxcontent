import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
    brandVoice: "professional" as "professional" | "casual" | "friendly" | "authoritative",
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
        brandVoice: profile.brandVoice || "professional",
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
                placeholder="e.g., SaaS, E-commerce, Healthcare"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your company, mission, and what makes you unique..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productService">Product / Service Details</Label>
              <Textarea
                id="productService"
                value={formData.productService}
                onChange={(e) => setFormData({ ...formData, productService: e.target.value })}
                placeholder="What products or services do you offer?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience / ICP</Label>
              <Textarea
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="Who is your ideal customer? Demographics, pain points, goals..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandVoice">Brand Voice</Label>
              <Select
                value={formData.brandVoice}
                onValueChange={(value: any) => setFormData({ ...formData, brandVoice: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valuePropositions">Key Value Propositions</Label>
              <Textarea
                id="valuePropositions"
                value={formData.valuePropositions}
                onChange={(e) => setFormData({ ...formData, valuePropositions: e.target.value })}
                placeholder="What are your 3-5 key value propositions?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitors">Competitors</Label>
              <Input
                id="competitors"
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                placeholder="List your main competitors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketingGoals">Marketing Goals</Label>
              <Textarea
                id="marketingGoals"
                value={formData.marketingGoals}
                onChange={(e) => setFormData({ ...formData, marketingGoals: e.target.value })}
                placeholder="What are your marketing objectives?"
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
  );
}
