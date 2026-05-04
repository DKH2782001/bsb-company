import { getSchedulingPageData } from "./_lib/queries";
import { SchedulingPageClient } from "./_components/scheduling-page";

export const revalidate = 0;

type Props = {
  searchParams: Promise<{ week?: string }>;
};

export default async function SchedulingPage({ searchParams }: Props) {
  const { week } = await searchParams;
  const data = await getSchedulingPageData(week);
  return <SchedulingPageClient data={data} />;
}
