import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      id: a.id(),
      username: a.string(),
      icon: a.string(), // S3 key for user-uploaded images in bucket
      bio: a.string(),
      onlineStatus: a.enum(['ONLINE', 'OFFLINE', 'AWAY']),
      servers: a.hasMany('ServerMember', 'userId'),
      ownedServers: a.hasMany('Server', 'ownerId'),
      messages: a.hasMany('Message', 'userId'),
      media: a.hasMany('Media', 'userId'),
      sentFriendships: a.hasMany('Friendship', 'userId'),
      receivedFriendships: a.hasMany('Friendship', 'friendId'),
      conversationsAsSender: a.hasMany('Conversation', 'senderId'),
      conversationsAsReceiver: a.hasMany('Conversation', 'receiverId'),
      sentDirectMessages: a.hasMany('DirectMessage', 'senderId'), 
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('id'),
      allow.authenticated().to(['read']), // Allow authenticated users to read user profiles
    ]),

    Friendship: a
    .model({
      id: a.id().required(),
      userId: a.id().required(), // Sender
      user: a.belongsTo('User', 'userId'),
      senderUsername: a.string(),
      friendId: a.id().required(), // Receiver
      friend: a.belongsTo('User', 'friendId'),
      status: a.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId'),
      allow.ownerDefinedIn('friendId'),
    ]),

  Conversation: a
    .model({
      id: a.id().required(),
      senderId: a.id().required(),
      sender: a.belongsTo('User', 'senderId'),
      receiverId: a.id().required(),
      receiver: a.belongsTo('User', 'receiverId'),
      directMessages: a.hasMany('DirectMessage', 'conversationId'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('senderId'),
      allow.ownerDefinedIn('receiverId'),
    ]),

  DirectMessage: a
    .model({
      id: a.id().required(),
      senderId: a.id().required(),
      sender: a.belongsTo('User', 'senderId'),
      conversationId: a.id().required(),
      conversation: a.belongsTo('Conversation', 'conversationId'),
      content: a.string().required(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('senderId'),
    ]),

  Server: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      icon: a.string(),
      ownerId: a.id().required(),
      owner: a.belongsTo('User', 'ownerId'),
      members: a.hasMany('ServerMember', 'serverId'),
      channels: a.hasMany('Channel', 'serverId'),
    })
    .authorization((allow) => [
      allow.authenticated(),
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
      allow.authenticated(),
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
      allow.owner(),
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
      allow.authenticated(),
    ]),

  Media: a
    .model({
      id: a.id().required(),
      content: a.string().required(), // S3 key for user-uploaded files/videos
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
