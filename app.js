// app.js
const express = require("express");
const multer = require("multer");
const vision = require("@google-cloud/vision");
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const util = require("util");
require("dotenv").config();
const app = express();
const path = require("path");
const port = 8888;
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const tts = new textToSpeech.TextToSpeechClient();
// Setting storage engine
const storageEngine = multer.diskStorage({
	destination: "./uploads/images",
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}--${file.originalname}`);
	},
});
// initializing multer
const upload = multer({
	storage: storageEngine,
	limits: { fileSize: 5000000 },
	fileFilter: function(req, file, cb) {
		checkFileType(file, cb);
	},
});


const checkFileType = function(file, cb) {
	// Allowed file extensions
	const fileTypes = /jpeg|jpg|png|heic|svg/;

	// check extension names
	const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());

	const mimeType = fileTypes.test(file.mimetype);

	if (mimeType && extName) {
		return cb(null, true);
	}
	else {
		cb("Error: You can Only Upload Images!!");
	}
};
const ocrImage = async function(req) {
	const { filename } = req.file;
	const filePath = path.join(__dirname, "uploads", "images", filename);
	const vis = new vision.ImageAnnotatorClient();
	const [result] = await vis.textDetection(filePath);
	const detections = result.fullTextAnnotation;
	if(!detections) {
		return "No text detected";
	}
	const text = detections.text;
	return text;
};

app.post("/profile-upload-single", upload.single("profile-file"), async function(req, res) {
	// req.file is the `profile-file` file
	// req.body will hold the text fields, if there were any
	let response = "<!DOCTYPE html> <head> <title>Scrybe - Transcribe Text From Images</title> <link rel=\"stylesheet\" href=\"css/bootstrap.min.css\" /> <link rel=\"stylesheet\" href=\"css/style.css\"> </head> <body> <div id=\"container-fluid\"> <h1 align=\"center\">Scrybe - Transcribe Text From Images</h1> <br><br><br> <a href=\"/\">Home</a><br></html>";
	response += "Files uploaded successfully.<br>";
	console.log(req.file.path);
	response = response + "File path: " + req.file.path + "<br>";
	response = response + "File size: " + req.file.size + "<br>";
	response = response + "File type: " + req.file.mimetype + "<br>";
	response = response + "File name: " + req.file.originalname + "<br>";
	const text = await ocrImage(req);
	const request = {
		input: { text: text },
		voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
		// select the type of audio encoding
		audioConfig: { audioEncoding: "MP3" },
	};
	// Performs the text-to-speech request
	const [response1] = await tts.synthesizeSpeech(request);
	// Write the binary audio content to a local file
	const writeFile = util.promisify(fs.writeFile);
	await writeFile(`uploads/audio/${req.file.filename}.mp3`, response1.audioContent, "binary");
	console.log("Audio content written to audio directory");
	response += "Text from Image: " + text;
	response += "<br><br><a href='/uploads/images/" + req.file.filename + "'>Click here to view the uploaded image</a><br>";
	response += "<audio controls> <source src='/uploads/audio/" + req.file.filename + ".mp3' type='audio/mpeg'> </audio>";
	res.send(response);
});
app.post("/profile-upload-multiple", upload.array("profile-files", 12), function(req, res) {
	// req.files is array of `profile-files` files
	// req.body will contain the text fields, if there were any
	let response = "<a href=\"/\">Home</a><br>";
	response += "Files uploaded successfully.<br>";
	for(let i = 0;i < req.files.length;i++) {
		response += `<img src="${req.files[i].path}" /><br>`;
	}
	res.write(response);
	res.end();

});
app.listen(port, ()=>{
	console.log(`App is listening on port ${port}`);
});
