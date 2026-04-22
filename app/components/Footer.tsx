"use client";

import { useState } from "react";

type DocumentItem = {
    title: string;
    href: string;
    description: string;
};

const documents: DocumentItem[] = [
    {
        title: "Proposal (PDF)",
        href: "/proposal.pdf",
        description: "Project scope, objectives, and methodology.",
    },
    {
        title: "Final Report (PDF)",
        href: "/finalreport.pdf",
        description: "Complete outcomes, results, and evaluation.",
    },
];

export default function Footer() {
    const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

    return (
        <footer className="relative mt-8 overflow-hidden border-t border-[var(--footer-border)] bg-[var(--footer-bg)] px-6 py-12 text-[var(--footer-text)]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,_#ffe6b8,_#f7b35e)] opacity-60 blur-3xl" />
                <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,_#ffe9c7,_#f1b56a)] opacity-60 blur-3xl" />
            </div>

            <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--footer-muted)]">
                        IoT Lighting Project
                    </p>
                    <p className="max-w-sm text-sm text-[var(--footer-text)]">
                        IoT-Based Light Intensity Monitoring and Smart Control System with Web
                        Application.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {[
                            "ESP32",
                            "LDR/BH1750",
                            "Wi-Fi",
                            "Real-time Dashboard",
                        ].map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-[var(--footer-border)] bg-[var(--footer-chip-bg)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--footer-chip-text)]"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                    <div className="flex flex-col gap-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--footer-muted)]">
                            Documents
                        </p>
                        <div className="flex flex-col gap-3">
                            {documents.map((doc) => (
                                <button
                                    key={doc.href}
                                    type="button"
                                    onClick={() => setActiveDoc(doc)}
                                    title={
                                        doc.title.startsWith("Proposal")
                                            ? "See our proposal"
                                            : "See our final report"
                                    }
                                    className="flex flex-col items-start rounded-2xl border border-[var(--footer-border)] bg-[var(--footer-chip-bg)] px-4 py-3 text-left text-sm font-semibold text-[var(--footer-text)] shadow-[0_16px_40px_-30px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:text-[var(--footer-text)]"
                                >
                                    <span>{doc.title}</span>
                                    <span className="mt-1 text-xs font-normal text-[var(--footer-muted)]">
                                        {doc.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-[var(--footer-muted)]">
                            Upload the final report when ready.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--footer-muted)]">
                            Contact
                        </p>
                        <p className="text-sm">IETP Team</p>
                        <p className="text-sm">Department of Software Engineering</p>
                    </div>
                </div>
            </div>

            <div className="relative mx-auto mt-10 flex w-full max-w-6xl flex-col gap-2 border-t border-[var(--footer-border)] pt-6 text-xs text-[var(--footer-muted)] md:flex-row md:items-center md:justify-between">
                <span>© 2026 IoT Lighting Project. All rights reserved.</span>
                <span>Built with ESP32, MongoDB, and Next.js.</span>
            </div>

            {activeDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
                    <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/30 bg-white shadow-[0_40px_120px_-60px_rgba(0,0,0,0.8)]">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    Document Preview
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {activeDoc.title}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <a
                                    href={activeDoc.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 transition hover:text-slate-900"
                                >
                                    Open in New Tab
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setActiveDoc(null)}
                                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:text-slate-900"
                                    aria-label="Close preview"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M18 6L6 18" />
                                        <path d="M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <iframe
                            title={activeDoc.title}
                            src={activeDoc.href}
                            className="h-full w-full bg-white"
                        />
                    </div>
                </div>
            )}
        </footer>
    );
}
