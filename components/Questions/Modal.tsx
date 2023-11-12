import React from "react";
import { Label } from "../ui/label";

export default function Modal({ message, title }: any) {

    return (

        <>
            <div
                className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
            >
                <div className="relative w-auto my-6 mx-auto max-w-3xl">
                    {/*content*/}
                    <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                        {/*header*/}
                        <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                            <h3 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-muted-foreground">
                                {title}
                            </h3>
                        </div>
                        {/*body*/}
                        <div className="relative p-6 flex-auto">
                            <Label className="my-4 text-blueGray-500 text-lg leading-relaxed">
                                {message}

                            </Label>
                            <div className="bg-white flex space-x-2 p-5 rounded-full justify-center items-center">
                                <div className="bg-blue-600 p-2  w-4 h-4 rounded-full animate-bounce  blue-circle"></div>
                                <div className="bg-green-600 p-2 w-4 h-4 rounded-full animate-bounce green-circle"></div>
                                <div className="bg-red-600 p-2  w-4 h-4 rounded-full animate-bounce red-circle"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>

    );
}