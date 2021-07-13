# Team TechTerns

## P-Tech 2021 Summer Interns

## For development
- run "npm install" after git clone
- npm start will start the server, the server will monitor for an incoming audio file (audio.mp3 or audio.wav)
- from browser access the site through localhost:3000 
- To test speech to text, run 
  ```npm run stt-test  --audio_type=mp3 --audio_file=<path_to_audio_file>```
- To test text to speech, run
  ```npm run tts-test --audio_type=mp3 --text="testing 1 2 3" --output=<path_to_audio_file>```   

## For deployment
- Change directory to the repository `cd techterns` 
- Run `sudo docker build -t <IMAGE_NAME> .` to build the image
- Run `sudo docker run --network host --privileged -ti <IMAGE_NAME> /bin/bash` to create and run the container in bash
- Run `npm run start` to start the server. Make sure to have the mqtt message broker running so it subscribes to it when the server starts.
