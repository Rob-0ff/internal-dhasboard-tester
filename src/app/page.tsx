"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/actions";
import { LoaderDots } from "@/components/ui/loaderDots";

export default function Home() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    if (errorParam) {
      setError(errorParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await login(formData);
    } catch (err) {
      console.error("Login failed:", err);
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full min-h-[50vh] max-w-sm flex flex-col shadow-xl shadow-purple-500/50">
        <img
          src="/bag-learning-logo.png"
          alt="Bag Logo"
          className="w-24 h-24 mb-4 self-center"
        />
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Login to Bag Dashboard</CardTitle>
          </div>
        </CardHeader>
        <form action={handleLogin}>
          <CardContent className="flex-1">
            <div className="flex flex-col gap-6 h-full">
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="flex-1" />
            </div>
            {error && (
              <p className="text-red-500 mt-2 pb-4 text-center">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2 mt-auto">
            <Button
              type="submit"
              className="w-full bg-purple-500 hover:bg-purple-600"
              disabled={loading}
            >
              {!loading ? "Login" : <LoaderDots />}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
