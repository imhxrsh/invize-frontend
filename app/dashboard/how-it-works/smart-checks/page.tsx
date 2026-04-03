import Link from "next/link";
import { Copy, Eye, FileQuestion, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StepStrip } from "@/components/how-it-works/StepStrip";

const steps = [
	{
		title: "Have we seen this one before?",
		body: "We look for twins: same invoice showing up twice should wave a little flag.",
		icon: Copy,
	},
	{
		title: "Does the picture look honest?",
		body: "Blurry scans or odd patterns get a gentle warning—not to scare you, just to look closer.",
		icon: Eye,
	},
	{
		title: "Does it match a purchase order?",
		body: "We check whether the numbers line up with a purchase order your company already approved.",
		icon: FileQuestion,
	},
	{
		title: "Do we know this vendor?",
		body: "We see if the supplier looks like someone you already do business with in your books.",
		icon: Link2,
	},
];

export default function SmartChecksPage() {
	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<p className="text-sm font-medium text-primary">Chapter 2</p>
				<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
					Is this invoice okay?
				</h1>
				<p className="text-muted-foreground">
					These checks run quietly in the background—like crossing the street: look both ways.
				</p>
			</header>

			<StepStrip steps={steps} />

			<div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 sm:flex-row sm:flex-wrap sm:items-center">
				<Button asChild>
					<Link href="/dashboard/resolution-queue">See the resolution queue</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/dashboard/vendors">Browse vendors</Link>
				</Button>
			</div>
		</div>
	);
}
