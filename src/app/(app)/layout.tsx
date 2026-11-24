import { Suspense } from "react";
import { TabBar, TabLinks } from "@/components/client";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="shell">
      <Suspense fallback={<TabLinks path="" />}>
        <TabBar />
      </Suspense>
      <main className="shell__main" id="main">{children}</main>
    </div>
  );
}
