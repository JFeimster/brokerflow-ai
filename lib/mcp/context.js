export function requireWorkspace(context, organizationId, write = false) {
  const workspace = context.workspaces.find(
    (item) => item.id === organizationId,
  );
  if (!workspace || !workspace.canRead || (write && !workspace.canWrite)) {
    throw Object.assign(new Error("Workspace access denied."), {
      status: 403,
      code: "workspace_access_denied",
    });
  }
  return workspace;
}
