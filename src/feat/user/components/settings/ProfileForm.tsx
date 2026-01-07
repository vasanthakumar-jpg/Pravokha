import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Textarea } from "@/ui/Textarea";

interface ProfileFormProps {
  profile: any;
  updateProfile: (data: any) => void;
  loading: boolean;
  strength?: {
    score: number;
    checks: {
      emailVerified: boolean;
      phoneVerified: boolean;
      hasPayment: boolean;
      hasAddress: boolean;
      hasAvatar: boolean;
      hasBio: boolean;
      hasDob: boolean;
    }
  };
}

export const ProfileForm = ({ profile, updateProfile, loading, strength }: ProfileFormProps) => {
  const [formData, setFormData] = useState(profile);

  // Sync state with props when profile data loads
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  // Fallback defaults if strength not provided
  const { score = 0, checks = {} as any } = strength || {};

  return (
    <div className="grid gap-6 md:grid-cols-12">
      <Card className="md:col-span-8 border-none shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Personal Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. John Doe"
                className="bg-background/50 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-muted h-10" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="bg-background/50 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.date_of_birth || ''}
                onChange={e => setFormData({ ...formData, date_of_birth: e.target.value || null })}
                className="bg-background/50 h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us a bit about yourself..."
              className="bg-background/50 min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t p-4 md:p-6 pt-4">
          <Button onClick={() => updateProfile(formData)} disabled={loading} className="w-full md:w-auto gap-2">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <Card className="md:col-span-4 border-none shadow-lg bg-gradient-to-br from-primary/5 to-accent/5 h-fit">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-primary text-lg md:text-xl">Profile Strength</CardTitle>
          <CardDescription>Complete your profile to get the most out of Pravokha.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Completion</span>
                <span>{score}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${score}%` }}></div>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { checked: checks.emailVerified, done: "Email Verified", todo: "Verify Email" },
                { checked: checks.phoneVerified, done: "Phone Added", todo: "Add Phone Number" },
                { checked: checks.hasAddress, done: "Address Added", todo: "Add Address" },
                { checked: checks.hasPayment, done: "Payment Method Added", todo: "Add Payment Method" },
                { checked: checks.hasAvatar, done: "Profile Photo Added", todo: "Upload Profile Photo" },
                { checked: checks.hasBio, done: "Bio Added", todo: "Fill Bio" },
                { checked: checks.hasDob, done: "Date of Birth Added", todo: "Add Date of Birth" }
              ].map((item, i) => (
                <li key={i} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${item.checked ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/10 font-medium'}`}>
                  {item.checked ?
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded-full"><Check className="h-3 w-3" /></div> :
                    <div className="h-5 w-5 border-2 border-amber-300 dark:border-amber-700 rounded-full shrink-0 flex items-center justify-center text-[8px] text-amber-600">!</div>
                  }
                  {item.checked ? item.done : item.todo}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
