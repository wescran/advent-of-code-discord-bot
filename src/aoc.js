/**
 * Reach out to the Advent of Code API
 * and get the private leaderboard stats.
 * Parse the JSON data and create table
 * @returns string to be formatted as table in markdown
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
		// response.status >= 200 && response.status < 300
		return response;
	} else {
		throw new HTTPResponseError(response);
	}
}

async function fetchStats(env) {
  /** 
   * Example someHost is set up to take in a JSON request
   * Replace url with the host you wish to send requests to
   * @param {string} someHost the host to send the request to
   * @param {string} url the URL to send the request to
   */
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
};

function getPadding(width, word) {
  const rightPad = Math.ceil((width - word.length) / 2);
  const leftPad = width - rightPad;
  return { "leftPad": leftPad, "rightPad": rightPad };
}
/**
 * sort found here https://stackoverflow.com/questions/55319092/sort-a-javascript-object-by-key-or-value-es6
 */
export async function getLeaderboard(env) {
  const jsonData = await fetchStats(env);
  const sortedMembers = Object.entries(jsonData["members"])
    .sort(([,a],[,b]) => b["local_score"] - a["local_score"]);
  /**
   * To display a plain text table, we need total width
   * We know Place, Stars, Score will be longer by default
   * So we need longest user name
   * Table width is then the sum of these widths plus
   * padding of 1 space on each side (2)
   * multiplied by the number of headers (4)
   * plus the (5) border elements
   */
  const placeLength = 5;
  const starsLength = 5;
  const scoreLength = 5;
  const userLength = sortedMembers.reduce((a,[,b]) => Math.max(a, b["name"].length), -Infinity);
  const tableWidth = placeLength + starsLength + scoreLength + userLength + (2 * 4) + 5;
  
  let resString = `:santa: **Current Leaderboard**\n`;
  // First border row of table
  const titleBorder = "+" + "+".padStart(tableWidth - 1, "-");
  // First header row of table
  const titlePadding = getPadding(tableWidth - 1, "Advent of Code");
  const titleText = "|"
    + "Advent of Code".padStart(titlePadding.leftPad, " ")
    + "|".padStart(titlePadding.rightPad, " ");
  // Data row border is split by 4 columns
  const headerBorder = "+"
    + "+".padStart(placeLength + 2 + 1 , "-")
    + "+".padStart(starsLength + 2 + 1, "-")
    + "+".padStart(scoreLength + 2 + 1, "-")
    + "+".padStart(userLength + 2 + 1, "-");
  // get padding for headers
  const placePadding = getPadding(placeLength + 2 + 1, "Place");
  const starsPadding = getPadding(starsLength + 2 + 1, "Stars");
  const scorePadding = getPadding(scoreLength + 2 + 1, "Score");
  const userPadding = getPadding(userLength + 2 + 1, "User");
  const headerText = "|"
    + "Place".padStart(placePadding.leftPad, " ")
    + "|".padStart(placePadding.rightPad, " ")
    + "Stars".padStart(starsPadding.leftPad, " ")
    + "|".padStart(starsPadding.rightPad, " ")
    + "Score".padStart(scorePadding.leftPad, " ")
    + "|".padStart(scorePadding.rightPad, " ")
    + "User".padStart(userPadding.leftPad, " ")
    + "|".padStart(userPadding.rightPad, " ");
  // concat main table string
  let tableString = "```" + "\n"
    + titleBorder + "\n"
    + titleText + "\n"
    + headerBorder + "\n"
    + headerText + "\n"
    + headerBorder + "\n";
  // Now we loop over sorted object to concat table
  let place = 1;
  sortedMembers.forEach(([,user]) => {
    const placeWord = `${place}`;
    const starsWord = `${user["stars"]}`;
    const scoreWord = `${user["local_score"]}`;
    const userWord = user["name"];
    const placeWordPadding = getPadding(placeLength + 2 + 1, placeWord);
    const starsWordPadding = getPadding(starsLength + 2 + 1, starsWord);
    const scoreWordPadding = getPadding(scoreLength + 2 + 1, scoreWord);
    const userWordPadding = getPadding(userLength + 2 + 1, userWord);
    tableString += "|"
      + placeWord.padStart(placeWordPadding.leftPad, " ")
      + "|".padStart(placeWordPadding.rightPad, " ")
      + starsWord.padStart(starsWordPadding.leftPad, " ")
      + "|".padStart(starsWordPadding.rightPad, " ")
      + scoreWord.padStart(scoreWordPadding.leftPad, " ")
      + "|".padStart(scoreWordPadding.rightPad, " ")
      + userWord.padStart(userWordPadding.leftPad, " ")
      + "|".padStart(userWordPadding.rightPad, " ")
      + "\n"
      + headerBorder
      + "\n";
    place += 1;
  });
  tableString += "```";
  return resString + tableString;
}
export async function getStats(env, userId) {
  const jsonData = await fetchStats(env);
  if (! jsonData["members"].hasOwnProperty(userId)) {
    const errorString = `${userId} does not exist, use /users command to list users and their IDs`;
    console.log(errorString);
    return errorString;
  }
  const userData = jsonData["members"][userId];
  const completed = userData["completion_day_level"];
  const userName = userData["name"]
  if ( Object.keys(completed).length === 0 ) {
    const errorString = `No days completed for user **${userName}**`;
    console.log(errorString);
    return errorString;
  }
  const sortedCompKeys = Object.keys(completed).sort((a,b) => b - a);
  let resString = `:santa: **Completition level for user: ${userName}**\n`;
  for (let index in sortedCompKeys) {
    let day = sortedCompKeys[index];
    resString += `\t**Day ${day}:**`;
    const dayComp = completed[day];
    if (dayComp.hasOwnProperty("1")) {
      resString += " :star:";
    }
    if (dayComp.hasOwnProperty("2")) {
      resString += " :star:";
    }
    resString += "\n";
  }
  return resString;
}
export async function getUsers(env) {
  const jsonData = await fetchStats(env);
  const members = jsonData["members"];
  let str = ":santa: **Members list for the current leaderboard**:\n";
  for (let id in members) {
    let name = members[id].name;
    str += `\t:technologist: **${name}**\n\t:identification_card: **${id}**\n\n`;
  }
  return str;
}
