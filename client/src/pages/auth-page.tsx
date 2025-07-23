import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  usernameOrEmail: z.string().min(3, "Username or email must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    displayName: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { loginMutation, registerMutation, user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form error when tab changes
  useEffect(() => {
    setFormError(null);
  }, [activeTab]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Define animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1 
      }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { duration: 0.3 } 
    }
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    }
  };
  
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    },
    hover: { 
      scale: 1.03,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    }
  };

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
      await loginMutation.mutateAsync(data);
      // No need to redirect, the component will automatically redirect when user state updates
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
      await registerMutation.mutateAsync(data);
      // No need to redirect, the component will automatically redirect when user state updates
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

  // If the user is already logged in, redirect to home
  // This must come after all the hooks are called
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full">
      {/* Left section - Auth form */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center"
      >
        <div className="max-w-md mx-auto w-full">
          {/* Form header */}
          <motion.div variants={fieldVariants} className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2">
              <KeyIcon className="h-6 w-6 text-primary" />
              Pokémon Card Album
            </h1>
            <p className="text-muted-foreground">
              {activeTab === "login" 
                ? "Sign in to access your card collections" 
                : "Create an account to start your collection"}
            </p>
          </motion.div>

          {/* Tab buttons */}
          <motion.div 
            variants={fieldVariants}
            className="flex space-x-4 mb-6"
          >
            <Button 
              variant={activeTab === "login" ? "default" : "outline"}
              className={cn(
                "flex-1 py-6", 
                activeTab === "login" 
                  ? "shadow-md" 
                  : "hover:text-primary"
              )}
              onClick={() => setActiveTab("login")}
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Login
            </Button>
            <Button 
              variant={activeTab === "register" ? "default" : "outline"}
              className={cn(
                "flex-1 py-6", 
                activeTab === "register" 
                  ? "shadow-md" 
                  : "hover:text-primary"
              )}
              onClick={() => setActiveTab("register")}
            >
              <KeyIcon className="h-4 w-4 mr-2" />
              Register
            </Button>
          </motion.div>

          {/* Error alert */}
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form content */}
          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.div
                key="login-form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <motion.div variants={fieldVariants}>
                      <FormField
                        control={loginForm.control}
                        name="usernameOrEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Username o Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Inserisci username o email" 
                                  className="pl-9" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div variants={fieldVariants}>
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
                    </motion.div>

                    <motion.div 
                      variants={buttonVariants}
                      whileHover="hover"
                      className="pt-2"
                    >
                      <Button
                        type="submit"
                        className="w-full text-base py-6"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Accesso...
                          </>
                        ) : (
                          "Accedi"
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </motion.div>
            ) : (
              <motion.div
                key="register-form"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <motion.div variants={fieldVariants}>
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
                    </motion.div>

                    <motion.div variants={fieldVariants}>
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="email"
                                  placeholder="tua@email.com"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div variants={fieldVariants}>
                      <FormField
                        control={registerForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Nome Visualizzato (Opzionale)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Come vuoi essere conosciuto"
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
                    </motion.div>

                    <motion.div variants={fieldVariants}>
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
                    </motion.div>

                    <motion.div variants={fieldVariants}>
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
                    </motion.div>

                    <motion.div 
                      variants={buttonVariants} 
                      whileHover="hover"
                      className="pt-2"
                    >
                      <Button
                        type="submit"
                        className="w-full text-base py-6"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creazione...
                          </>
                        ) : (
                          "Crea Account"
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.div 
            variants={fieldVariants}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            <p>
              By using this service, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right section - Hero image and text */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/90 to-primary/50 p-12 flex-col justify-center items-center text-white"
      >
        <div className="max-w-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8 flex justify-center"
          >
            <div className="w-40 h-40 rounded-full bg-white/20 flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 100 100" 
                className="w-24 h-24 text-white"
              >
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="3" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="3" />
              </svg>
            </div>
          </motion.div>
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-2xl md:text-3xl font-bold mb-4"
          >
            Manage Your Pokémon Card Collection
          </motion.h2>
          
          <motion.ul
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="space-y-4 text-white/90"
          >
            <li className="flex items-start">
              <div className="mr-3 mt-1 bg-white/20 p-1 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Create customized card albums with different layouts</span>
            </li>
            <li className="flex items-start">
              <div className="mr-3 mt-1 bg-white/20 p-1 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Search the entire Pokémon TCG database for your cards</span>
            </li>
            <li className="flex items-start">
              <div className="mr-3 mt-1 bg-white/20 p-1 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Drag and drop cards to organize your collection</span>
            </li>
            <li className="flex items-start">
              <div className="mr-3 mt-1 bg-white/20 p-1 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Access your collection from any device, anywhere</span>
            </li>
          </motion.ul>
        </div>
      </motion.div>
    </div>
  );
}