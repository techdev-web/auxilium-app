import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from '../types/project';
import type { MapGeometry, MapImageOverlay } from '../types/mapGeometry';
import { loadProjectsLocal, saveProjectsLocal } from './projectStorage';

/**
 * Local project API.
 * Swap these bodies for authFetch(urls.projects, …) when the backend is ready.
 */

function createId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    ...input,
    id: createId(),
    createdAt: now,
    updatedAt: now,
    geometries: [],
  };

  const projects = await loadProjectsLocal();
  projects.unshift(project);
  await saveProjectsLocal(projects);
  return project;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const projects = await loadProjectsLocal();
  const index = projects.findIndex(p => p.id === id);
  if (index < 0) {
    throw new Error('Project not found');
  }

  const updated: Project = {
    ...projects[index],
    ...input,
    id,
    geometries:
      input.geometries !== undefined
        ? input.geometries
        : projects[index].geometries,
    imageOverlays:
      input.imageOverlays !== undefined
        ? input.imageOverlays
        : projects[index].imageOverlays,
    updatedAt: new Date().toISOString(),
  };
  projects[index] = updated;
  await saveProjectsLocal(projects);
  return updated;
}

export async function updateProjectGeometries(
  id: string,
  geometries: MapGeometry[],
  imageOverlays?: MapImageOverlay[],
): Promise<Project> {
  const projects = await loadProjectsLocal();
  const index = projects.findIndex(p => p.id === id);
  if (index < 0) {
    throw new Error('Project not found');
  }

  const updated: Project = {
    ...projects[index],
    geometries,
    imageOverlays: imageOverlays ?? projects[index].imageOverlays ?? [],
    updatedAt: new Date().toISOString(),
  };
  projects[index] = updated;
  await saveProjectsLocal(projects);
  return updated;
}

export async function getProjects(): Promise<Project[]> {
  return loadProjectsLocal();
}

export async function getProject(id: string): Promise<Project | null> {
  const projects = await loadProjectsLocal();
  return projects.find(p => p.id === id) ?? null;
}
