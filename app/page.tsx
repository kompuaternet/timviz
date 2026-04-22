import PublicHome from "./PublicHome";
import { getPublicSearchIndex } from "../lib/public-search";

export const dynamic = "force-dynamic";

export default async function Home() {
  const searchIndex = await getPublicSearchIndex();
  return <PublicHome searchIndex={searchIndex} />;
}
