import { SwapsList } from "@/components/scheduling/SwapsList";
import { getSwapRequests } from "@/lib/repositories/scheduling";

export const revalidate = 0;

export default async function SwapsPage() {
  const swaps = await getSwapRequests("all");
  return <SwapsList swaps={swaps} />;
}
