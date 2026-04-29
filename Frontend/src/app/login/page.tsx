"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Leaf, Lock, Recycle, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { persistAuthSession } from "@/lib/auth-session";
import { platformService } from "@/lib/services/platform-service";
import { type PlatformRole } from "@/types/platform";

interface FormErrors {
  email?: string;
  password?: string;
}

function routeByRole(role: PlatformRole) {
  if (role === "SUPER_ADMIN") {
    return "/dashboard";
  }

  if (role === "ORG_ADMIN") {
    return "/org-admin/dashboard";
  }

  if (role === "COLLECTOR") {
    return "/collector/dashboard";
  }

  if (role === "PROCESSOR") {
    return "/processor/dashboard";
  }

  return "/buyer/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@waste2value.africa");
  const [password, setPassword] = useState("Admin@123");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const result = await platformService.login({ email, password, rememberMe });
      persistAuthSession(result, rememberMe);
      setSuccess(true);
      setTimeout(() => {
        router.push(routeByRole(result.user.role));
      }, 420);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/loginimage.png')] bg-cover bg-left bg-no-repeat lg:p-4">
      <div className="grid min-h-screen w-full overflow-hidden border-y border-border shadow-premium-lg lg:min-h-[calc(100vh-2rem)] lg:rounded-2xl lg:border lg:grid-cols-2">
        <section className="relative flex flex-col justify-center gap-10 border-b border-border px-6 py-8 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white/60 p-4 backdrop-blur-sm sm:p-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-brand">
              <Leaf className="h-3.5 w-3.5" />
              Waste2Value Platform
            </div>

            <h1 className="mt-6 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.02em] text-[#0f2a1d] sm:text-[2.2rem]">
              Transforming waste into measurable value through one premium operating platform.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#355244] sm:text-[0.98rem]">
              Manage circular economy organizations, enforce platform governance, and scale dignified impact with confidence.
            </p>

            <div className="mt-6 grid gap-2.5">
              <div className="inline-flex items-center gap-2 text-sm text-[#27483a]">
                <ShieldCheck className="h-4 w-4 text-brand" />
                Platform-level governance with audit-ready controls
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-[#27483a]">
                <Recycle className="h-4 w-4 text-brand" />
                Unified visibility across organizations and users
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-[#27483a]">
                <Lock className="h-4 w-4 text-brand" />
                Secure access and accountability by design
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl">
            <div className="grid gap-2.5 rounded-xl border border-border bg-white/90 p-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Organizations</p>
                <p className="text-lg font-semibold text-foreground">8</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Platform Users</p>
                <p className="text-lg font-semibold text-foreground">83</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Readiness</p>
                <p className="text-lg font-semibold text-foreground">79%</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-premium sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Welcome Back</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">Sign in to Waste2Value</h2>
              <p className="mt-1 text-sm text-muted-foreground">Unified access for platform teams and tenant users.</p>
            </div>

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  hasError={Boolean(errors.email)}
                  placeholder="you@waste2value.africa"
                />
                {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email}</p> : null}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Password
                  </label>
                  <Link href="#" className="text-xs font-medium text-brand hover:text-brand-emphasis">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    hasError={Boolean(errors.password)}
                    className="pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-soft hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? <p className="mt-1 text-xs text-danger">{errors.password}</p> : null}
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                Remember me on this device
              </label>

              {apiError ? <p className="rounded-lg border border-[#f4c7c2] bg-[#fff5f3] px-3 py-2 text-sm text-danger">{apiError}</p> : null}
              {success ? <p className="rounded-lg border border-[#c9e5d5] bg-[#eaf7f0] px-3 py-2 text-sm text-[#11643c]">Login successful. Redirecting...</p> : null}

              <Button className="w-full" type="submit" loading={loading}>
                Sign In
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Secure platform access for authorized Waste2Value users.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
