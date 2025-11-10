const axios = require('axios');
const { PDFParse } = require('pdf-parse');
const NodeCache = require('node-cache');

// Cache PDFs for 1 week (604800 seconds)
const pdfCache = new NodeCache({ stdTTL: 604800 });

/**
 * Fetch and parse a PDF from a URL
 */
async function fetchAndParsePDF(url) {
  try {
    // Check cache first
    const cached = pdfCache.get(url);
    if (cached) {
      console.log(`Using cached PDF for ${url}`);
      return cached;
    }

    console.log(`Fetching PDF from ${url}`);

    // Create parser with URL
    const parser = new PDFParse({ url });
    const data = await parser.getText();

    const result = {
      text: data.text,
      numPages: data.numPages || 0,
      info: data.info || {},
    };

    // Cache the result
    pdfCache.set(url, result);
    return result;
  } catch (error) {
    console.error(`Error fetching PDF from ${url}:`, error.message);
    throw error;
  }
}

/**
 * Extract lap swim schedule from PDF text
 * Handles tabular format where days are columns and activities are rows
 */
function extractLapSwimSchedule(pdfText, poolName) {
  const schedule = {
    poolName,
    lapSwimSessions: [],
    rawText: pdfText,
  };

  // Split text into lines (don't trim to preserve structure)
  const lines = pdfText.split('\n').filter(line => line);

  // Pattern to match day names
  const dayPattern = /(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)/i;

  // Pattern to match time ranges with various dash types
  const timeRangePattern = /(\d{1,2}:\d{2}\s*(?:am|pm))\s*[‐–—-]\s*(\d{1,2}:\d{2}\s*(?:am|pm))/gi;

  // Find the header row with days
  let headerIndex = -1;
  let daysInHeader = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dayMatches = line.match(new RegExp(dayPattern, 'gi'));

    if (dayMatches && dayMatches.length >= 2) {
      // This is likely the header row
      headerIndex = i;
      // Split by tabs to get day positions
      const parts = line.split('\t');
      daysInHeader = parts.map(part => {
        const match = part.match(dayPattern);
        return match ? match[0].toUpperCase() : null;
      }).filter(d => d !== null);
      break;
    }
  }

  if (headerIndex === -1 || daysInHeader.length === 0) {
    // Couldn't find header, return empty schedule
    return schedule;
  }

  // Process rows looking for LAP SWIM entries
  const lapSwimPattern = /LAP\s*SWIM/i;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    if (lapSwimPattern.test(line)) {
      // This row contains lap swim info
      // Look for the next line(s) with time information
      let timeLine = '';
      let lineOffset = 1;

      // Sometimes there's a descriptive line (like "(deep pool)") between activity and times
      // Look ahead up to 3 lines for time information
      for (let j = 1; j <= 3; j++) {
        const nextLine = i + j < lines.length ? lines[i + j] : '';
        if (timeRangePattern.test(nextLine)) {
          timeLine = nextLine;
          lineOffset = j;
          break;
        }
      }

      if (!timeLine) continue; // No time info found

      // Split both lines by tabs
      const activityColumns = line.split('\t');
      const timeColumns = timeLine.split('\t');

      // Process each tab-separated column
      for (let col = 0; col < activityColumns.length && col < daysInHeader.length; col++) {
        const activity = activityColumns[col];
        const timeInfo = col < timeColumns.length ? timeColumns[col] : '';

        // Check if this column has lap swim
        if (lapSwimPattern.test(activity)) {
          // Extract ONLY the time range from THIS specific column
          const columnTimeMatches = [...timeInfo.matchAll(timeRangePattern)];

          if (columnTimeMatches.length > 0) {
            // Take only the first time range from this column
            const match = columnTimeMatches[0];
            schedule.lapSwimSessions.push({
              days: [daysInHeader[col]],
              times: [match[1].trim(), match[2].trim()],
              context: `${activity.trim()} - ${timeInfo.trim()}`,
            });
          }
        }
      }
    }
  }

  // Remove duplicate sessions (same day and time)
  const seen = new Set();
  schedule.lapSwimSessions = schedule.lapSwimSessions.filter(session => {
    const key = `${session.days[0]}-${session.times.join('-')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return schedule;
}

/**
 * Parse time string to 24-hour format for comparison
 */
function parseTime(timeStr) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!match) return null;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toLowerCase();

  if (period === 'pm' && hours !== 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  return { hours, minutes };
}

/**
 * Check if lap swim is available at a given time
 */
function isLapSwimAvailable(schedule, dayOfWeek, hours, minutes) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = dayNames[dayOfWeek].toLowerCase();

  for (const session of schedule.lapSwimSessions) {
    // Check if day matches
    const dayMatch = session.days.some(day =>
      day.toLowerCase().includes(targetDay.substring(0, 3))
    );

    if (!dayMatch) continue;

    // Check if time falls within session times
    // This is simplified - assumes times are start-end pairs
    if (session.times.length >= 2) {
      const startTime = parseTime(session.times[0]);
      const endTime = parseTime(session.times[1]);

      if (startTime && endTime) {
        const targetMinutes = hours * 60 + minutes;
        const startMinutes = startTime.hours * 60 + startTime.minutes;
        const endMinutes = endTime.hours * 60 + endTime.minutes;

        if (targetMinutes >= startMinutes && targetMinutes <= endMinutes) {
          return true;
        }
      }
    }
  }

  return false;
}

module.exports = {
  fetchAndParsePDF,
  extractLapSwimSchedule,
  isLapSwimAvailable,
  parseTime,
  pdfCache,
};
