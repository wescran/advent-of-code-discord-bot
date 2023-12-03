export const LEADERBOARD_COMMAND = {
  name: 'lb',
  description: 'Display private leaderboard',
};
export const STATS_COMMAND = {
  name: 'stats',
  description: 'Display private leaderboard',
  options: [
    {
      "name": "user_id",
      "description": "advent of code user id",
      "type": 3,
      "required": true
    }
  ]
};
export const USERS_COMMAND = {
  name: 'users',
  description: 'List user ids'
};
export const INVITE_COMMAND = {
  name: 'invite',
  description: 'Get invite link to add bot to your server',
};
