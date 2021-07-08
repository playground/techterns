const fileUpload = require('express-fileupload');
const express = require("express");
const path = require('path');

module.exports = () => {
  const app = express();

  app.use(fileUpload());

  app.use('/static', express.static('public'));

  app.get('/',(req,res,next) => { //here just add next parameter
    res.sendFile(
      path.resolve( __dirname, "index.html" )
    )
    // next();
  })

  app.get("/techterns", (req, res) => {
    res.json(["Cristina", "Jordan","Karina","Lysander","Victor"]);
  });

  app.post('/upload', function(req, res) {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
      } else {
        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        let imageFile = req.files.imageFile;
        let uploadPath = __dirname + `/public/input/image.png`;
    
        // Use the mv() method to place the file somewhere on your server
        imageFile.mv(uploadPath, function(err) {
          if (err)
            return res.status(500).send(err);
    
          res.send({status: true, message: 'File uploaded!'});
        });
    
      }  
    } catch(err) {
      res.status(500).send(err);
    }
  });

  app.get("*",  (req, res) => {
    res.sendFile(
        path.resolve( __dirname, "index.html" )
    )
  });

  return app;
}