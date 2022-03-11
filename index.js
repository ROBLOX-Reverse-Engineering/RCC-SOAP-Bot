require('dotenv').config();
const exec  = require('child_process').exec;

const Discord = require('discord.js');
const https = require('http');
const fs = require('fs');
const parser = require('fast-xml-parser');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
var defport = 530;
var defip = "localhost";
var currentvote = false;
var thumbsup = 0;
var thumbsdown = 0;
var msgid;


const isRunning = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32' : cmd = `tasklist`; break;
        case 'darwin' : cmd = `ps -ax | grep ${query}`; break;
        case 'linux' : cmd = `ps -A`; break;
        default: break;
    }
    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}


bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

const options = {
	hostname: defip,
	port: defport,
	path: '',
	method: 'POST',
	headers: {
		'Accept': 'text/xml',
		'Cache-Control': 'no-cache',
		'Pragma': 'no-cache',
		'SOAPAction': 'Execute'
	}
};

 bot.on('message', msg => {
	if (msg.author.bot) {
		return;
	}
	if (msg.channel.id != process.env.CHANNEL) { return; }
	
	var message = msg.content
	
	if (!msg.content.startsWith(process.env.PREFIX))
	{
		if (msg.mentions.has(bot.user.id) && msg.content.includes(" ")) {
			message = message.substring(message.indexOf(" ") + 1)
		}
		else
		{
			return;
		};
	}
	else
	{
		message = message.substring(1);
	}
	
	var messageArray = message.includes(" ") ? message.split(' ') : [ message ];
	
	switch (messageArray[0].toLowerCase())
	{
		case "prefix":
			msg.channel.send(`The Current prefix is: \`${process.env.PREFIX}\``);
			break;
		case "help":
			const exampleEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('SOAP Commands')
				.setAuthor('RCCService.exe', 'https://i.imgur.com/52zkGiZ.png')
				.setDescription('Here are the commands for RCC SOAP Bot:\n\n;help\n;execute (<string> script) | ;x\n;viewgame | ;vg\n;viewconsole | ;vc\n;votereset')
				.setTimestamp()
				.setFooter('Coded by Yakov and Linus man himself', 'https://i.imgur.com/9cPv812.png');
			
			msg.channel.send(exampleEmbed);
			break;
		case "restart":
			if (msg.author.id == process.env.ADMIN) {
			msg.reply('Restarting...')
				.then(msg => bot.destroy())
				.then(() => bot.login(TOKEN));
			} else {
				msg.reply('UNAUTHORIZED! :no_entry:');
			}
			break;
		case "srestart":
			if (msg.author.id == process.env.ADMIN) {
			msg.reply('Server Restarting...');
			exec("taskkill /im \"RCCServiceSOAP.exe\" /t");
			exec("cd C:\\RCCSoap && start RCCServiceSOAP.bat 530");
			} else {
				msg.reply('UNAUTHORIZED! :no_entry:');
			}
			break;
		case "start":
			if (msg.author.id == process.env.ADMIN) {
				if(messageArray.length <= 1)
				{
					msg.reply('Missing Parameter `Port`');
					return;
				}
				isRunning('RCCServiceSOAP.exe', (status) => {
				if (status)
				{
					msg.reply("RCCService.exe is already open.");
					return;
				}
				exec(`cd C:\\RCCSoap && start RCCServiceSOAP.bat ${messageArray[1]}`);
				defport = messageArray[1]
				msg.reply(`Started on port ${messageArray[1]}!`)
					.then(msg => bot.destroy())
					.then(() => bot.login(TOKEN));
			});
				}
			else
			{
				msg.reply('UNAUTHORIZED! :no_entry:');
			}
			break;
		case "stop":
			if (msg.author.id == process.env.ADMIN) {
			exec(`taskkill /im "RCCServiceSOAP.exe" /t`);
			msg.reply('Server Stopped! :white_check_mark:')
				.then(msg => bot.destroy())
				.then(() => bot.login(TOKEN));
			} else {
				msg.reply('UNAUTHORIZED! :no_entry:');
			}
			break;
		case "vc":
			exec(`rccscreenshot.exe`);
			setTimeout(function(){ 
				screenshot(msg); 
			}, 500);
			break;
		case "viewconsole":
			exec(`rccscreenshot.exe`);
			setTimeout(function(){ 
				screenshot(msg); 
			}, 500);
			break;
		case "vg":
			viewgame(msg);
			break;
		case "viewgame":
			viewgame(msg);
			break;
		case "x":
			if(messageArray.length <= 1)
			{
				msg.reply('Missing Parameter `Script`');
				return;
			}
			execute(message, msg);
			break;
		case "execute":
			if(messageArray.length <= 1)
			{
				msg.reply('Missing Parameter `Script`');
				return;
			}
			execute(message, msg);
			break;
		case "helloworld":
			HelloWorld(msg)
			break;
		case "votereset":
			votereset(msg);
			break;
	}

	async function votereset(msg)
	{
		if (currentvote)
		{
			const exampleEmbed = new Discord.MessageEmbed()
			.setDescription("A vote reset has already been started!")
			.setColor('#FA7513')
			.addField("Jump to message", `[Click Here](https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msgid})`)
			.setTimestamp()				
			msg.channel.send(exampleEmbed);
			return;
			}
		else {
			currentvote = true;
		}
		const exampleEmbed = new Discord.MessageEmbed()
		.setTitle("Vote Reset has Started!")
		.setDescription("Use reactions to vote! Vote will be ending in 30 seconds.")
		.setColor('#0099ff')
		.setTimestamp()				
		msg.channel.send(exampleEmbed).then(function (message) {
			message.react("👍")
			message.react("👎")
			msgid = message.id;
			setTimeout(function(){ 
				try {
					voteconcluded(msg);
				}
				catch{}
			}, 30000);
		});
	}

	function voteconcluded(msg) {
		var result = thumbsup >= thumbsdown;
		const exampleEmbed = new Discord.MessageEmbed()
		.setTitle("The vote reset has been concluded!")
		.setDescription(result ? "The vote has won, RCC is being resetted..." : "The vote has lost!")
		.setColor(result ? '#0099ff': '#FA7513')
		.setTimestamp()				
		msg.channel.send(exampleEmbed);
		currentvote = false;
		thumbsdown = thumbsup = 0;
		msgid = "0";
		if (result)
		{
			exec("taskkill /im \"RCCServiceSOAP.exe\" /t");
			exec("cd C:\\RCCSoap && start RCCServiceSOAP.bat 530");
		}
	}
	
	function screenshot(msg){
		if (!fs.existsSync("screenshot.png")) {
			msg.reply("An Unknown Error has occurred, Is RCC Running?");
			return;
		}
		
		msg.channel.send({ files: ['./screenshot.png'] });
		
		setTimeout(function(){ 
				try {
				fs.unlinkSync("screenshot.png");
				}
				catch{}
			}, 2000);
	}
	
	async function PrintEmbedOfLuaTypes(msg, value, luatype){
		const exampleEmbed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setAuthor('RCCService.exe', 'https://i.imgur.com/52zkGiZ.png')
		.addFields(
			{ name: 'Return Data:', value: value, inline: true},
			{ name: 'Lua Type:', value: luatype, inline: true},
		)
		.setTimestamp()				
		msg.channel.send(exampleEmbed);
	}
	
	async function contentVarible(content2) {
		return `<?xml version="1.0" encoding="UTF - 8"?>
		<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ns2="http://roblox.com/RCCServiceSoap" xmlns:ns1="http://roblox.com/" xmlns:ns3="http://roblox.com/RCCServiceSoap12"><SOAP-ENV:Body>
		${content2}
		</SOAP-ENV:Body></SOAP-ENV:Envelope>`
	}

	async function ErrorOccurred(msg, e)
	{
		msg.reply("An error has occurred! :x:");
		console.error(e);
	}

	async function CreateEmbed(msg,color,title,field) {
		const exampleEmbed = new Discord.MessageEmbed()
		.setColor(color)
		.setTitle(title)
		.setAuthor('RCCService.exe', 'https://i.imgur.com/52zkGiZ.png')
		.addFields(
			{ name: 'Message', value: "```" + `${field}`+"```", inline: true },
		)
		msg.channel.send(exampleEmbed)
	}
	
	async function HelloWorld(msg){
		const adsads = https.request(options, res => {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
			  try {
			  var parsedXML = parser.parse(chunk);
			  CreateEmbed(msg, "#008000", "Hello World!", parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:HelloWorldResponse"]["ns1:HelloWorldResult"])
			  } catch(e) {console.error(e)}
			})
		})
		var HelloWorldContent = "<ns1:HelloWorld></ns1:HelloWorld>";
		console.log(await contentVarible(HelloWorldContent))
		adsads.write(await contentVarible(HelloWorldContent));
		adsads.end();

		
	}

	async function viewgame(msg){
		try {
		const request = https.request(options, res => {
			res.setEncoding('utf8');
			var body = '';
			var chunks = [];
			res.on('readable', function () {
				var chunk = this.read() || '';
		
				body += chunk;
			});
		
			res.on('end', function () {
				var parsedXML = parser.parse(body)
				let image = new Buffer.from(parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:ExecuteResponse"]["ns1:ExecuteResult"][0]["ns1:value"], "base64")
				fs.writeFile("out.png", image, 'base64', function(err) {
					console.log(err);
				});
				msg.channel.send({ files: ['./out.png'] });
			});
		})
		var content2 = `<ns1:Execute>
		<ns1:jobID>Test</ns1:jobID>
		<ns1:script>
			<ns1:name>SOAP</ns1:name>
			<ns1:script>
			return game:GetService("ThumbnailGenerator"):Click("PNG", 4000, 2000, true)</ns1:script>
			<ns1:arguments>
			</ns1:arguments>
		</ns1:script>
		</ns1:Execute>`;
		//console.log(await contentVarible(content2))
		request.write(await contentVarible(content2));
		request.end();
	}
	catch{ msg.reply("An Unknown Error has occurred, Is RCC Running?"); }
	}

	async function execute(message, msg){
		message = message.substring(message.indexOf(" ") + 1);
		if (msg.author.id == "3600780812240814059" || msg.author.id == "632025609970647051") {msg.reply("**Unauthorized!**"); return;}
		if (message.includes("HttpGet") || message.includes("HttpPost") || message.includes("fenv") || message.includes("while true do") || message.includes("SetUploadUrl") || message.includes("crash__") || message.includes("ModuleScript") || message.includes("\\77") || message.includes("\\11") || message.includes("do print(\"") || message.includes("do print()") || message.includes("math.huge do") || message.includes(":ExecuteScript")) {msg.reply("**CENSORED CODE DETECTED!** :no_entry: "); return;}
		if (message.startsWith("`") && message.endsWith("`"))
		{
			if (message.startsWith("```") && message.endsWith("```")) message = message.substring(message.startsWith("```lua") ? 6 : 3, message.length - 3); else message = message.substring(1, message.length - 1); 
		}
		//console.log(message);
		const req = https.request(options, res => { //go on?
			//console.log('STATUS: ' + res.statusCode);
			//console.log('HEADERS: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
			  //console.log('BODY: ' + chunk);
			  //console.log(chunk)
			  try {
			  var parsedXML = parser.parse(chunk)
			  } catch(e) {ErrorOccurred(msg,e);}
			  //console.log(parsedXML)
			 // console.log(parsedXML['SOAP-ENV:Fault']);
			 //var tObj = parser.getTraversalObj(chunk,xmlOptions);
			// var jsonObj = parser.convertToJson(tObj,xmlOptions);
				if (parsedXML["SOAP-ENV:Envelope"] && parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"] && parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["SOAP-ENV:Fault"] != undefined) ***REMOVED***
				{
					var errormsg = parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["SOAP-ENV:Fault"]["faultstring"];
					var noline = !errormsg.startsWith("SOAP");
					if (!noline)
					{
					var parsed = errormsg.split(":");
					var line = parsed[1];
					var message = parsed[2];
					const exampleEmbed = new Discord.MessageEmbed()
					.setColor('#F60E0E')
					.setTitle('An error has occurred!')
					.setAuthor('RCCService.exe', 'https://i.imgur.com/52zkGiZ.png')
					.addFields(
						{ name: 'Message', value: message, inline: true },
						{ name: 'Line', value: line, inline: true }
					)
					.setTimestamp()				
					msg.channel.send(exampleEmbed);	
					}
					else
					{
						try {
						const exampleEmbed = new Discord.MessageEmbed()
						.setColor('#F60E0E')
						.setTitle('An error has occurred!')
						.setAuthor('RCCService.exe', 'https://i.imgur.com/52zkGiZ.png')
						.addFields(
							{ name: 'Message', value: errormsg, inline: true },
						)
						.setTimestamp()				
						msg.channel.send(exampleEmbed);		
						} catch(e){
							msg.channel.send(`An error has occurred:\n\`\`\`${e}\`\`\``);
						}
					}
					//msg.reply(errormsg);
				}
				else if (parsedXML["SOAP-ENV:Envelope"] && parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"] && parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:ExecuteResponse"] != undefined)  //&& parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["SOAP-ENV:ExecuteResponse"]["SOAP-ENV:ExecuteResult"] != undefined) {
					if (parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:ExecuteResponse"]["ns1:ExecuteResult"]) 
					{
					var LuaType = parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:ExecuteResponse"]["ns1:ExecuteResult"]["ns1:type"]
					switch (LuaType)
					{
						case "LUA_TSTRING":
							PrintEmbedOfLuaTypes(msg,parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:ExecuteResponse"]["ns1:ExecuteResult"]["ns1:value"], LuaType)
							break;
						case "LUA_TBOOLEAN":
							PrintEmbedOfLuaTypes(msg,parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:ExecuteResponse"]["ns1:ExecuteResult"]["ns1:value"] ? "true" : "false", LuaType)
							break;
						case "LUA_TTABLE":
							//parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["SOAP-ENV:ExecuteResponse"]["SOAP-ENV:ExecuteResult"]["ns1:table"]
							console.log(parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:ExecuteResponse"]["ns1:ExecuteResult"]["ns1:table"])
							PrintEmbedOfLuaTypes(msg, `\`\`\`json\n${JSON.stringify(parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:ExecuteResponse"]["ns1:ExecuteResult"]["ns1:table"])}\`\`\``, LuaType)
							break;
						case "LUA_TNUMBER":
							PrintEmbedOfLuaTypes(msg,parsedXML["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["ns1:ExecuteResponse"]["ns1:ExecuteResult"]["ns1:value"], LuaType)
							break;
						default:
							msg.reply("Unknown Return Type!");
							break;
					}
					}
				

				else{
					msg.reply("Executed! :white_check_mark:");
				}
			  
			});
		})
		
		req.on('error', error => {
			console.error(error);
		})

		var content2 = `		<ns1:Execute>
		<ns1:jobID>Test</ns1:jobID>
		<ns1:script>
			<ns1:name>SOAP</ns1:name>
			<ns1:script>${message}</ns1:script>
			<ns1:arguments>
			</ns1:arguments>
		</ns1:script>
	</ns1:Execute>`;

		var content = await contentVarible(content2);
		
		req.write(content);
		req.end();
	}
 });
 
 bot.on('messageReactionAdd', (messageReaction, user) => {
	if(user.bot)  return;
	const { message, emoji } = messageReaction;
	if(message.id === msgid) {
		switch(emoji.name){
			case "👍":
				thumbsup++;
				break;
			case "👎":
				thumbsdown++;
				break;
		}
	} 
});

bot.on('messageReactionRemove', (messageReaction, user) => {
	if(user.bot)  return;
	const { message, emoji } = messageReaction;
	
	if(message.id === msgid) {
		switch(emoji.name){
			case "👍":
				thumbsup--;
				break;
			case "👎":
				thumbsdown--;
				break;
		}
	} 
});
