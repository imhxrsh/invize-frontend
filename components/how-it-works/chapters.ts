/** Ordered chapters for “How it works” tour (paths and labels). */
export const HOW_IT_WORKS_HUB = "/dashboard/how-it-works";

export const HOW_IT_WORKS_CHAPTERS = [
	{
		slug: "invoice-journey",
		path: "/dashboard/how-it-works/invoice-journey",
		title: "From paper to numbers",
		shortLabel: "Chapter 1",
	},
	{
		slug: "smart-checks",
		path: "/dashboard/how-it-works/smart-checks",
		title: "Is this invoice okay?",
		shortLabel: "Chapter 2",
	},
	{
		slug: "people-step",
		path: "/dashboard/how-it-works/people-step",
		title: "When a human decides",
		shortLabel: "Chapter 3",
	},
] as const;

export type HowItWorksChapterSlug =
	(typeof HOW_IT_WORKS_CHAPTERS)[number]["slug"];
