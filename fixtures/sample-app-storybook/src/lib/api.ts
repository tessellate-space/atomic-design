export type Profile = { name: string };

export async function fetchProfile(): Promise<Profile> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error(`profile ${res.status}`);
  return (await res.json()) as Profile;
}
