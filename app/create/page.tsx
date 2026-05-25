"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import parser from "xml2js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";

export default function CreateSurveyPage() {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const { push } = useRouter();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const xml = `<survey><name>${name}</name><description>${description}</description></survey>`;
      const response = await axios.post(`${url}/api/surveys/new`, xml, {
        headers: { "Content-Type": "text/xml" }
      });

      if (response.status === 201) {
        toast.success("Survey created successfully!");
        
        // Parse the response to get the ID
        parser.parseString(response.data, (err, result) => {
          if (!err && result.result?.id) {
            push(`/create/${result.result.id[0]}`);
          } else {
            push(`/`);
          }
        });
      } else {
        toast.error("Failed to create survey.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 mt-[100px] flex justify-center items-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create a New Survey</CardTitle>
          <CardDescription>Give your survey a name and description to get started.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Survey Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Employee Satisfaction Survey"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this survey about?"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button disabled={loading} type="submit" className="w-full">
              {loading ? "Creating..." : "Continue to Add Questions"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
