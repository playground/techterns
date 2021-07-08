const fs = require('fs');
const jsonfile = require('jsonfile');
const { Observable, forkJoin } = require('rxjs');
const cp = require('child_process'),
exec = cp.exec;

const absFilePath = `${__dirname}/public/input`;
const filePath = './public/input';
const staticPath = './public/js';
let timer;
const intervalMS = 10000;

const state = {
  server: null,
  sockets: [],
};
process.env.npm_config_cameraOn = false;

console.log('platform ', process.platform)

let techTerns = {
  stt: (audioFile) => {
    /**
     * supported file types [application/octet-stream,audio/alaw,audio/basic,audio/flac,audio/g729,audio/l16,audio/mp3,audio/mpeg,audio/mulaw,audio/ogg,audio/ogg;codecs=opus,audio/ogg;codecs=vorbis,audio/wav,audio/webm,audio/webm;codecs=opus,audio/webm;codecs=vorbis]
     */
      let contentType = audioFile.indexOf('wav') > 0 ? 'audio/wav' : 'audio/mp3';
      let arg = `curl -X POST -u "apikey:2z7-aATMGDk1mtsIVlx-n8eqFuHrorfhFplSVIBb2Qms" --header "Content-Type: ${contentType}" --data-binary @/${absFilePath}/${audioFile} "https://api.us-south.speech-to-text.watson.cloud.ibm.com/instances/ce140507-a5c1-4a83-877c-a5017e16e17e/v1/recognize"`
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          console.log('audio transcribed...', stdout);
          jsonfile.writeFile(`${staticPath}/audio.json`, JSON.parse(stdout), {spaces: 2});
          techTerns.renameFile(`${absFilePath}/${audioFile}`, `${absFilePath}/backup/${audioFile}`);  
          // fs.unlinkSync(`${absFilePath}/${audioFile}`);
        } else {
          console.log(err);
        }
      });
  },
  tts: (text) => {
    let arg = `curl -X POST -u "apikey:O1zxru_nZPZqbGTHs5E6xmvr7wieYEUKBIbQ162w6oiu" --header "Content-Type: audio/mp3" --data "{\"text\": \"hello world\"}" --output /Users/jeff/git_repo/sandbox/ieam/techterns/public/input/hello.mp3 "https://api.us-south.text-to-speech.watson.cloud.ibm.com/instances/043bb919-1d30-4916-825d-a452da75b6a2/v1/synthesize"`
  },
  renameFile: (from, to) => {
    if(fs.existsSync(from)) {
      fs.renameSync(from, to);
    }    
  },
  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  checkAudio: async () => {
    let audioFile = `audio.wav`;
    if(!fs.existsSync(`${filePath}/${audioFile}`)) {
      audioFile = `audio.mp3`;
    }
    if(fs.existsSync(`${filePath}/${audioFile}`)) {
      try {
        console.log(audioFile)
        techTerns.stt(audioFile);
      } catch(e) {
        console.log(e);
        fs.unlinkSync(imageFile);
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
      console.log('\n----------------- restarting -------------');
      techTerns.start();
    });
  }      
}

techTerns.start();
techTerns.setInterval(intervalMS);
