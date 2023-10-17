export function getViteEnvironmentVariable(viteName: string) {
    try {
        //@ts-ignore
        return import.meta.env[viteName] || undefined;
    } catch (error) {
        return undefined;
    }
  }
