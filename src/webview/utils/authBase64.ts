export const authBase64 = (user_name: string, service_key: string): string => {
  return btoa(`${user_name}:${service_key}`);
};
