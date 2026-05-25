"use client";

import { Questions } from '@/components/Questions/Form';
import { useParams } from 'next/navigation';

export default function TakeSurveyPage() {
  const params = useParams();
  const surveyId = params.surveyId as string;

  return (
    <div className='mt-[100px]'>
      <Questions surveyId={surveyId} />
    </div>
  )
}
