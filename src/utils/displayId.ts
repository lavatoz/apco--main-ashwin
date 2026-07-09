export const getDisplayId = (displayId?: string | null, uuid?: string | null): string => {
  if (displayId !== null && displayId !== undefined && displayId !== '') {
    return displayId;
  }
  return uuid ?? '';
};
