import Link from "next/link";
import {
	BookOpen,
	ShieldCheck,
	Sparkles,
	UserCheck,
} from "lucide-react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS_CHAPTERS } from "@/components/how-it-works/chapters";

const chapterMeta = [
	{
		icon: Sparkles,
		emoji: "📄",
		blurb: "How a messy file turns into neat rows you can read on screen.",
	},
	{
		icon: ShieldCheck,
		emoji: "🔍",
		blurb: "How we double-check duplicates, quality, and purchase orders.",
	},
	{
		icon: UserCheck,
		emoji: "✋",
		blurb: "Why a real person still says “yes” or “no” before money moves.",
	},
] as const;

export default function HowItWorksHubPage() {
	return (
		<div className="space-y-8">
			<header className="space-y-3 text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
					<BookOpen className="h-7 w-7" aria-hidden />
				</div>
				<h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
					How Invize works
				</h1>
				<p className="mx-auto max-w-lg text-muted-foreground">
					A tiny story in three chapters—like a picture book for grown-ups.
					Open any chapter, then use the buttons at the bottom to flip pages.
				</p>
			</header>

			<ul className="grid gap-4 md:grid-cols-1">
				{HOW_IT_WORKS_CHAPTERS.map((ch, i) => {
					const meta = chapterMeta[i]!;
					const Icon = meta.icon;
					return (
						<li key={ch.path}>
							<Card className="overflow-hidden border-primary/15 transition-shadow hover:shadow-md">
								<CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
									<span
										className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl"
										aria-hidden
									>
										{meta.emoji}
									</span>
									<div className="min-w-0 flex-1 space-y-1">
										<p className="text-xs font-medium uppercase tracking-wide text-primary">
											{ch.shortLabel}
										</p>
										<CardTitle className="flex items-center gap-2 text-xl">
											<Icon className="h-5 w-5 text-primary" aria-hidden />
											{ch.title}
										</CardTitle>
										<CardDescription className="text-base leading-relaxed">
											{meta.blurb}
										</CardDescription>
									</div>
								</CardHeader>
								<CardContent className="pt-0">
									<Button asChild className="w-full sm:w-auto">
										<Link href={ch.path}>Read this chapter</Link>
									</Button>
								</CardContent>
							</Card>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
