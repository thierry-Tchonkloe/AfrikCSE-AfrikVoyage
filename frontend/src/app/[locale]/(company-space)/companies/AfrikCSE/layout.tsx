"use client";

import React from "react";

// Minimal layout to ensure this file is a module and fix TS errors during build.
export default function AfrikCSELayout({ children }: { children: React.ReactNode }) {
	return (
        <>
            <div className=" px-4 py-6 lg:px-8">
                {children}
            </div>
        </>
    );
}