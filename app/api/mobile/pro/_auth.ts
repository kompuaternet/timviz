import { verifySessionValue } from "../../../../lib/pro-auth";

export function getMobileProfessionalId(request: Request) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) return "";

  const [type, value] = authHeader.split(" ");
  if (type?.toLowerCase() !== "bearer" || !value) return "";

  return verifySessionValue(value) || "";
}
