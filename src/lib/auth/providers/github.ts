import GitHubProvider from 'next-auth/providers/github';

type OAuthProvider = ReturnType<typeof GitHubProvider>;

export function createGitHubProvider(): OAuthProvider {
  return GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
  });
}
