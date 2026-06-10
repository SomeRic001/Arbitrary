import Footer from "@/src/components/ui/footer";
import Header from "@/src/components/ui/header";
import { db } from "@/src/db";
import { recordsTable } from "@/src/db/schema";
import RecordsCatalog from "./RecordsCatalog";
import { mapRecordToSong } from "./vinylSvg";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Records | Arbitrary",
};

export default async function RecordsPage() {
  const rows = await db.select().from(recordsTable);
  const songs = rows.map(mapRecordToSong);

  return (
    <div className="bg-white text-black min-h-screen selection:bg-[#FACC15] selection:text-black">
      <Header />
      <main className="pt-32 pb-20 overflow-hidden">
        <RecordsCatalog songs={songs} />
      </main>
      <Footer />
    </div>
  );
}
