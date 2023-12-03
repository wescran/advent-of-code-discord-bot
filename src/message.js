/**
 * This script sends a message with the link for the next day
 * of Advent of Code
 */

export async function sendMessage(controller, env) {
  const token = env.DISCORD_TOKEN;
  const channel = env.DISCORD_CHANNEL_ID;
  const url = `https://discord.com/api/v10/channels/${channel}/messages`;
  const scheduledDate = new Date(controller.scheduledTime);
  const day = scheduledDate.getDate();
  const year = scheduledDate.getFullYear();
  const adventUrl = `https://adventofcode.com/${year}/day/${day}`;
  const message = {
    "content": `:santa: [ **Attention, elves!** ]\n**Day ${day}** of the Advent of Code is out!\nHappy solving!`,
    "embeds": [{
      "title": `Advent of Code: Day ${day}`,
      "description": "Click here to solve today's problem!",
      "url": adventUrl
    }]
  };
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
    },
    method: 'POST',
    body: JSON.stringify(message),
  });

  if (response.ok) {
    console.log('Sent message');
  } else {
    console.error('Error sending message');
    const text = await response.text();
    console.error(text);
  }
  return response;
}
