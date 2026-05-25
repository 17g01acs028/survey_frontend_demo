"use client";

import CreateQuestion from "@/components/Questions/CreateQuestion";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AddQuestionsPage() {
  const params = useParams();
  const surveyId = params.surveyId as string;

  return (
    <div className="container mx-auto py-10 mt-[100px]">
      <div className="flex justify-between items-center mb-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">Add Questions</h1>
        <Link href="/">
          <Button variant="outline">Done Adding</Button>
        </Link>
      </div>
      <CreateQuestion surveyId={surveyId} />
    </div>
  );
}
