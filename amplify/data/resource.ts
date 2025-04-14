import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      id: a.id(),
      username: a.string(),
      icon: a.string(), // S3 key for user-uploaded images in bucket
      bio: a.string(),
      servers: a.hasMany('ServerMember', 'userId'),
      ownedServers: a.hasMany('Server', 'ownerId'),
      messages: a.hasMany('Message', 'userId'),
      media: a.hasMany('Media', 'userId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('id'),
    ]),

    Server: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      icon: a.string(), // S3 key for server icon
      ownerId: a.id().required(),
      owner: a.belongsTo('User', 'ownerId'),
      members: a.hasMany('ServerMember', 'serverId'),
      channels: a.hasMany('Channel', 'serverId'),
    })
    .authorization((allow) => [
      allow.authenticated()
    ]),

  Channel: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      type: a.enum(['TEXT', 'VOICE']),
      serverId: a.id().required(),
      server: a.belongsTo('Server', 'serverId'),
      messages: a.hasMany('Message', 'channelId'),
      media: a.hasMany('Media', 'channelId'),
    })
    .authorization((allow) => [
      allow.authenticated()
    ]),

  ServerMember: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      serverId: a.id().required(),
      server: a.belongsTo('Server', 'serverId'),
    })
    .authorization((allow) => [
      allow.owner()
    ]),

  Message: a
    .model({
      id: a.id().required(),
      content: a.string().required(),
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      channelId: a.id().required(),
      channel: a.belongsTo('Channel', 'channelId'),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated()
    ]),

    Media: a
    .model({
      id: a.id().required(),
      content: a.string().required(), // S3 key for user-uploaded files/videos in bucket
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      channelId: a.id().required(),
      channel: a.belongsTo('Channel', 'channelId'),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});