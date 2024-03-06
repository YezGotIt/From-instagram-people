const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

// Set up storage in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const outputDir = "public/videos";
  const outputFileName = Date.now() + ".m3u8";

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() is zero-based, adding 1 for human-readable format
  const day = now.getDate(); // getDate() for day of the month
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const date = `${year}${month.toString().padStart(2, "0")}${day
    .toString()
    .padStart(2, "0")}-${hours.toString().padStart(2, "0")}${minutes
    .toString()
    .padStart(2, "0")}${seconds.toString().padStart(2, "0")}`;

  const fileName = `segment_${date}_%d.ts`;
  const outputPath = path.join(outputDir, outputFileName);
  console.log("outputPath:", outputPath);
  const segmentPath = path.join(outputDir, fileName);
  console.log("segmentPath:", segmentPath);

  // Create a subprocess for ffmpeg
  const ffmpegProcess = spawn("ffmpeg", [
    "-i",
    "-", // Input from stdin
    "-hls_time",
    "10",
    "-hls_list_size",
    "0",
    "-hls_segment_filename",
    segmentPath,
    outputPath,
  ]);

  ffmpegProcess.stdin.write(req.file.buffer);
  ffmpegProcess.stdin.end();

  ffmpegProcess.on("close", (code) => {
    if (code === 0) {
      console.log("Conversion finished successfully");
      res.send({ message: "Video converted successfully", path: outputPath });
    } else {
      console.error("FFmpeg process exited with code " + code);
      res.status(500).send("Conversion failed");
    }
  });

  ffmpegProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
