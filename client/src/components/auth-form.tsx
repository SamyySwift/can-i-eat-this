import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().optional(),
});

const registerSchema = loginSchema.extend({
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthFormProps {
  mode: "login" | "register";
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  onRegister: (email: string, password: string) => Promise<{ success: boolean; user?: any; error?: any }>;
}

export default function AuthForm({ mode, onLogin, onRegister }: AuthFormProps) {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      rememberMe: false,
    },
  });

  const handleLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await onLogin(values.email, values.password);
      if (result.success) {
        setLocation("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const result = await onRegister(values.email, values.password);
      if (result.success) {
        setLocation("/dietary-profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass max-w-md w-full space-y-8 p-10 rounded-xl shadow-lg">
        <div>
          <div className="flex justify-center">
            <Utensils className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === "login" ? (
              <>
                Or{" "}
                <Link href="/register">
                  <a className="font-medium text-primary hover:text-primary-dark">
                    start your 14-day free trial
                  </a>
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login">
                  <a className="font-medium text-primary hover:text-primary-dark">
                    Sign in
                  </a>
                </Link>
              </>
            )}
          </p>
        </div>

        {mode === "login" ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="mt-8 space-y-6">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input placeholder="Email address" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={loginForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Remember me</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary-dark">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="mt-8 space-y-6">
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I agree to the terms and conditions</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
