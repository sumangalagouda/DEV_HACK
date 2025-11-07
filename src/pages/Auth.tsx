import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import BrandLogo from "@/components/BrandLogo";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/25 to-secondary/10 p-4 relative overflow-hidden">
      {/* Soft abstract background SVG */}
      <svg className="absolute left-[-20%] top-[-20%] w-[60vw] h-[60vw] blur-3xl opacity-30" viewBox="0 0 700 700">
        <circle cx="350" cy="350" r="340" fill="url(#linGrad)" />
        <defs>
          <linearGradient id="linGrad" x1="0" y1="0" x2="700" y2="700" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c2a0fa" />
            <stop offset="1" stopColor="#2cf2ef" />
          </linearGradient>
        </defs>
      </svg>
      <div className="w-full max-w-lg z-10">
        <Card className="bg-white/75 backdrop-blur-lg border-0 shadow-2xl rounded-3xl px-6 py-12">
          <div className="text-center mb-10">
            <BrandLogo size={56} className="mx-auto mb-3" />
            <h1 className="font-brand-heading text-4xl font-bold text-primary mb-1">Consafe</h1>
            <div className="text-base text-muted-foreground pb-1">Welcome back! Please sign in or create your site account.</div>
          </div>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/10 rounded-xl">
              <TabsTrigger value="signin" className="rounded-xl">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2 text-left">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="me@site.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg px-4 py-3 text-lg" />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-lg px-4 py-3 text-lg" />
                </div>
                <Button type="submit" className="w-full text-lg font-brand-heading rounded-full h-14 mt-2 shadow-lg" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-2 text-left">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" type="text" placeholder="Jane Smith" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="rounded-lg px-4 py-3 text-lg" />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="me@site.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg px-4 py-3 text-lg" />
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="rounded-lg px-4 py-3 text-lg" />
                </div>
                <Button type="submit" className="w-full text-lg font-brand-heading rounded-full h-14 mt-2 shadow-lg" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
