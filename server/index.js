const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const pools = require('./pools');
const {
  fetchAndParsePDF,
  extractLapSwimSchedule,
  isLapSwimAvailable,
  pdfCache,
} = require('./pdfService');

// Load manual schedule overrides
let manualSchedules = {};
try {
  const manualData = fs.readFileSync(path.join(__dirname, 'manualSchedules.json'), 'utf8');
  manualSchedules = JSON.parse(manualData).schedules || {};
} catch (error) {
  console.log('No manual schedules found, using automated parsing only');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Store parsed schedules in memory
const scheduleCache = new Map();

/**
 * Fetch schedule URL from pool details page if not directly available
 */
async function getScheduleUrl(pool) {
  if (pool.scheduleUrl) return pool.scheduleUrl;

  // For now, return null if no direct URL
  // In production, we'd scrape the details page
  return null;
}

/**
 * Update schedule for a specific pool
 */
/**
 * Process manual schedule times from "HH:MM-HH:MM" format to ["HH:MM am/pm", "HH:MM am/pm"] format
 */
function processManualSchedule(manualSched) {
  const allSessions = [];

  manualSched.lapSwimSessions.forEach(session => {
    // If times array is empty, keep one session with empty times
    if (!session.times || session.times.length === 0) {
      allSessions.push({
        days: session.days,
        times: [],
        notes: session.notes || ''
      });
      return;
    }

    // Create a separate session for each time range
    session.times.forEach(timeStr => {
      // Check if it's in range format "HH:MM-HH:MM"
      const rangeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
      if (rangeMatch) {
        const startHour = parseInt(rangeMatch[1]);
        const startMin = rangeMatch[2];
        const endHour = parseInt(rangeMatch[3]);
        const endMin = rangeMatch[4];

        // Convert to 12-hour format with am/pm
        const startPeriod = startHour >= 12 ? 'pm' : 'am';
        const endPeriod = endHour >= 12 ? 'pm' : 'am';
        const start12 = startHour > 12 ? startHour - 12 : (startHour === 0 ? 12 : startHour);
        const end12 = endHour > 12 ? endHour - 12 : (endHour === 0 ? 12 : endHour);

        allSessions.push({
          days: session.days,
          times: [`${start12}:${startMin} ${startPeriod}`, `${end12}:${endMin} ${endPeriod}`],
          notes: session.notes || ''
        });
      }
    });
  });

  return {
    ...manualSched,
    lapSwimSessions: allSessions
  };
}

async function updatePoolSchedule(pool) {
  try {
    // Check for manual override first
    if (manualSchedules[pool.id]) {
      console.log(`Using manual schedule for ${pool.name}`);
      const processedSchedule = processManualSchedule(manualSchedules[pool.id]);
      const manualSchedule = {
        poolName: pool.name,
        lapSwimSessions: processedSchedule.lapSwimSessions,
        rawText: 'Manual schedule override',
        pool: pool,
        lastUpdated: new Date().toISOString(),
        isManual: true,
      };
      scheduleCache.set(pool.id, manualSchedule);
      return manualSchedule;
    }

    const scheduleUrl = await getScheduleUrl(pool);
    if (!scheduleUrl) {
      console.log(`No schedule URL for ${pool.name}`);
      return null;
    }

    const pdfData = await fetchAndParsePDF(scheduleUrl);
    const schedule = extractLapSwimSchedule(pdfData.text, pool.name);

    scheduleCache.set(pool.id, {
      ...schedule,
      pool: pool,
      scheduleUrl: scheduleUrl,
      lastUpdated: new Date().toISOString(),
      isManual: false,
    });

    console.log(`Updated schedule for ${pool.name}`);
    return schedule;
  } catch (error) {
    console.error(`Failed to update schedule for ${pool.name}:`, error.message);
    return null;
  }
}

/**
 * Update all pool schedules
 */
async function updateAllSchedules() {
  console.log('Updating all pool schedules...');
  const updatePromises = pools.map(pool => updatePoolSchedule(pool));
  await Promise.allSettled(updatePromises);
  console.log('Schedule update complete');
}

// Routes

app.get('/api/pools', (req, res) => {
  res.json(pools);
});

app.get('/api/pools/:poolId', (req, res) => {
  const pool = pools.find(p => p.id === req.params.poolId);
  if (!pool) {
    return res.status(404).json({ error: 'Pool not found' });
  }
  res.json(pool);
});

app.get('/api/schedules', async (req, res) => {
  try {
    // If cache is empty, update all schedules
    if (scheduleCache.size === 0) {
      await updateAllSchedules();
    }

    const schedules = Array.from(scheduleCache.values());
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

app.get('/api/schedules/:poolId', async (req, res) => {
  try {
    let schedule = scheduleCache.get(req.params.poolId);

    if (!schedule) {
      const pool = pools.find(p => p.id === req.params.poolId);
      if (!pool) {
        return res.status(404).json({ error: 'Pool not found' });
      }
      schedule = await updatePoolSchedule(pool);
    }

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not available' });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

app.post('/api/schedules/refresh', async (req, res) => {
  try {
    await updateAllSchedules();
    res.json({ message: 'Schedules refreshed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh schedules' });
  }
});

app.post('/api/schedules/:poolId/refresh', async (req, res) => {
  try {
    const pool = pools.find(p => p.id === req.params.poolId);
    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    const schedule = await updatePoolSchedule(pool);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not available' });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh schedule' });
  }
});

// Check availability at specific time
app.get('/api/available', async (req, res) => {
  try {
    const { date, time } = req.query;
    let targetDate;

    if (date && time) {
      targetDate = new Date(`${date}T${time}`);
    } else {
      targetDate = new Date();
    }

    if (scheduleCache.size === 0) {
      await updateAllSchedules();
    }

    const available = [];
    for (const [poolId, schedule] of scheduleCache.entries()) {
      const isAvailable = isLapSwimAvailable(
        schedule,
        targetDate.getDay(),
        targetDate.getHours(),
        targetDate.getMinutes()
      );

      if (isAvailable) {
        available.push({
          pool: schedule.pool,
          schedule: schedule.lapSwimSessions,
        });
      }
    }

    res.json({
      requestedTime: targetDate.toISOString(),
      availablePools: available,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    schedulesLoaded: scheduleCache.size,
    totalPools: pools.length,
  });
});

// Schedule automatic updates every day at 6 AM
cron.schedule('0 6 * * *', () => {
  console.log('Running scheduled update...');
  updateAllSchedules();
});

// Initial schedule load on startup
updateAllSchedules().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
