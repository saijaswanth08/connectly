import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ArrowLeft, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ReportIssuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    title: "",
    category: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-issue-report", {
        body: {
          name: form.name,
          email: form.email,
          title: form.title,
          category: form.category,
          description: form.description,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Unable to send the report. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Your issue has been submitted successfully.</h2>
          <p className="text-muted-foreground">
            Our support team will review it shortly.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setForm({ name: user?.user_metadata?.full_name || "", email: user?.email || "", title: "", category: "", description: "" });
            }}
          >
            Report Another Issue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back
        </button>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-destructive/10 mx-auto">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Report an Issue</h1>
          <p className="text-muted-foreground">
            Let us know what went wrong and we'll fix it as soon as possible.
          </p>
        </div>

        <Card className="border border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter issue title"
                  maxLength={500}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  rows={5}
                  maxLength={5000}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bug">Bug</SelectItem>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                    <SelectItem value="Technical Issue">Technical Issue</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  maxLength={200}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
