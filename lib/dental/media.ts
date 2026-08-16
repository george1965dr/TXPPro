export function isVideoFile(filename: string): boolean {
  return /\.(mp4|mov|avi|webm|mkv)$/i.test(filename);
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatCapturedDate(dateStr: string): string {
  if (dateStr === todayDateString()) return "Today";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
