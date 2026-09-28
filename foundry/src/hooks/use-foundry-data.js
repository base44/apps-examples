import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Pages read and write through the browser SDK as the signed-in user; entity
// rules keep every record to its creator. The copilot writes the same records
// from the server, and realtime brings those writes back here.

export const projectsKey = ["projects"];
export const featuresKey = (projectId) => ["features", projectId];

export function useProjects() {
  return useQuery({ queryKey: projectsKey, queryFn: () => base44.entities.Project.list("-created_date", 50) });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsKey }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project) => {
      const [features, threads] = await Promise.all([
        base44.entities.Feature.filter({ project_id: project.id }, "-created_date", 500),
        base44.entities.Thread.filter({ project_id: project.id }, "-created_date", 50),
      ]);
      await Promise.all([
        ...features.map((f) => base44.entities.Feature.delete(f.id)),
        ...threads.map((t) => base44.entities.Thread.delete(t.id)),
      ]);
      await base44.entities.Project.delete(project.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsKey }),
  });
}

export function useFeatures(projectId) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: featuresKey(projectId),
    queryFn: () => base44.entities.Feature.filter({ project_id: projectId }, "-created_date", 200),
    enabled: !!projectId,
  });

  // Tool writes land here the moment the server makes them: no polling, no
  // refetch after every chunk.
  useEffect(() => {
    if (!projectId) return undefined;
    return base44.entities.Feature.subscribe((event) => {
      const record = event.data;
      if (record && record.project_id !== projectId && event.type !== "delete") return;
      queryClient.setQueryData(featuresKey(projectId), (prev = []) => {
        if (event.type === "delete") return prev.filter((f) => f.id !== event.id);
        const exists = prev.some((f) => f.id === event.id);
        const next = { ...(prev.find((f) => f.id === event.id) ?? {}), ...record, id: event.id };
        return exists ? prev.map((f) => (f.id === event.id ? next : f)) : [next, ...prev];
      });
    });
  }, [projectId, queryClient]);

  return query;
}

export function useUpdateFeature(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }) => base44.entities.Feature.update(id, patch),
    onMutate: async ({ id, ...patch }) => {
      await queryClient.cancelQueries({ queryKey: featuresKey(projectId) });
      queryClient.setQueryData(featuresKey(projectId), (prev = []) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    },
    onError: () => queryClient.invalidateQueries({ queryKey: featuresKey(projectId) }),
  });
}
