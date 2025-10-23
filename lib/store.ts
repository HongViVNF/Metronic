'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface StoreData {
  user?: any;
  settings?: any;
  currentApp?: any;
  accessToken?: any;
  workContext?: any;
  recentlyUsedApps?: any[];
  validApps?: any;
  login: (user: any, accessToken: any) => void;
  logout: () => void;
  setWorkContext: (workContextData: any) => void;
  setUser: (user: any) => void;
  saveSettings: (settings: any) => void;
  setCurrentApp: (app: any) => void;
  getSettings: (params: Array<string>) => any;
}

const store = create<StoreData>()(
  subscribeWithSelector( //not tested
    persist(
      immer((set, get) => ({
        user: {},
        settings: {},
        accessToken: {},
        currentApp: {},
        setUser: (user: any) =>
          set((state) => {
            state.user = user;
          }),

        setWorkContext: (prop: any) =>
          set((state) => {
            state.workContext = {
              ...(state.workContext || {}),
              ...prop
            };
            //refresh recently used apps
            var validRecentApps: Array<any> = [];
            var validApps: any = {};
            (prop.apps || []).forEach((app: any, index: number) => {
              (app.instances || []).forEach((instance: any) => {
                if(!validApps[instance.appInstanceId]) {
                  validApps[instance.appInstanceId] = instance
                }
              });
            });
            (state.recentlyUsedApps || []).forEach((app: any, index: number) => {
              if(validApps[app.appInstanceId]) {
                validRecentApps.push(validApps[app.appInstanceId])
              }
            });

            state.recentlyUsedApps = validRecentApps;
            state.validApps = validApps;
          }),
        login: (user: any, accessToken: string) =>
          set((state) => {
            state.user = user;
            state.accessToken = accessToken;
          }),
        logout: () =>
          set((state) => {
            state.accessToken = null;
          }),
        saveSettings: (settings: any) =>
          set((state) => {
            state.settings = { ...(state.settings || {}), ...settings };
          }),
        getSettings: (params: Array<string>) => {
          let result: any = {};
          const settings = get().settings;
          for (const key in params) {
            if (settings.hasOwnProperty(key)) {
              const element = settings[key];
              result[key] = element;
            }
          }
          return result;
        },
        setCurrentApp: (app: any) =>
          set((state) => {
            // console.log("setCurrentApp", app)
            // var validApp = state.validApps[app.appInstanceId]
            // if (!validApp) {
            //     return
            // }
            state.currentApp = app

            if (app && app !== null && app.appInstanceId) {
              // Initialize array if it doesn't exist
              const recentApps = state.recentlyUsedApps || [];

              // Check if app already exists in the array
              const existingIndex = recentApps.findIndex((item) => item.appInstanceId === app.appInstanceId);

              // Create a new array without the existing app (if found)
              const filteredApps = existingIndex >= 0
                ? recentApps.filter((_, index) => index !== existingIndex)
                : recentApps;

              // Add the app to the beginning and limit to 4 items
              state.recentlyUsedApps = [app, ...filteredApps].slice(0, 4);
            }
          }),
      })),
      {
        name: "ai.platform", // name of the item in the storage (must be unique)
        //storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
      }
    )
  )
);

export function useStore() {
  return store.getState();
}

export function useStoreContext(selector?: (state: StoreData) => any) {
  if (!selector) {
    return store();
  }
  return store(selector);
}

// export default store;
