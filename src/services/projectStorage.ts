import * as Keychain from 'react-native-keychain';
import type { Project } from '../types/project';

const PROJECTS_SERVICE = 'auxilium.projects';
const PROJECTS_USERNAME = 'projects_v1';

async function readRaw(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: PROJECTS_SERVICE,
  });
  if (!credentials) {
    return null;
  }
  return credentials.password;
}

async function writeRaw(json: string): Promise<void> {
  await Keychain.setGenericPassword(PROJECTS_USERNAME, json, {
    service: PROJECTS_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadProjectsLocal(): Promise<Project[]> {
  const raw = await readRaw();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveProjectsLocal(projects: Project[]): Promise<void> {
  await writeRaw(JSON.stringify(projects));
}
