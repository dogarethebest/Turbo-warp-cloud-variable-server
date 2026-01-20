disclaimer This directory contains words that some may find disturbing.



This is the location to put filter lists. Any files in this folder that end with `.filter` will automatically be loaded by the naughty word detector. `private.filter` is explicitly ignored in the gitignore, use that for your private filters (create the file yourself).

The version of cloud-server used by forkphorus has an additional set of filters not found here.

## File Format

One regular expression per line. Each expression is case insensitive. Anything that isn't alphanumeric is removed before the regex runs.

Lines that start with # are comments and are ignored. Empty lines are ignored.

for filters that has a code in it use the extension .jsfilter 
write all Java script code by using <code> </code>
simple example






# Temporary username bans using date and time

<code>
// Map of banned usernames and when their ban expires (in YYYY-MM-DD HH:mm format)
const bannedUsers = {
    "Spammer123": "2026-01-25 15:00",
    "Troll456": "2026-01-22 12:30"
};

// Current date and time
const now = new Date();

// Helper function to parse the ban expiration string into a Date object
function parseDateTime(dateTimeStr) {
    // Convert "YYYY-MM-DD HH:mm" to "YYYY-MM-DDTHH:mm" for Date parsing
    return new Date(dateTimeStr.replace(" ", "T"));
}

// Check if the username is currently banned
for (const username in bannedUsers) {
    const expiry = parseDateTime(bannedUsers[username]);
    if (text.toLowerCase() === username.toLowerCase() && now < expiry) {
        return true; // naughty
    }
}

// If no match or ban expired, return false
return false;
</code>
