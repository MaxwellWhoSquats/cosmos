import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'cosmos',
    access: (allow) => ({
      'icons/{entity_id}/*': [
        allow.authenticated.to(['read']),
        allow.entity('identity').to(['read', 'write', 'delete'])
      ],
      'serverIcons/*': [
        allow.authenticated.to(['read', 'write', 'delete']),
      ]
    })
  });