"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";

/** Every page of an organization sits in the workspace frame (ADR-039). */
export default function OrganizationLayout({ children }: { children: ReactNode }) {
  const { organizationId } = useParams<{ organizationId: string }>();
  return <WorkspaceShell organizationId={organizationId}>{children}</WorkspaceShell>;
}
