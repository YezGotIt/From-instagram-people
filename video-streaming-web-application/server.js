const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const streamifier = require("streamifier");

const app = express();
const port = 3000;

// Set up storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("video"), (req, res) => {
  // Check if file is received
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  console.log("req.file:", req.file);

  const outputDir = "public/videos";
  const outputFileName = Date.now() + ".m3u8";

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, outputFileName);

  // Convert buffer to stream
  const inputStream = streamifier.createReadStream(req.file.buffer);

  ffmpeg(inputStream)
    .outputOptions([
      "-hls_time 10",
      "-hls_list_size 0",
      "-hls_segment_filename " + path.join(outputDir, "segment_%d.ts"),
    ])
    .output(outputPath)
    .on("end", () => {
      console.log("Conversion Finished");
      res.send({ message: "Video converted successfully", path: outputPath });
    })
    .on("error", (err) => {
      console.error("Error: " + err.message);
      res.status(500).send("Conversion failed");
    })
    .run();
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
