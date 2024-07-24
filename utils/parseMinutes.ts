export const parseMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainderMinutes = Math.round(minutes % 60);

  return `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ` : ''}${remainderMinutes} minutes`;
}
