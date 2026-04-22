"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/app/components/ToastProvider";

type Theme = "light" | "dark";

type NavItem = {
    label: string;
    href: string;
};

const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Light Control", href: "/light" },
];

const THEME_STORAGE_KEY = "ietp-theme";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { pushToast } = useToast();
    const [menuOpen, setMenuOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>("light");
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const nextTheme: Theme = stored ?? (systemDark ? "dark" : "light");

        setTheme(nextTheme);
        document.documentElement.dataset.theme = nextTheme;
    }, []);

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                const response = await fetch("/api/auth/me", { cache: "no-store" });
                if (!response.ok) {
                    if (mounted) {
                        setUserEmail(null);
                    }
                    return;
                }

                const data = (await response.json()) as { user?: { email?: string } };
                if (mounted && data.user?.email) {
                    setUserEmail(data.user.email);
                } else if (mounted) {
                    setUserEmail(null);
                }
            } catch {
                // Ignore auth errors in navbar.
            } finally {
                // Intentionally no loading state in navbar.
            }
        };

        checkAuth();

        return () => {
            mounted = false;
        };
    }, [pathname]);

    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    const toggleTheme = () => {
        const nextTheme: Theme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        document.documentElement.dataset.theme = nextTheme;
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    };

    const isDark = theme === "dark";

    const navigateTo = (href: string) => {
        try {
            router.push(href);
        } catch {
            window.location.assign(href);
        }
    };

    const handleLightControlClick = async (
        event: React.MouseEvent<HTMLAnchorElement>,
        closeMenu?: boolean
    ) => {
        event.preventDefault();

        if (closeMenu) {
            setMenuOpen(false);
        }

        try {
            const response = await fetch("/api/auth/me", { cache: "no-store" });
            if (!response.ok) {
                pushToast("Please sign in first.", "warning");
                navigateTo("/");
                return;
            }

            navigateTo("/light");
        } catch {
            pushToast("Please sign in first.", "warning");
            navigateTo("/");
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUserEmail(null);
            pushToast("Signed out.", "success");
            navigateTo("/");
        } catch {
            pushToast("Could not sign out.", "warning");
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-[var(--nav-border)] bg-[var(--nav-bg)] backdrop-blur">
            <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-[0.7rem] font-semibold text-white shadow-[0_12px_30px_-16px_rgba(0,0,0,0.7)] sm:h-11 sm:w-11 sm:text-sm">
                        IOT
                    </div>
                    <div className="max-w-[10rem] truncate text-xs font-semibold leading-tight text-[var(--nav-title)] sm:max-w-[24rem] sm:text-sm lg:max-w-[32rem]">
                        IoT-Based Light Intensity Monitoring and Smart Control System with Web Application
                    </div>
                </div>

                <div className="hidden items-center gap-6 text-sm font-semibold text-[var(--nav-text)] md:flex">
                    {userEmail ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-[var(--nav-text)]">
                                {userEmail}
                            </span>
                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                                className="rounded-full border border-[var(--nav-border)] p-2 text-[var(--nav-text)] transition hover:text-[var(--nav-accent)]"
                            >
                                {isDark ? (
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <circle cx="12" cy="12" r="4" />
                                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                                    </svg>
                                ) : (
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                                    </svg>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                aria-label="Log out"
                                title="Log out"
                                className="rounded-full border border-[var(--nav-border)] p-2 text-[var(--nav-text)] transition hover:text-[var(--nav-accent)]"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M9 6H5a2 2 0 00-2 2v8a2 2 0 002 2h4" />
                                    <path d="M16 12H9" />
                                    <path d="M13 9l3 3-3 3" />
                                    <path d="M17 6h2a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <>
                            {navItems.map((item) =>
                                item.href === "/light" ? (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={handleLightControlClick}
                                        className="transition hover:text-[var(--nav-accent)]"
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="transition hover:text-[var(--nav-accent)]"
                                    >
                                        {item.label}
                                    </Link>
                                )
                            )}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                                className="rounded-full border border-[var(--nav-border)] p-2 text-[var(--nav-text)] transition hover:text-[var(--nav-accent)]"
                            >
                                {isDark ? (
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <circle cx="12" cy="12" r="4" />
                                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                                    </svg>
                                ) : (
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                                    </svg>
                                )}
                            </button>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3 md:hidden">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="rounded-full border border-[var(--nav-border)] p-2 text-[var(--nav-text)]"
                    >
                        {isDark ? (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                            </svg>
                        ) : (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                            </svg>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label="Toggle menu"
                        className="rounded-full border border-[var(--nav-border)] p-2 text-[var(--nav-text)]"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M3 6h18M3 12h18M3 18h18" />
                        </svg>
                    </button>
                </div>
            </nav>

            {menuOpen && (
                <div className="border-t border-[var(--nav-border)] bg-[var(--nav-bg)] px-6 py-4 md:hidden">
                    <div className="flex flex-col gap-3 text-sm font-semibold text-[var(--nav-text)]">
                        {userEmail ? (
                            <>
                                <div className="rounded-xl border border-[var(--nav-border)] px-3 py-2 text-xs font-semibold text-[var(--nav-text)]">
                                    {userEmail}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        toggleTheme();
                                    }}
                                    className="rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-[var(--nav-border)] hover:text-[var(--nav-accent)]"
                                >
                                    Toggle theme
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-[var(--nav-border)] hover:text-[var(--nav-accent)]"
                                >
                                    Log out
                                </button>
                            </>
                        ) : (
                            navItems.map((item) =>
                                item.href === "/light" ? (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={(event) => handleLightControlClick(event, true)}
                                        className="rounded-xl border border-transparent px-3 py-2 transition hover:border-[var(--nav-border)] hover:text-[var(--nav-accent)]"
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        className="rounded-xl border border-transparent px-3 py-2 transition hover:border-[var(--nav-border)] hover:text-[var(--nav-accent)]"
                                    >
                                        {item.label}
                                    </Link>
                                )
                            )
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
