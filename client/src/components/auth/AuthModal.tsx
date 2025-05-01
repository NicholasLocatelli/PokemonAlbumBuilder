import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, EyeIcon, EyeOffIcon, KeyIcon, UserIcon, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    displayName: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

type AuthModalProps = {
  children: React.ReactNode;
};

export default function AuthModal({ children }: AuthModalProps) {
  const { login, register, isLoading, error: authError } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form error when tab changes or dialog closes
  useEffect(() => {
    setFormError(null);
  }, [activeTab, open]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle forgot password
  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "This feature is coming soon. Please contact support if you need to reset your password.",
      variant: "default",
    });
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await login(data.username, data.password);
      setOpen(false);
    } catch (error) {
      // Show error in the form
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await register(data.username, data.password, data.displayName || undefined);
      setOpen(false);
    } catch (error) {
      // Show error in the form
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Registration failed. Please try a different username.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form fields when the dialog is closed
  useEffect(() => {
    if (!open) {
      // Wait for the dialog transition to finish before resetting
      const timeout = setTimeout(() => {
        loginForm.reset();
        registerForm.reset();
        setFormError(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open, loginForm, registerForm]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl flex items-center gap-2">
            <KeyIcon className="h-6 w-6 text-primary" />
            Pokémon Card Album
          </DialogTitle>
          <DialogDescription>
            Sign in to save and manage your card collections
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Tabs
          defaultValue="login"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mt-4"
        >
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="login" className="text-base">
              <UserIcon className="h-4 w-4 mr-2" />
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="text-base">
              <KeyIcon className="h-4 w-4 mr-2" />
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Enter your username" 
                            className="pl-9" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base">Password</FormLabel>
                        <span
                          onClick={handleForgotPassword}
                          className="text-xs text-primary cursor-pointer hover:underline"
                        >
                          Forgot Password?
                        </span>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <KeyIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-9 pr-9" 
                            {...field}
                          />
                          <div 
                            className="absolute right-3 top-3 cursor-pointer" 
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                          >
                            {showLoginPassword ? (
                              <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full text-base py-6"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Choose a username" 
                            className="pl-9" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        This will be your login name and cannot be changed later.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Display Name (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="How you want to be known"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        This is how your name will appear in the app.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showRegisterPassword ? "text" : "password"}
                            placeholder="Create a password"
                            className="pl-9 pr-9"
                            {...field}
                          />
                          <div 
                            className="absolute right-3 top-3 cursor-pointer" 
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          >
                            {showRegisterPassword ? (
                              <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Password must be at least 6 characters long.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className="pl-9 pr-9"
                            {...field}
                          />
                          <div 
                            className="absolute right-3 top-3 cursor-pointer" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full text-base py-6 mt-4"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col space-y-2 mt-6">
          <div className="text-xs text-center text-muted-foreground">
            {activeTab === "login" ? (
              <p>
                Don't have an account?{" "}
                <span 
                  className="text-primary cursor-pointer hover:underline" 
                  onClick={() => setActiveTab("register")}
                >
                  Register
                </span>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <span 
                  className="text-primary cursor-pointer hover:underline" 
                  onClick={() => setActiveTab("login")}
                >
                  Login
                </span>
              </p>
            )}
          </div>
          <div className="text-xs text-center text-muted-foreground">
            By using this service, you agree to our Terms of Service and Privacy Policy.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}