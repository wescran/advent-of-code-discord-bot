/**
 * This script sends a message with the link for the next day
 * of Advent of Code using Discord Components v2
 */

// Component type constants
const ComponentType = {
  ACTION_ROW: 1,
  BUTTON: 2,
  SECTION: 9,
  TEXT_DISPLAY: 10,
  SEPARATOR: 14,
  CONTAINER: 17,
};

// Button styles
const ButtonStyle = {
  PRIMARY: 1,
  LINK: 5,
};

export async function sendMessage(controller, env) {
  const token = env.DISCORD_TOKEN;
  const channel = env.DISCORD_CHANNEL_ID;
  const url = `https://discord.com/api/v10/channels/${channel}/messages`;
  const scheduledDate = new Date(controller.scheduledTime);
  const day = scheduledDate.getDate();
  const year = scheduledDate.getFullYear();
  const adventUrl = `https://adventofcode.com/${year}/day/${day}`;
  
  // IS_COMPONENTS_V2 flag = 1 << 15 = 32768
  const IS_COMPONENTS_V2 = 32768;
  
  const message = {
    flags: IS_COMPONENTS_V2,
    components: [
      {
        type: ComponentType.CONTAINER,
        accent_color: 0x2ECC71, // Festive green
        components: [
          {
            type: ComponentType.TEXT_DISPLAY,
            content: "# :santa: Attention, elves!"
          },
          {
            type: ComponentType.SEPARATOR,
            divider: true,
            spacing: 1
          },
          {
            type: ComponentType.TEXT_DISPLAY,
            content: `**Day ${day}** of the Advent of Code is out!\n\nHappy solving! :christmas_tree:`
          },
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.BUTTON,
                style: ButtonStyle.LINK,
                label: `Solve Day ${day}`,
                url: adventUrl
              }
            ]
          }
        ]
      }
    ]
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
