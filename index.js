const {renameSync, unlinkSync, existsSync, readFileSync} = require('fs');
const jsonfile = require('jsonfile');
const { Observable, forkJoin } = require('rxjs');
const cp = require('child_process'),
exec = cp.exec;

var dotenv = require('dotenv');
var mqtt = require('mqtt');

if(existsSync('.env-local')) {
  const localEnv = dotenv.parse(readFileSync('.env-local'));
  for(var i in localEnv) {
    process.env[i] = localEnv[i];
  }
}

const absFilePath = `${__dirname}/public/input`;
const filePath = './public/input';
const staticPath = './public/js';
let timer;
const intervalMS = 10000;

const state = {
  server: null,
  sockets: [],
};

var client = null;

console.log('platform ', process.platform, absFilePath)

const sttUrl = process.env.stt_url;
const ttsUrl = process.env.tts_url;
const ttsApikey = process.env.tts_apikey;
const sttApikey = process.env.stt_apikey;

function write_audio(audio_obj){
	let full_name = audio_obj.name + '.' + audio_obj.type
	if (audio_obj && audio_obj.audio && audio_obj.name && audio_obj.type) {
		let buff = new Buffer(audio_obj.audio, 'base64');
		require('fs').writeFileSync(full_name, buff);
		console.log('audio file created... ' + full_name);		
	}
}

let techTerns = {
  stt: (audioFile) => {
    /**
     * supported file types [application/octet-stream,audio/alaw,audio/basic,audio/flac,audio/g729,audio/l16,audio/mp3,audio/mpeg,audio/mulaw,audio/ogg,audio/ogg;codecs=opus,audio/ogg;codecs=vorbis,audio/wav,audio/webm,audio/webm;codecs=opus,audio/webm;codecs=vorbis]
     */
      let contentType = audioFile.indexOf('wav') > 0 ? 'audio/wav' : 'audio/mp3';
      let arg = `curl -X POST -u "apikey:${sttApikey}" --header "Content-Type: ${contentType}" --data-binary @/${absFilePath}/${audioFile} "${sttUrl}"`
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          console.log('audio transcribed...', stdout);
          jsonfile.writeFile(`${staticPath}/audio.json`, JSON.parse(stdout), {spaces: 2});
          techTerns.renameFile(`${absFilePath}/${audioFile}`, `${absFilePath}/backup/${audioFile}`);  
          // unlinkSync(`${absFilePath}/${audioFile}`);
        } else {
          console.log(err);
        }
      });
  },
  tts: (text) => {   
    let arg = `curl -X POST -u "apikey:${ttsApikey}" --header "Content-Type: application/json" --header "Accept: audio/mp3" --data "{\"text\": ${text}}" --output ${absFilePath}/hello.mp3 "${ttsUrl}"`
    exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
      if(!err) {
        console.log('audio file created...', stdout);
      } else {
        console.log(err);
      }
    });
  },
  renameFile: (from, to) => {
    if(existsSync(from)) {
      renameSync(from, to);
    }    
  },
  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  checkAudio: async () => {
    let audioFile = `audio.wav`;
    if(!existsSync(`${filePath}/${audioFile}`)) {
      audioFile = `audio.mp3`;
    }
    if(existsSync(`${filePath}/${audioFile}`)) {
      try {
        console.log(audioFile)
        techTerns.stt(audioFile);
      } catch(e) {
        console.log(e);
        unlinkSync(imageFile);
      }
    }  
  },  
  resetTimer: () => {
    clearInterval(timer);
    timer = null;
    techTerns.setInterval(intervalMS);  
  },
  setInterval: (ms) => {
    timer = setInterval(async () => {
      techTerns.checkAudio(); 
    }, ms);
  },
  start: () => {
    count = 0;
    state.server = require('./server')().listen(3000, () => {
      console.log('Started on 3000');
    });
    state.server.on('connection', (socket) => {
      // console.log('Add socket', state.sockets.length + 1);
      state.sockets.push(socket);
    });

    techTerns.connect_mqtt();
   
  },
    connect_mqtt: () => {
	client = mqtt.connect({host: '192.168.0.22', port: 1883});
	  
	function publish(topic, msg, options){
		if (client.connected == true){
		  client.publish(topic, msg, options);
		}
	}

	client.on('connect', function() {
		 console.log('connected');
		 if (client.connected == true){
			client.on('message', function(topic, message, packet){
			//console.log(topic + message)
			if (message && topic=='/audio'){
				let audio_obj = null;
				try{
					audio_obj = JSON.parse(message);
				} catch(e) {
					alert(e);
				}
				
				if (audio_obj && audio_obj.audio && audio_obj.name && audio_obj.type){
					let arg = null;
					let full_name = audio_obj.name + '.' + audio_obj.type
					try{
						write_audio(audio_obj);
						
						let cont_type = 'audio/' + audio_obj.type
						let pwd = process.env.PWD
						let audio_binary = '@/' + pwd + '/' + full_name
						
						if (require('fs').existsSync('./' + full_name)){
							console.log('Sending to Watson...');
							
							arg = `curl -X POST -u "apikey:${sttApikey}" --header "Content-Type: ${cont_type}" --data-binary ${audio_binary} "${sttUrl}"`;
							console.log(arg);
							exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
								if(!err) {
								  console.log('Success! Audio transcribed...', stdout);
								  	publish('/stt', stdout);
								} else {
								  console.log(err);
								}
						      });
							
						}
					
					} catch(err) {
						console.error(err)
					}
				} else {
					console.log('Invalid JSON. Format: ' + JSON.stringify( {
					name: "foo",
					type: "wav",
					audio: "..."
					}));
				}

			}
			});
			
			client.on('error', function (err) {
				console.log('error', err);
			})

			client.subscribe(['detect','audio', '/audio']);
			publish('detect', 'test');
		  }
	});
  },
  
  restart: () => {
    // clean the cache
    state.sockets.forEach((socket, index) => {
      // console.log('Destroying socket', index + 1);
      if (socket.destroyed === false) {
        socket.destroy();
      }
    });
  
    state.sockets = [];
  
    state.server.close(() => {
      console.log('Server is closed');
      console.log('\n----------------- restarting -------------');      techTerns.start();
    });
  }      
}

techTerns.start();
techTerns.setInterval(intervalMS);
