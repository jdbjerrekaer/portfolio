import { createContext } from "react";

export interface UserInfo {
  adminUserId?: number;
  userId?: number;
  adminEmail?: string;
  email?: string;
  sessionUserId?: number;
  sessionEmail?: string;
  intercomHash?: string;
  accountManager?: string;
  tier?: string;
  locale?: string;
  created?: number;
}

export interface UserRoleContextType {
  user: string;
  privileges: string[];
  countryPrivileges: string[];
  userInfo: UserInfo;
  loadUser: (forceLoad?: boolean) => void;
  updateUser: (newUser: string) => void;
  isOnTakeoverLoginPage: boolean;
  isTakeoverSession: boolean;
}

export const UserRoleContext = createContext<UserRoleContextType>({
  user: "",
  privileges: [],
  countryPrivileges: [],
  userInfo: {},
  loadUser: () => {},
  updateUser: () => {},
  isOnTakeoverLoginPage: false,
  isTakeoverSession: false
});
