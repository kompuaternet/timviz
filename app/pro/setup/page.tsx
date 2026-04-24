import { getServiceTemplateCatalog } from "../../../lib/global-service-catalog";
import ProSetupFlow from "./ProSetupFlow";

export default async function ProSetupPage() {
  return <ProSetupFlow catalog={await getServiceTemplateCatalog()} />;
}
