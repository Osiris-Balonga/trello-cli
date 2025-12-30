import keytar from 'keytar';

const SERVICE_NAME = 'trello-cli';

export const secureStore = {
  async setCredential(key: string, value: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, key, value);
  },

  async getCredential(key: string): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, key);
  },

  async deleteCredential(key: string): Promise<boolean> {
    return keytar.deletePassword(SERVICE_NAME, key);
  },

  async clearAll(): Promise<void> {
    const credentials = await keytar.findCredentials(SERVICE_NAME);
    for (const cred of credentials) {
      await keytar.deletePassword(SERVICE_NAME, cred.account);
    }
  },
};
