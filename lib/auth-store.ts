'use client';

interface StoreData {
  user?: any;
  settings?: any;
  currentApp?: any;
  accessToken?: any;
  workContext?: any;
  recentlyUsedApps?: any[];
  validApps?: any;
}

class AuthStore {
  private key = 'ai.platform';

  get(): StoreData {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  set(data: Partial<StoreData>) {
    if (typeof window === 'undefined') return;
    try {
      const current = this.get();
      const updated = { ...current, ...data };
      localStorage.setItem(this.key, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  login(user: any, accessToken: any) {
    this.set({ user, accessToken });
  }

  logout() {
    this.set({ accessToken: null });
  }

  setWorkContext(workContextData: any) {
    const current = this.get();
    const workContext = { ...(current.workContext || {}), ...workContextData };

    // Refresh recently used apps
    var validRecentApps: Array<any> = [];
    var validApps: any = {};
    (workContextData.apps || []).forEach((app: any) => {
      (app.instances || []).forEach((instance: any) => {
        if(!validApps[instance.appInstanceId]) {
          validApps[instance.appInstanceId] = instance;
        }
      });
    });
    (current.recentlyUsedApps || []).forEach((app: any) => {
      if(validApps[app.appInstanceId]) {
        validRecentApps.push(validApps[app.appInstanceId]);
      }
    });

    this.set({
      workContext,
      recentlyUsedApps: validRecentApps,
      validApps
    });
  }

  setUser(user: any) {
    this.set({ user });
  }

  saveSettings(settings: any) {
    const current = this.get();
    const updatedSettings = { ...(current.settings || {}), ...settings };
    this.set({ settings: updatedSettings });
  }

  setCurrentApp(app: any) {
    const current = this.get();
    const recentApps = current.recentlyUsedApps || [];

    let updatedRecentApps = recentApps;
    if (app && app.appInstanceId) {
      // Check if app already exists
      const existingIndex = recentApps.findIndex((item: any) => item.appInstanceId === app.appInstanceId);

      // Remove existing if found
      const filteredApps = existingIndex >= 0
        ? recentApps.filter((_: any, index: number) => index !== existingIndex)
        : recentApps;

      // Add to beginning and limit to 4
      updatedRecentApps = [app, ...filteredApps].slice(0, 4);
    }

    this.set({
      currentApp: app,
      recentlyUsedApps: updatedRecentApps
    });
  }

  getSettings(params: Array<string>) {
    const current = this.get();
    const settings = current.settings || {};
    let result: any = {};
    params.forEach(key => {
      if (settings.hasOwnProperty(key)) {
        result[key] = settings[key];
      }
    });
    return result;
  }
}

const authStore = new AuthStore();

export function useAuthStore() {
  return authStore;
}
