# RCC Soap Bot

This was rushed and should not be used for production.

⚠️**Warning:** This code contains hardcoded banlist, ports, xml, paths, and executable names.
ℹ️ **Note:** this was made in 2 hours...

## Features:

 - Execute Roblox Lua (;execute)
	 - Supports returning data of the following types:
		 - LUA_TSTRING
		 - LUA_TNUMBER
		 - LUA_TBOOLEAN
		 - LUA_TTABLE
 - View Console (;viewconsole)
 - Vote Reset (;votereset)
## Requirements:

 - NodeJS Installation
 - RCCService 2016 (March build was tested)

## Installation:

Roblox Compute Cloud should be located at `C:\RCCSoap\RCCServiceSOAP.exe`
Create a **.env** file in the directory of the repository:
```
TOKEN=BOT_TOKEN
PREFIX=;
ADMIN=USER_ID_OF_ADMINISTRATOR
CHANNEL=CHANNEL_ID
```

Open cmd or powershell in the repo directory:
- **(First Time)** Run `npm i`
-  Run `node index.js` to start the bot

Use `;start 530` to start an RCC Instance
