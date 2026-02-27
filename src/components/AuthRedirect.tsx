"use client";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function AuthRedirect() {
    const { data: session, isPending: loading } = authClient.useSession();

    useEffect(() => {
        if (!loading && !session) {
            redirect("/user/sign-in");
        }
    }, [loading, session]);

    return <div></div>
}