"use client"
import { Button } from "@/components/ui/button"
import parser from 'xml2js';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,

} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link";
import { DownloadIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import Loading from "./Loading";


const Response = () => {
    const searchParams = useSearchParams();
    const surveyId = searchParams.get('surveyId');

    const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const d_url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

    const [isloading, setLoading] = useState(true);
    const [response, setResponse] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [email, setEmail] = useState("");
    const [count, setCount] = useState(10);

    const [questions, setQuestions] = useState<any[]>([]);

    useEffect(() => {
        setLoading(true);
        if (!surveyId) {
            setLoading(false);
            return;
        }

        const fetchResponses = fetch(`${url}/api/questions/${surveyId}/responses?page=${page}&pageSize=${pageSize}&email=${email}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.text();
            });

        const fetchQuestions = fetch(`${url}/api/questions/${surveyId}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.text();
            });

        Promise.all([fetchResponses, fetchQuestions])
            .then(([resXml, qXml]) => {
                parser.parseString(resXml, (err, result) => {
                    if (!err && result && result.question_responses) {
                        setCount(result.question_responses.$.total_count || 0);
                        let resData = result.question_responses.question_response || [];
                        if (!Array.isArray(resData)) resData = [resData];
                        setResponse(resData);
                    } else {
                        setResponse([]);
                        setCount(0);
                    }
                });

                parser.parseString(qXml, (err, result) => {
                    if (!err && result && result.questions && result.questions.question) {
                        let qData = result.questions.question;
                        if (!Array.isArray(qData)) qData = [qData];
                        setQuestions(qData);
                    } else {
                        setQuestions([]);
                    }
                });

                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
                setResponse([]);
                setCount(0);
                setQuestions([]);
                setLoading(false);
            });
    }, [page, pageSize, email, surveyId, url]);



    function generateDownloadLink(fileName: any) {
        return `${d_url}/api/questions/response/download/${fileName}`;
    }


    function Prev() {
        setPage((pre) => pre - 1);
    }

    function Next() {
        setPage((pre) => pre + 1);
    }
    return (
        <div className="mt-[100px] flex justify-center items-center">
            <Card className="w-full sm:w-[95%] lg:w-[90%]  max-h-[calc(100vh-100px)] ">
                <CardHeader>
                    <div className="flex justify-between p-2 border rounded-lg items-center">
                        <div className="flex items-center gap-[0.2rem]">
                            Show
                            <Select onValueChange={(value) => { setPageSize(parseInt(value)); setPage(1) }} defaultValue="10">
                                <SelectTrigger className="w-[50px]">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Entries</SelectLabel>
                                        <SelectItem value="5">5</SelectItem>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            Entries
                        </div>
                        <div className="flex justify-center items-center"><Label className="text-lg mr-2">Search:</Label><Input onChange={(e) => setEmail(e.target.value)} /></div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isloading ? (
                        <Loading />
                    ) : (
                        <div className="overflow-hidden my_table  max-h-[calc(100vh-290px)]">
                            <div className="inline-block min-w-full py-2 sm:px-6 lg:px-8 z-10">
                                <div className="overflow-hidden">
                                    <table className="min-w-full text-left text-sm font-light">
                                        <thead className="border-b font-medium dark:border-neutral-500">
                                            <tr>
                                                {questions && questions.map((q: any, i: number) => (
                                                    <th key={i} scope="col" className="px-6 py-4">{q.text || q.$.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {response && response.map((value: any, index: any) => (
                                                <tr key={index} className="border-b dark:border-neutral-500">
                                                    {questions && questions.map((q: any, i: number) => {
                                                        const qName = q.$.name;
                                                        const rawValue = value[qName];
                                                        
                                                        // Handle parsing value depending on type if necessary
                                                        let displayValue = rawValue;
                                                        if (Array.isArray(rawValue)) {
                                                            displayValue = rawValue.join(", ");
                                                        } else if (typeof rawValue === 'string' && rawValue.startsWith('[')) {
                                                            try {
                                                                const parsed = JSON.parse(rawValue);
                                                                if (Array.isArray(parsed)) {
                                                                    displayValue = parsed.join(", ");
                                                                }
                                                            } catch(e) {}
                                                        }

                                                        return (
                                                            <td key={i} className="whitespace-pre-wrap px-6 py-4">
                                                                {displayValue || "-"}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}





                    {/* End of table content */}
                </CardContent>

                <CardFooter className="flex justify-between">
                    {<Button type="button" onClick={Prev} disabled={page < 2 ? true : false} >Previous</Button>}
                    {<Button variant={"outline"}>Page {page} of {`${count && Math.ceil(count / pageSize)}`}</Button>}
                    {<Button type="button" onClick={Next} disabled={page >= Math.ceil(count / pageSize) ? true : false} >Next</Button>}

                </CardFooter>
            </Card>
        </div >
    )
}

export default Response 