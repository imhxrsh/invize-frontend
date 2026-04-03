import Link from "next/link";
import { CheckCircle, CreditCard, ListChecks, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StepStrip } from "@/components/how-it-works/StepStrip";

const steps = [
	{
		title: "Robots prepare, people decide",
		body: "Software can read and check, but your team still chooses what is safe to pay.",
		icon: ListChecks,
	},
	{
		title: "Green light or red light",
		body: "Approve when it looks right, or reject and send it back—one clear button each way.",
		icon: CheckCircle,
	},
	{
		title: "Oops needs a human touch",
		body: "If something is fuzzy, the invoice waits in a queue until someone fixes or explains it.",
		icon: XCircle,
	},
	{
		title: "Then money can move",
		body: "Payments and batches tie back to what was approved, so finance stays in sync.",
		icon: CreditCard,
	},
];

export default function PeopleStepPage() {
	return (
		<div className="space-y-8">
			<header className="space-y-2">
				<p className="text-sm font-medium text-primary">Chapter 3</p>
				<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
					When a human decides
				</h1>
				<p className="text-muted-foreground">
					The last mile is trust: a person says “pay this” or “hold on.”
				</p>
			</header>

			<StepStrip steps={steps} />

			<div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 sm:flex-row sm:flex-wrap sm:items-center">
				<Button asChild>
					<Link href="/dashboard/invoices">Open invoices</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/dashboard/payments">Payments hub</Link>
				</Button>
			</div>
			<p className="text-center text-xs text-muted-foreground">
				Open any invoice to use Approve or Reject on the detail page.
			</p>
		</div>
	);
}
