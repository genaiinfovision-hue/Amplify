import {
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
} from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID?.trim();
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID?.trim() || 'common';

export const isAzureSsoConfigured = Boolean(clientId);

export type AppUser = {
  name: string;
  initials: string;
  email: string;
};

const loginRequest = {
  scopes: ['User.Read'],
};

let msalInstance: PublicClientApplication | null = null;
let initPromise: Promise<void> | null = null;

function getRedirectUri() {
  const configured = import.meta.env.VITE_AZURE_REDIRECT_URI?.trim();
  if (configured) return configured;
  return `${window.location.origin}/login`;
}

export function getMsalInstance(): PublicClientApplication | null {
  if (!isAzureSsoConfigured || !clientId) return null;

  if (!msalInstance) {
    msalInstance = new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: getRedirectUri(),
        navigateToLoginRequestUrl: false,
      },
      cache: {
        cacheLocation: 'sessionStorage',
      },
    });
  }

  return msalInstance;
}

export async function initializeAzureAuth(): Promise<PublicClientApplication | null> {
  const instance = getMsalInstance();
  if (!instance) return null;

  if (!initPromise) {
    initPromise = instance.initialize();
  }

  await initPromise;
  return instance;
}

export function accountToUser(account: AccountInfo): AppUser {
  const email = account.username;
  const displayName =
    account.name?.trim() ||
    email
      .split('@')[0]
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || 'U';

  return { name: displayName, initials, email };
}

export function persistUserFromAccount(account: AccountInfo): AppUser {
  const user = accountToUser(account);
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

export function persistUserFromAuthResult(result: AuthenticationResult): AppUser {
  return persistUserFromAccount(result.account);
}

export async function handleAzureRedirect(): Promise<AppUser | null> {
  const instance = await initializeAzureAuth();
  if (!instance) return null;

  const result = await instance.handleRedirectPromise();
  if (result?.account) {
    return persistUserFromAuthResult(result);
  }

  const account = instance.getAllAccounts()[0];
  if (account) {
    return persistUserFromAccount(account);
  }

  return null;
}

export async function signInWithAzureSso(): Promise<void> {
  const instance = await initializeAzureAuth();
  if (!instance) {
    throw new Error(
      'Microsoft SSO is not configured. Set VITE_AZURE_CLIENT_ID in your environment.',
    );
  }

  await instance.loginRedirect(loginRequest);
}

export async function signOutFromAzureSso(): Promise<void> {
  const instance = await initializeAzureAuth();
  if (!instance) return;

  const account = instance.getAllAccounts()[0];
  if (!account) return;

  await instance.logoutRedirect({
    account,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  });
}
