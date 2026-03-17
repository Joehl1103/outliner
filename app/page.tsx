import { OutlinerWireframe } from "@/components/OutlinerWireframe";

export default function Home() {
  return (
    <main className="page-shell">
      <h1 className="outline-title">Outliner</h1>
      <p className="outline-subtitle">Editable nodes with style comparison</p>
      <OutlinerWireframe />
    </main>
  );
}
