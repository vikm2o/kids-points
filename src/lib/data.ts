import { Kid, RoutineItem } from "@/types";

// Kid management functions using API
export async function getAllKids(): Promise<Kid[]> {
  const response = await fetch('/api/kids');
  if (!response.ok) throw new Error('Failed to fetch kids');
  return response.json();
}

export async function updateKid(kidId: string, updates: Partial<Kid>): Promise<Kid | null> {
  const response = await fetch(`/api/kids/${kidId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) return null;
  return response.json();
}

export async function addKid(kid: Omit<Kid, 'id'>): Promise<Kid> {
  const response = await fetch('/api/kids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(kid)
  });
  if (!response.ok) throw new Error('Failed to create kid');
  return response.json();
}

export async function deleteKid(kidId: string): Promise<boolean> {
  const response = await fetch(`/api/kids/${kidId}`, { method: 'DELETE' });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success;
}

export async function getKidById(kidId: string): Promise<Kid | null> {
  const response = await fetch(`/api/kids/${kidId}`);
  if (!response.ok) return null;
  return response.json();
}

// Routine management functions using API
export async function getAllRoutines(): Promise<RoutineItem[]> {
  const response = await fetch('/api/routines');
  if (!response.ok) throw new Error('Failed to fetch routines');
  return response.json();
}

export async function getRoutinesByKidId(kidId: string): Promise<RoutineItem[]> {
  const response = await fetch(`/api/routines?kidId=${kidId}`);
  if (!response.ok) throw new Error('Failed to fetch routines');
  return response.json();
}

export async function getTodayRoutines(kidId: string): Promise<RoutineItem[]> {
  const response = await fetch(`/api/routines?kidId=${kidId}&today=true`);
  if (!response.ok) throw new Error('Failed to fetch today routines');
  const data = await response.json();
  return data.routines;
}

export async function getNextRoutineItem(kidId: string): Promise<RoutineItem | null> {
  const response = await fetch(`/api/routines?kidId=${kidId}&today=true`);
  if (!response.ok) throw new Error('Failed to fetch next routine');
  const data = await response.json();
  return data.nextItem;
}

export async function addRoutine(routine: Omit<RoutineItem, 'id'>): Promise<RoutineItem> {
  const response = await fetch('/api/routines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(routine)
  });
  if (!response.ok) throw new Error('Failed to create routine');
  return response.json();
}

export async function updateRoutine(routineId: string, updates: Partial<RoutineItem>): Promise<RoutineItem | null> {
  const response = await fetch(`/api/routines/${routineId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) return null;
  return response.json();
}

export async function deleteRoutine(routineId: string): Promise<boolean> {
  const response = await fetch(`/api/routines/${routineId}`, { method: 'DELETE' });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success;
}

export async function getRoutineById(routineId: string): Promise<RoutineItem | null> {
  const response = await fetch(`/api/routines/${routineId}`);
  if (!response.ok) return null;
  return response.json();
}

export async function toggleRoutineCompletion(routineId: string): Promise<{ routine: RoutineItem; kid: Kid } | null> {
  const response = await fetch(`/api/routines/${routineId}/toggle`, { method: 'POST' });
  if (!response.ok) return null;
  return response.json();
}