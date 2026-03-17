import { OutlinerWireframe } from "@/components/OutlinerWireframe";

export default function Home() {
  return (
    <main className="page-shell">
      <section className="outline-container">
        <h1 className="outline-title">Outliner</h1>
        <p className="outline-subtitle">Workflowy-style MVP wireframe</p>
        <OutlinerWireframe />
      </section>
    </main>
  );
}
