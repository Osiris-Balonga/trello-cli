import axios from 'axios';
import type {
  GitHubDeviceCodeResponse,
  GitHubAccessTokenResponse,
  GitHubDeviceFlowError,
} from '../../providers/github/types.js';

const GITHUB_DEVICE_CODE_URL = 'https://github.com/login/device/code';
const GITHUB_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export const GITHUB_CLIENT_ID = 'Ov23liCMn10qPKO4pYaE';

export const GITHUB_TOKEN_REGEX = /^(ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})$/;

export function validateGitHubToken(token: string): boolean {
  const trimmed = token.trim();
  if (GITHUB_TOKEN_REGEX.test(trimmed)) {
    return true;
  }
  return trimmed.length >= 40 && /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

export async function requestDeviceCode(
  clientId: string = GITHUB_CLIENT_ID
): Promise<GitHubDeviceCodeResponse> {
  const response = await axios.post<GitHubDeviceCodeResponse>(
    GITHUB_DEVICE_CODE_URL,
    {
      client_id: clientId,
      scope: 'repo',
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

export async function pollForAccessToken(
  clientId: string,
  deviceCode: string,
  interval: number,
  expiresIn: number,
  onPoll?: () => void
): Promise<string> {
  const startTime = Date.now();
  const expiresAt = startTime + expiresIn * 1000;
  let currentInterval = interval;

  while (Date.now() < expiresAt) {
    await sleep(currentInterval * 1000);

    if (onPoll) {
      onPoll();
    }

    try {
      const response = await axios.post<GitHubAccessTokenResponse | GitHubDeviceFlowError>(
        GITHUB_ACCESS_TOKEN_URL,
        {
          client_id: clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if ('access_token' in data) {
        return data.access_token;
      }

      if ('error' in data) {
        switch (data.error) {
          case 'authorization_pending':
            continue;
          case 'slow_down':
            currentInterval += 5;
            continue;
          case 'expired_token':
            throw new Error('Device code expired. Please try again.');
          case 'access_denied':
            throw new Error('Authorization was denied by the user.');
          default:
            throw new Error(`Unknown error: ${data.error_description || data.error}`);
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const data = error.response.data as GitHubDeviceFlowError;
        if (data.error === 'authorization_pending') {
          continue;
        }
        if (data.error === 'slow_down') {
          currentInterval += 5;
          continue;
        }
        throw new Error(data.error_description || data.error);
      }
      throw error;
    }
  }

  throw new Error('Device code expired. Please try again.');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
