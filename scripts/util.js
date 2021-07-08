#! /usr/bin/env node
const {existsSync, readFileSync} = require('fs');
const jsonfile = require('jsonfile');
const { Observable, forkJoin } = require('rxjs');
const cp = require('child_process'),
exec = cp.exec;

var dotenv = require('dotenv');

if(existsSync('.env-local')) {
  const localEnv = dotenv.parse(readFileSync('.env-local'));
  for(var i in localEnv) {
    process.env[i] = localEnv[i];
  }
}
const sttUrl = process.env.stt_url;
const ttsUrl = process.env.tts_url;
const task = process.env.npm_config_task || 'doNothing';

let build = {
  tts: () => {
    return new Observable((observer) => {
      const apikey = process.env.tts_apikey;
      const text = process.env.npm_config_text;
      const audioType = process.env.npm_config_audio_type;
      const output = process.env.npm_config_output;
      if(!text || !output || !audioType) {
        console.log('missing arguments, should have something like this...')
        console.log('npm run tts-test --text="testing 1 2 3" --output=/Users/jeff/git_repo/sandbox/ieam/techterns/public/input/audio.mp3')
        process.exit(0);
      }
      let arg = `curl -X POST -u "apikey:${apikey}" --header "Content-Type: application/json" --header "Accept: audio/${audioType}" --data '{"text": "${text}"}' --output ${output} "${ttsUrl}"`
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          console.log('audio file created...', stdout);
          observer.next();
          observer.complete();
        } else {
          console.log(err);
          observer.error(err);
        }
      });
    });  
  },
  stt: () => {
    return new Observable((observer) => {
      const apikey = process.env.stt_apikey;
      const audioType = process.env.npm_config_audio_type;
      const audioFile = process.env.npm_config_audio_file;
      if(!audioFile || !audioType) {
        console.log('missing arguments, should have something like this...')
        console.log('npm run stt-test --audio_type=mp3 --audio_file=/Users/jeff/git_repo/sandbox/ieam/techterns/public/input/backup/audio.mp3')
        process.exit(0);
      }

      let arg = `curl -X POST -u "apikey:${apikey}" --header "Content-Type: audio/${audioType}" --data-binary @/${audioFile} "${sttUrl}"`
      console.log(arg)
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          console.log('audio file created...', stdout);
          observer.next();
          observer.complete();
        } else {
          console.log(err);
          observer.error(err);
        }
      });
    });  
  },
  stt_tts_tokens: () => {
    return new Observable((observer) => {
      const watsonServiceToken = 'https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/646d429a9e5f06572b1056ccc9f5ba4de6f5c30159f10fcd1f1773f58d35579b/watson-weather/api/stt-tts/token';
      let arg = `curl --location --request GET '${watsonServiceToken}' --header 'Content-Type: application/json'`
      exec(arg, {maxBuffer: 1024 * 2000}, (err, stdout, stderr) => {
        if(!err) {
          console.log('tokens retrieved...', stdout);
          observer.next();
          observer.complete();
        } else {
          console.log(err);
          observer.error(err);
        }
      });
    });
  },
  doNothing: () => console.log('nothing to do.')
};

build[task]()
.subscribe(() => console.log('process completed.'),
(err) => console.log('something went wrong!'));