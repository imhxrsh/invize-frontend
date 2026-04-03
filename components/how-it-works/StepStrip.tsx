import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type TourStep = {
	title: string;
	body: string;
	icon: LucideIcon;
};

type StepStripProps = {
	steps: TourStep[];
	className?: string;
};

/**
 * Vertical “story” stepper: numbered milestones with icon, title, and one short line each.
 */
export function StepStrip({ steps, className }: StepStripProps) {
	return (
		<ol
			className={cn("relative space-y-0 border-l-2 border-primary/25 pl-8", className)}
			aria-label="Steps"
		>
			{steps.map((step, index) => {
				const Icon = step.icon;
				return (
					<li
						key={step.title}
						className="relative pb-10 last:pb-0"
					>
						<span
							className="absolute -left-[calc(1rem+1px)] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-bold text-primary shadow-sm"
							aria-hidden
						>
							{index + 1}
						</span>
						<div className="rounded-lg border bg-card p-4 shadow-sm">
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<Icon className="h-5 w-5" aria-hidden />
								</div>
								<div className="min-w-0 space-y-2">
									<h2 className="text-lg font-semibold tracking-tight text-foreground">
										{step.title}
									</h2>
									<p className="text-sm leading-relaxed text-muted-foreground">
										{step.body}
									</p>
								</div>
							</div>
						</div>
					</li>
				);
			})}
		</ol>
	);
}
