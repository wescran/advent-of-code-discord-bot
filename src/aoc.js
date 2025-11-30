/**
 * Reach out to the Advent of Code API
 * and get the private leaderboard stats.
 * Returns Discord Components v2 structures for rich message formatting.
 */

/**
 * Used http error class definition from
 * https://www.npmjs.com/package/node-fetch
 */
class HTTPResponseError extends Error {
  constructor(response) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`);
    this.response = response;
  }
}

const checkStatus = response => {
  if (response.ok) {
    return response;
  } else {
    throw new HTTPResponseError(response);
  }
}

async function fetchStats(env) {
  const year = env.ADVENT_YEAR;
  const owner_id = env.ADVENT_OWNER_ID;
  const session = env.ADVENT_SESSION;
  const CACHE = env.CACHE;
  const url = `https://adventofcode.com/${year}/leaderboard/private/view/${owner_id}.json`;
  const secondsFromNow = 15 * 60;

  let value = await CACHE.get(url, { type: "json"});
  if (value != null) {
    console.log(`cached value found for ${url}`);
  } else {
    console.log(`no cached value found for ${url}`);
    const response = await fetch(url, {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'Cookie': `session=${session}`,
      },
    });
    try {
      checkStatus(response);
    } catch (error) {
      console.error(error);
      const errorBody = await error.response.text();
      console.error(`Error body: ${errorBody}`);
    }
    value = await response.json();
    await CACHE.put(url, JSON.stringify(value), {expirationTtl: secondsFromNow});
    console.log(`put cached value for ${url}, expires in ${secondsFromNow} seconds`)
  }
  return await value;
}

// Component type constants for Discord Components v2
const ComponentType = {
  ACTION_ROW: 1,
  BUTTON: 2,
  SECTION: 9,
  TEXT_DISPLAY: 10,
  THUMBNAIL: 11,
  MEDIA_GALLERY: 12,
  SEPARATOR: 14,
  CONTAINER: 17,
};

// Helper to create a Text Display component
function textDisplay(content) {
  return { type: ComponentType.TEXT_DISPLAY, content };
}

// Helper to create a Separator component
function separator(divider = true, spacing = 1) {
  return { type: ComponentType.SEPARATOR, divider, spacing };
}

// Helper to create a Container component
function container(components, accentColor = null) {
  const c = { type: ComponentType.CONTAINER, components };
  if (accentColor !== null) {
    c.accent_color = accentColor;
  }
  return c;
}

/**
 * Build leaderboard as Discord Components v2
 * @returns {Array} Array of component objects
 */
export async function getLeaderboard(env) {
  const jsonData = await fetchStats(env);
  const sortedMembers = Object.entries(jsonData["members"])
    .sort(([,a],[,b]) => b["local_score"] - a["local_score"]);

  // Calculate column widths dynamically
  const placeWidth = String(sortedMembers.length).length;
  const starsWidth = 5; // "Stars" header or max 2 digits
  const scoreWidth = Math.max(5, ...sortedMembers.map(([,u]) => String(u["local_score"]).length));
  const nameWidth = Math.max(4, ...sortedMembers.map(([,u]) => u["name"].length));

  // Build header
  const header = [
    "#".padStart(placeWidth),
    "User".padEnd(nameWidth),
    "Stars".padStart(starsWidth),
    "Score".padStart(scoreWidth)
  ].join("  ");

  const divider = "-".repeat(header.length);

  // Build rows
  const rows = sortedMembers.map(([, user], index) => {
    return [
      String(index + 1).padStart(placeWidth),
      user["name"].padEnd(nameWidth),
      String(user["stars"]).padStart(starsWidth),
      String(user["local_score"]).padStart(scoreWidth)
    ].join("  ");
  });

  const tableContent = "```\n" + [header, divider, ...rows].join("\n") + "\n```";

  return [
    container([
      textDisplay("# :santa: Advent of Code Leaderboard"),
      separator(true, 1),
      textDisplay(tableContent),
    ], 0xE74C3C)
  ];
}
/**
 * Build user stats as Discord Components v2
 * @returns {Array} Array of component objects
 */
export async function getStats(env, userId) {
  const jsonData = await fetchStats(env);
  
  if (!jsonData["members"].hasOwnProperty(userId)) {
    const errorString = `${userId} does not exist, use /users command to list users and their IDs`;
    console.log(errorString);
    return [
      container([
        textDisplay(`# :warning: Error\n${errorString}`),
      ], 0xE74C3C)
    ];
  }
  
  const userData = jsonData["members"][userId];
  const completed = userData["completion_day_level"];
  const userName = userData["name"];
  
  if (Object.keys(completed).length === 0) {
    const errorString = `No days completed for user **${userName}**`;
    console.log(errorString);
    return [
      container([
        textDisplay(`# :santa: Stats for ${userName}`),
        separator(true, 1),
        textDisplay(errorString),
      ], 0xF39C12) // Orange/yellow for warning
    ];
  }
  
  const sortedCompKeys = Object.keys(completed).sort((a, b) => b - a);
  
  // Find max day width for alignment (e.g., "25" is 2 chars)
  const maxDayWidth = Math.max(...sortedCompKeys.map(d => d.length));
  
  // Build day completion list using text stars for monospace alignment
  const rows = sortedCompKeys.map(day => {
    const dayComp = completed[day];
    const paddedDay = day.padStart(maxDayWidth, " ");
    const star1 = dayComp.hasOwnProperty("1") ? "★" : "☆";
    const star2 = dayComp.hasOwnProperty("2") ? "★" : "☆";
    return `Day ${paddedDay}: ${star1} ${star2}`;
  });

  const statsContent = "```\n" + rows.join("\n") + "\n```";

  return [
    container([
      textDisplay(`# :santa: Completion Stats for ${userName}`),
      separator(true, 1),
      textDisplay(statsContent),
    ], 0x2ECC71) // Green accent color
  ];
}
/**
 * Build users list as Discord Components v2
 * @returns {Array} Array of component objects
 */
export async function getUsers(env) {
  const jsonData = await fetchStats(env);
  const members = jsonData["members"];
  
  // Calculate column widths
  const memberList = Object.entries(members);
  const nameWidth = Math.max(4, ...memberList.map(([, m]) => m.name.length));
  const idWidth = Math.max(2, ...memberList.map(([id]) => id.length));

  // Build header
  const header = [
    "User".padEnd(nameWidth),
    "ID".padStart(idWidth)
  ].join("  ");

  const divider = "-".repeat(header.length);

  // Build rows
  const rows = memberList.map(([id, member]) => {
    return [
      member.name.padEnd(nameWidth),
      id.padStart(idWidth)
    ].join("  ");
  });

  const tableContent = "```\n" + [header, divider, ...rows].join("\n") + "\n```";

  return [
    container([
      textDisplay("# :santa: Leaderboard Members"),
      separator(true, 1),
      textDisplay(tableContent),
      separator(true, 1),
      textDisplay("-# Use the ID with `/stats <id>` to view individual progress"),
    ], 0x3498DB)
  ];
}
