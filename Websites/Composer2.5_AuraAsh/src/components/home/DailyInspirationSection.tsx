import { DailyInspiration } from "@/components/home/DailyInspiration";
import { getDailyInspiration } from "@/lib/inspiration";

export async function DailyInspirationSection() {
  const quote = await getDailyInspiration();

  return <DailyInspiration initialQuote={quote} />;
}
