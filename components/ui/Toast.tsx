"use client"
import React from 'react'
import { toast } from "react-toastify";
const Toast = ({message}:any) => {

    return  toast.error(message);
 
}

export default Toast