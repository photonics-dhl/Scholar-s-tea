import { createGitHubProvider } from './github';

export { createGitHubProvider } from './github';

export type OAuthProviderType = 'github' | 'google' | 'feishu';

type AnyProvider = ReturnType<typeof createGitHubProvider>;

export function getOAuthProviders(): AnyProvider[] {
  const providers: AnyProvider[] = [];

  // GitHub OAuth - Always available
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(createGitHubProvider());
  }

  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const { default: GoogleProvider } = require('next-auth/providers/google');
    providers.push(GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }));
  }

  // Feishu (Lark) OAuth - Requires @next-auth/providers/lark package
  // For now, Feishu bot integration is separate from OAuth
  // if (process.env.FEISHU_CLIENT_ID && process.env.FEISHU_CLIENT_SECRET) {
  //   const { default: FeishuProvider } = require('next-auth/providers/Feishu');
  //   providers.push(FeishuProvider({
  //     clientId: process.env.FEISHU_CLIENT_ID,
  //     clientSecret: process.env.FEISHU_CLIENT_SECRET,
  //   }));
  // }

  return providers;
}

export function getEnabledProviderNames(): OAuthProviderType[] {
  const enabled: OAuthProviderType[] = [];

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    enabled.push('github');
  }
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    enabled.push('google');
  }
  // Feishu OAuth temporarily disabled - no built-in provider
  // if (process.env.FEISHU_CLIENT_ID && process.env.FEISHU_CLIENT_SECRET) {
  //   enabled.push('feishu');
  // }

  return enabled;
}
