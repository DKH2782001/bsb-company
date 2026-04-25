import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "./PageHeader";

export function PagePlaceholder({
  title,
  description,
  phase,
  features,
}: {
  title: string;
  description: string;
  phase: string;
  features: string[];
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={<Badge variant="info">{phase}</Badge>}
      />
      <Card>
        <CardHeader>
          <CardTitle>Chức năng sẽ triển khai</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-zinc-700">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-xs text-zinc-500">
            Trang này là khung scaffold — UI full + CRUD + RLS sẽ được build trong phase tương ứng của
            roadmap (xem file kế hoạch).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
