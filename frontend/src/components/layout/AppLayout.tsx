import { ReactNode } from "react";
import { Header } from "#src/components/layout/Header";
import { Sidebar } from "#src/components/layout/Sidebar";
import "#src/components/layout/AppLayout.css";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Header />
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
}
