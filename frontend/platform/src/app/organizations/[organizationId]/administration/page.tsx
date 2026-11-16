import { redirect } from "next/navigation";

/** Administration became Settings (ADR-039); old links keep working. */
export default async function AdministrationRedirect({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  redirect(`/organizations/${organizationId}/settings`);
}
