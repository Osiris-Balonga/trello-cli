import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import type { AuthConfig, TrelloConfig } from './types.js';
import {
  TrelloAPIError,
  TrelloAuthError,
  TrelloRateLimitError,
} from '../utils/errors.js';
import { apiLimiter } from '../utils/rate-limiter.js';
import { BoardsResource } from './resources/boards.js';
import { CardsResource } from './resources/cards.js';
import { ListsResource } from './resources/lists.js';
import { LabelsResource } from './resources/labels.js';
import { MembersResource } from './resources/members.js';

export class TrelloClient {
  private api: AxiosInstance;
  private auth: AuthConfig;

  constructor(config: TrelloConfig) {
    this.auth = config.auth;

    this.api = axios.create({
      baseURL: config.baseURL || 'https://api.trello.com/1',
      timeout: config.timeout || 10000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        await apiLimiter(() => Promise.resolve());

        if (this.auth.type === 'apikey') {
          config.params = {
            ...config.params,
            key: this.auth.apiKey,
            token: this.auth.token,
          };
        } else if (this.auth.type === 'oauth') {
          config.headers.Authorization = `Bearer ${this.auth.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string }>) => {
        if (error.response?.status === 401) {
          throw new TrelloAuthError();
        }
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          throw new TrelloRateLimitError(
            retryAfter ? parseInt(String(retryAfter), 10) : undefined
          );
        }
        throw new TrelloAPIError(error);
      }
    );
  }

  private _boards?: BoardsResource;
  private _cards?: CardsResource;
  private _lists?: ListsResource;
  private _labels?: LabelsResource;
  private _members?: MembersResource;

  get boards(): BoardsResource {
    return (this._boards ??= new BoardsResource(this.api));
  }

  get cards(): CardsResource {
    return (this._cards ??= new CardsResource(this.api));
  }

  get lists(): ListsResource {
    return (this._lists ??= new ListsResource(this.api));
  }

  get labels(): LabelsResource {
    return (this._labels ??= new LabelsResource(this.api));
  }

  get members(): MembersResource {
    return (this._members ??= new MembersResource(this.api));
  }
}
