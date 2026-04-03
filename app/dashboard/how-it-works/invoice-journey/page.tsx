import Link from "next/link";
import {
	FileUp,
	ScanLine,
	TableProperties,
	Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StepStrip } from "@/components/how-it-works/StepStrip";

const steps = [
	{
		title: "You drop in a file",
		body: "A photo or PDF of an invoice lands in Invize—no need to type it in by hand.",
		icon: FileUp,
	},
	{
		title: "We read every line",
		body: "The computer looks at the picture and turns it into text, like magic reading glasses.",
		icon: ScanLine,
	},
	{
		title: "We fill in the blanks",
		body: "Vendor, date, total, and line items get copied into neat boxes you can trust.",
		icon: TableProperties,
	},
	{
		title: "Sometimes a smart helper chips in",
		body: "An optional helper can add notes or flags—still the same story, just with extra hints.",
		icon: Wand2,
	},
];

export default function InvoiceJourneyPage() {
	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<p className="text-sm font-medium text-primary">Chapter 1</p>
				<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
					From paper to numbers
				</h1>
				<p className="text-muted-foreground">
					Follow one invoice from upload to structured data—step by step.
				</p>
			</header>

			<StepStrip steps={steps} />

			<div className="rounded-lg border bg-muted/40 p-4">
				<p className="text-sm font-medium text-foreground">
					Want to try it for real?
				</p>
				<p className="mt-1 text-sm text-muted-foreground">
					Upload a document or open one you already processed.
				</p>
				<Button className="mt-3" asChild>
					<Link href="/dashboard/invoices">Go to Invoices</Link>
				</Button>
			</div>
		</div>
	);
}
