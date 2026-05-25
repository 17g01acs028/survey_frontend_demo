"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import parser from "xml2js";
import Loading from "@/components/Questions/Loading";
import axios from "axios";
import { toast } from "react-toastify";

export default function Home() {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSurveys = () => {
    fetch(`${url}/api/surveys`)
      .then((res) => res.text())
      .then((xmlData) => {
        parser.parseString(xmlData, (err, result) => {
          if (!err && result?.surveys?.survey) {
            const parsedSurveys = Array.isArray(result.surveys.survey)
              ? result.surveys.survey
              : [result.surveys.survey];
            setSurveys(parsedSurveys);
          } else {
            setSurveys([]);
          }
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSurveys();
  }, [url]);

  const handleDeleteSurvey = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this survey? All associated questions and responses will be lost.")) return;
    try {
      await axios.delete(`${url}/api/surveys/delete/${id}`);
      toast.success("Survey deleted successfully!");
      fetchSurveys();
    } catch (err) {
      toast.error("Failed to delete survey.");
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto py-10 mt-[100px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Available Surveys</h1>
        <Link href="/create">
          <Button>Create New Survey</Button>
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : surveys.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No surveys available at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((survey: any) => (
            <Card key={survey.$.id}>
              <CardHeader>
                <CardTitle>{survey.$.name}</CardTitle>
                <CardDescription>
                  {survey.description && survey.description[0]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Responses: {survey.$.response_count}</p>
                <p className="text-sm text-gray-500">Created: {new Date(survey.created_at[0]).toLocaleDateString()}</p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex w-full gap-2">
                  <Link href={`/take/${survey.$.id}`} className="flex-1">
                    <Button className="w-full">Take Survey</Button>
                  </Link>
                  <Link href={`/response?surveyId=${survey.$.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">View Responses</Button>
                  </Link>
                </div>
                <Link href={`/create/${survey.$.id}`} className="w-full">
                  <Button variant="secondary" className="w-full">Edit / Add Questions</Button>
                </Link>
                <Button variant="destructive" className="w-full" onClick={() => handleDeleteSurvey(survey.$.id)}>
                  Delete Survey
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
