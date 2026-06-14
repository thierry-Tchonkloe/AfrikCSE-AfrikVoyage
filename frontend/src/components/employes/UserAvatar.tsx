"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    avatar?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    background?: string;
    className?: string;
    onClick?: () => void;
}

export function UserAvatar({ avatar, firstName, lastName, background = "#0f766e", className, onClick }: UserAvatarProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "relative rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden",
                className
            )}
            style={{ background: avatar ? undefined : background }}
        >
            {avatar ? (
                <Image src={avatar} alt="" fill className="object-cover" />
            ) : (
                <span>{firstName?.[0] ?? ""}{lastName?.[0] ?? ""}</span>
            )}
        </div>
    );
}
