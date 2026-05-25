"use client"

import Link from 'next/link';
import { Button } from "@/components/ui/button"
import parser from 'xml2js';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormEvent, useEffect, useState } from "react"
import { toast } from "react-toastify";
import Loading from "./Loading";
import Modal from "./Modal";


export function Questions({ surveyId }: { surveyId: string }) {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const [isloading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [submiting, setSubmitting] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const { push } = useRouter();

  useEffect(() => {
    // Fetch Questions
    fetch(`${url}/api/questions/${surveyId}`)
      .then((response) => response.text())
      .then((xmlData) => {
        // Parse the XML into a JavaScript object
        parser.parseString(xmlData, (err, result) => {
          if (!err) {
            // Access the parsed data, which should be similar to JSON
            setQuestions(result.questions.question);
            setLoading(false);
          }
        });
      })
      .catch((error) => {
        console.error('Error fetching or parsing XML:', error);
      });
  }, [url, surveyId]);

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    setSubmitting(true);
    e.preventDefault(); // Prevent default form submission
    // Manually handle form submission

    if (validate(currentCard)?.error) {
      toast.error(validate(currentCard)?.error);
    } else {
      const formData = new FormData(e.currentTarget);

      try {
        const response = await axios.put(`${url}/api/questions/${surveyId}/response`, formData);
        if (response.status === 201) {
          toast("Data saved successfully.");
          push(`/response?surveyId=${surveyId}`);
        } else {
          toast("Failed to save data." + response.status);
          setSubmitting(false);
        }
      } catch (err: any) {
        setSubmitting(false);
        const errorMessage = err.response?.data?.error || "An error occurred while submitting the survey.";
        toast.error(errorMessage);
        console.log(err);
      }

    }
  };

  const handleNext = () => {
    // Validate and update form data before proceeding to the next card
    // You can use React Hook Form's methods here for validation and data updates.
    if (currentCard < questions.length - 1) {


      if (validate(currentCard)?.error) {
        toast.error(validate(currentCard)?.error);
      } else {
        setCurrentCard(currentCard + 1)

      }

    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  return (
    <form className="flex items-center justify-center" onSubmit={handleFormSubmit}>
      <Card className="w-full sm:w-[70%] lg:w-[60%]  max-h-[calc(100vh-100px)] overflow-auto">
        <CardHeader>
          <CardTitle>Survey</CardTitle>
          <CardDescription>Please answer Every Question corectly and make sure you read instructions</CardDescription>
        </CardHeader>
        <CardContent>

          <div className="grid w-full items-center gap-4">

            <div className="flex flex-col space-y-1.5">
              {isloading ? (<Loading/>) : (<>
                {!questions || questions.length === 0 ? (
                  <div className="text-center space-y-4 py-8">
                    <p>We do not have any survey at the moment.</p>
                    <Link href="/create">
                      <Button type="button">Create Survey</Button>
                    </Link>
                  </div>
                ) : null}
              {questions && questions.map((question: any, index) => (
                <div key={index}>
                  {question.$.type === 'choice' ? (
                    <Card className={`w-full ${index === currentCard ? "" : "hidden"}`}>
                      <CardHeader>
                        <CardTitle>{question.text}</CardTitle>
                        <CardDescription>{question.description}</CardDescription>
                      </CardHeader>
                      <CardContent>

                        <div className="grid w-full items-center gap-4">

                          <div className="flex flex-col space-y-1.5">


                            {question.options[0].$.multiple === 'no' ? (
                              <div id={`radio_${index}`}>

                                {question.options[0].option.map((option: any, index: any) => (
                                  <div key={index} className="flex justify-between">
                                    <label htmlFor={option.value}>{option._}</label>
                                    <input type="radio" name={question.$.name} value={option.$.value} />

                                  </div>
                                ))}
                              </div>

                            ) : (

                              // Use checkboxes for multiple-choice questions
                              <div id={`check_${index}`}>
                                {question.options[0].option.map((option: any, index: any) => (
                                  <div key={index} className="flex justify-between">
                                    <label htmlFor={option.value}>{option._}</label>

                                    <input
                                      type="checkbox"
                                      id={`data_${index}`}
                                      name={question.$.name}
                                      value={option._}
                                      className="p-4"
                                    />

                                  </div>
                                ))}
                              </div>
                            )}

                          </div>
                        </div>
                      </CardContent>

                    </Card>
                  ) : question.$.type === 'file' ? (
                    // Use an input of type "file" for file upload questions
                    <Card className={`w-full ${index === currentCard ? "" : "hidden"}`}>
                      <CardHeader>
                        <CardTitle>{question.text}</CardTitle>
                        <CardDescription>{question.description}</CardDescription>
                      </CardHeader>
                      <CardContent>

                        <div className="grid w-full items-center gap-4">

                          <div className="flex flex-col space-y-1.5">

                            <Input
                              type="file"
                              id={`data_${index}`}
                              name={question.$.name}
                              required
                              multiple
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : question.$.type === 'range' ? (
                    <Card className={`w-full ${index === currentCard ? "" : "hidden"}`}>
                      <CardHeader>
                        <CardTitle>{question.text}</CardTitle>
                        <CardDescription>{question.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid w-full items-center gap-4">
                          <div className="flex flex-col space-y-1.5">
                            <div className="flex justify-between text-sm text-gray-500 mb-2">
                              <span>{question.range_properties && question.range_properties[0].$.min}</span>
                              <span>{question.range_properties && question.range_properties[0].$.max}</span>
                            </div>
                            <input
                              type="range"
                              id={`data_${index}`}
                              name={question.$.name}
                              min={question.range_properties && question.range_properties[0].$.min}
                              max={question.range_properties && question.range_properties[0].$.max}
                              step={question.range_properties && question.range_properties[0].$.step}
                              required={question.$.required === 'yes'}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : question.$.type === 'rate' ? (
                    <Card className={`w-full ${index === currentCard ? "" : "hidden"}`}>
                      <CardHeader>
                        <CardTitle>{question.text}</CardTitle>
                        <CardDescription>{question.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid w-full items-center gap-4">
                          <div className="flex flex-col space-y-1.5">
                            <StarRatingInput 
                              max={Number(question.rate_properties?.[0]?.$.max) || 5} 
                              name={question.$.name} 
                              id={`data_${index}`} 
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className={`w-full ${index === currentCard ? "" : "hidden"}`}>
                      <CardHeader>
                        <CardTitle>{question.text}</CardTitle>
                        <CardDescription>{question.description}</CardDescription>
                      </CardHeader>
                      <CardContent>

                        <div className="grid w-full items-center gap-4">

                          <div className="flex flex-col space-y-1.5">
                            {
                              question.$.type === "short_text" || question.$.type === "email" ? (
                                <Input
                                  type={`${question.$.type === "short_text" ? "text" : question.$.type}`}
                                  id={`data_${index}`}
                                  name={question.$.name}
                                  required={question.$.required === 'yes'}
                                />
                              ) : (
                                <Textarea id={`data_${index}`}
                                  name={question.$.name}
                                  required={question.$.required === 'yes'} placeholder="Start to type here." />
                              )
                            }

                          </div>
                        </div>
                      </CardContent>
                    </Card>

                  )}

                </div>
              ))}

              </>)}
              
              {/* End of question */}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {questions && currentCard > 0 && <Button variant="outline" disabled={submiting ? true : false} type="button" onClick={handlePrevious}>Previous</Button>}
          {questions && currentCard < questions.length - 1 && <Button disabled={submiting ? true : false} type="button" onClick={handleNext}>Next</Button>}
          {questions && currentCard === questions.length - 1 && <Button disabled={submiting ? true : false}>{submiting ? "Saving please wait....." : "Submit"}</Button>}
        </CardFooter>
      </Card>
      {submiting ? (<Modal message="Submitting Please wait " title="Do not close or Refresh this Window please :-)"/>) : null}
    </form>

  )
}

//validate email 
function validateEmail(email: any) {
  // Define a regular expression pattern for a valid email address
  const emailPattern = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;

  // Test the email against the pattern
  return emailPattern.test(email);
}

//this function will be used to validate form
function validate(currentCard: any) {
  const element: any = document.getElementById("data_" + currentCard);
  if (element && element.type === "text") {

    if (element.required) {
      if (element.value === "") {
        return { error: "This field is required" }
      } else {

        return { sucess: "ok Continue" }
      }

    } else {

      return { sucess: "ok Continue" }
    }
  }
  else if (element && element.type === "email") {
    if (element.required) {
      if (element.value === "") {
        return { error: "Please Fill this field" };
      } else {
        if (validateEmail(element.value)) {
          return { sucess: "ok Continue" }
        } else {
          return { error: "Invalid email address" };
        }

      }

    } else {
      return { sucess: "ok Continue" }
    }
  }
  else if (element && element.type === "file") {
    if (element.required) {
      if (!element.files.length) {
        return { error: "Please select at least one file." };
      }

    } else {
      return { sucess: "ok Continue" }
    }
  }

  if (element && element.type === "textarea") {
    if (element.required) {
      if (element.value === "") {
        return { error: "Please Fill this field" };
      } else {
        return { sucess: "ok Continue" }
      }

    } else {
      return { sucess: "ok Continue" }
    }
  }
  //Check if user have selected at least on radio button
  const radioButtonsContainer: any = document.getElementById("radio_" + currentCard);
  if (radioButtonsContainer) {
    const radioButtons = radioButtonsContainer.querySelectorAll('input[type="radio"]');
    let radioSelected = false;

    for (const radioButton of radioButtons) {
      if (radioButton.checked) {
        radioSelected = true;
        break; // Exit the loop if a radio button is checked
      }
    }

    if (!radioSelected) {
      return { error: "Please select an option. radio" }; // Display an error message
      // Prevent the form from submitting
    } else {
      return { sucess: "ok Continue" }
    }
  }



  // Radio check ends Here

  //check if atlease on check box is selected
  const checkButtonsContainer: any = document.getElementById("check_" + currentCard);
  if (checkButtonsContainer) {
    const checkButtons = checkButtonsContainer.querySelectorAll('input[type="checkbox"]');
    let checkSelected = false;

    for (const checkButton of checkButtons) {
      if (checkButton.checked) {
        checkSelected = true;
        break; // Exit the loop if a radio button is checked
      }
    }

    if (!checkSelected) {
      return { error: "Please select an option." }; // Display an error message
      // Prevent the form from submitting
    } else {

      return { sucess: "ok Continue" }
    }
  }


  //Check checkbox end
}

function StarRatingInput({ max, name, id }: { max: number, name: string, id: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <div className="flex flex-col space-y-2">
      <input type="hidden" name={name} id={id} value={rating || ''} required />
      <div className="flex items-center space-x-2 text-yellow-400">
        {Array.from({ length: max }).map((_, i) => {
          const starValue = i + 1;
          return (
            <svg 
              key={i} 
              className={`w-8 h-8 cursor-pointer transition-colors ${starValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(0)}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        })}
      </div>
      {rating > 0 && <span className="text-sm text-gray-500">{rating} out of {max}</span>}
    </div>
  );
}