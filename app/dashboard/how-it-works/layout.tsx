"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	HOW_IT_WORKS_CHAPTERS,
	HOW_IT_WORKS_HUB,
} from "@/components/how-it-works/chapters";

function normalizePath(p: string) {
	if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
	return p;
}

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
	const pathname = normalizePath(usePathname());
	const isHub = pathname === HOW_IT_WORKS_HUB;

	const chapterIndex = HOW_IT_WORKS_CHAPTERS.findIndex(
		(c) => pathname === c.path,
	);
	const currentChapter =
		chapterIndex >= 0 ? HOW_IT_WORKS_CHAPTERS[chapterIndex] : null;

	const prev =
		chapterIndex === 0
			? { path: HOW_IT_WORKS_HUB, label: "All chapters" }
			: chapterIndex > 0
				? {
						path: HOW_IT_WORKS_CHAPTERS[chapterIndex - 1]!.path,
						label: HOW_IT_WORKS_CHAPTERS[chapterIndex - 1]!.title,
					}
				: null;

	const next =
		chapterIndex >= 0 && chapterIndex < HOW_IT_WORKS_CHAPTERS.length - 1
			? {
					path: HOW_IT_WORKS_CHAPTERS[chapterIndex + 1]!.path,
					label: HOW_IT_WORKS_CHAPTERS[chapterIndex + 1]!.title,
				}
			: null;

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href={HOW_IT_WORKS_HUB}>How it works</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					{currentChapter && (
						<>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{currentChapter.title}</BreadcrumbPage>
							</BreadcrumbItem>
						</>
					)}
				</BreadcrumbList>
			</Breadcrumb>

			<div className="rounded-2xl border border-dashed border-primary/20 bg-gradient-to-b from-primary/5 via-background to-background p-6 md:p-8">
				{children}
			</div>

			{!isHub && (prev || next) && (
				<div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
					<div>
						{prev && (
							<Button variant="outline" size="sm" asChild>
								<Link href={prev.path}>
									<ChevronLeft className="mr-1 h-4 w-4" />
									{prev.label}
								</Link>
							</Button>
						)}
					</div>
					<div>
						{next ? (
							<Button size="sm" asChild>
								<Link href={next.path}>
									Next: {next.label}
									<ChevronRight className="ml-1 h-4 w-4" />
								</Link>
							</Button>
						) : (
							<Button variant="secondary" size="sm" asChild>
								<Link href={HOW_IT_WORKS_HUB}>
									Back to all chapters
								</Link>
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
