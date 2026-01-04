/**
 * =============================================================================
 * ACTIVITY.JS - Unified GitHub + LeetCode Activity Tracker
 * =============================================================================
 * Tracks: GitHub commits, GitHub PRs, LeetCode problems solved
 * Single heatmap: green = any activity, dark = no activity
 * Recent activity feed with time-ago formatting
 * =============================================================================
 */

// Configuration
const CONFIG = {
    github: {
        username: 'DigraJatin',
        apiUrl: 'https://api.github.com/users/DigraJatin/events/public'
    },
    leetcode: {
        username: 'jatindigra',
        // Using public proxy for LeetCode data since official API has no CORS
        apiUrl: 'https://leetcode-stats-api.herokuapp.com/jatindigra'
    }
};

// Store activity data globally
let activityData = {};
let recentActivities = [];


/**
 * Initialize activity page
 */
async function initActivity() {
    showLoading();

    try {
        // Fetch GitHub data (real API)
        const githubEvents = await fetchGitHubEvents();
        processGitHubEvents(githubEvents);

        // Fetch LeetCode data (proxy API)
        const leetcodeData = await fetchLeetCodeData();
        if (leetcodeData && leetcodeData.status === 'success') {
            processLeetCodeData(leetcodeData);
        } else {
            console.warn('LeetCode API returned error or empty data');
        }

        // Render unified heatmap
        renderUnifiedHeatmap();

        // Render recent activity feed
        renderActivityFeed();

    } catch (error) {
        console.error('Failed to load activity:', error);
        // Still render what we have
        renderUnifiedHeatmap();
        renderActivityFeed();
    }
}


/**
 * Fetch GitHub public events
 * Returns last 30 events (API default)
 */
async function fetchGitHubEvents() {
    try {
        const response = await fetch(CONFIG.github.apiUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        return await response.json();
    } catch (e) {
        console.error("GitHub fetch failed", e);
        return [];
    }
}


/**
 * Fetch LeetCode data via proxy
 */
async function fetchLeetCodeData() {
    try {
        const response = await fetch(CONFIG.leetcode.apiUrl);
        if (!response.ok) {
            throw new Error(`LeetCode API error: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error("LeetCode fetch failed", e);
        return null;
    }
}


/**
 * Process GitHub events into activity data
 */
function processGitHubEvents(events) {
    if (!Array.isArray(events)) return;

    events.forEach(event => {
        const date = event.created_at.split('T')[0];
        const time = new Date(event.created_at);

        if (!activityData[date]) {
            activityData[date] = { hasActivity: false, events: [] };
        }

        if (event.type === 'PushEvent') {
            // Commits
            const commits = event.payload.commits || [];
            const repoName = event.repo.name.split('/')[1];

            activityData[date].hasActivity = true;

            commits.forEach(commit => {
                activityData[date].events.push({
                    type: 'commit',
                    message: commit.message.split('\n')[0],
                    repo: repoName
                });

                recentActivities.push({
                    type: 'commit',
                    icon: '📝',
                    text: `Committed to <a href="https://github.com/${event.repo.name}" target="_blank">${repoName}</a>`,
                    detail: commit.message.split('\n')[0],
                    time: time
                });
            });

        } else if (event.type === 'PullRequestEvent') {
            // Pull Requests
            const action = event.payload.action;
            const pr = event.payload.pull_request;
            const repoName = event.repo.name.split('/')[1];

            if (action === 'opened' || action === 'closed') {
                activityData[date].hasActivity = true;
                activityData[date].events.push({
                    type: 'pr',
                    action: action,
                    title: pr.title,
                    repo: repoName
                });

                recentActivities.push({
                    type: 'pr',
                    icon: '🔀',
                    text: `${action === 'opened' ? 'Opened' : 'Merged'} PR in <a href="https://github.com/${event.repo.name}" target="_blank">${repoName}</a>`,
                    detail: pr.title,
                    time: time
                });
            }
        }
    });
}


/**
 * Process LeetCode data from proxy
 * Note: The proxy mainly returns stats. Calendar data is sometimes limited.
 * We'll use the 'submissionCalendar' if available, otherwise just total solved count won't fit on heatmap well.
 * The heroku proxy returns `submissionCalendar` which is a map of unix timestamp -> count.
 */
function processLeetCodeData(data) {
    if (!data || !data.submissionCalendar) return;

    const calendar = data.submissionCalendar;

    Object.keys(calendar).forEach(timestamp => {
        // Timestamp from this API is in seconds
        const dateObj = new Date(parseInt(timestamp) * 1000);
        const dateStr = dateObj.toISOString().split('T')[0];
        const count = calendar[timestamp];

        if (!activityData[dateStr]) {
            activityData[dateStr] = { hasActivity: false, events: [] };
        }

        if (count > 0) {
            activityData[dateStr].hasActivity = true;

            // We don't have problem details from this endpoint, just counts
            for (let i = 0; i < count; i++) {
                activityData[dateStr].events.push({
                    type: 'leetcode',
                    name: 'LeetCode Problem',
                    difficulty: 'Unknown'
                });
            }

            // Add to recent activity only if it's recent (last 3 days)
            // But checking exact time is hard with just day timestamp
            // So we'll skip adding specific items to recent feed from this aggregate source
            // to avoid spamming "Solved LeetCode Problem" 100 times.
            // A better specialized endpoint would be needed for recent feed details.
        }
    });

    // Add a summary item for LeetCode
    recentActivities.push({
        type: 'leetcode',
        icon: '💡',
        text: `Solved ${data.totalSolved} problems on LeetCode`,
        detail: `Easy: ${data.easySolved} | Medium: ${data.mediumSolved} | Hard: ${data.hardSolved}`,
        time: new Date() // Just show it at top
    });
}


/**
 * Render unified heatmap
 */
function renderUnifiedHeatmap() {
    const container = document.getElementById('unified-heatmap');
    if (!container) return;

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);

    // Adjust to start on Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    let html = '<div class="heatmap">';

    const currentDate = new Date(startDate);
    while (currentDate <= today) {
        html += '<div class="heatmap-week">';

        for (let day = 0; day < 7; day++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const activity = activityData[dateStr];
            const hasActivity = activity && activity.hasActivity;

            // Calculate opacity based on count for green shades
            let opacity = 0.4; // default active
            if (hasActivity) {
                const count = activity.events.length;
                if (count > 4) opacity = 1.0;
                else if (count > 2) opacity = 0.8;
                else if (count > 0) opacity = 0.6;
            }

            // Apply style directly for simple opacity handling or use classes
            const style = hasActivity ? `style="background-color: rgba(57, 211, 83, ${opacity})"` : '';

            html += `
                <div class="heatmap-day ${hasActivity ? 'active' : 'inactive'}" 
                     data-date="${dateStr}"
                     ${style}
                     title="${formatDateForTooltip(dateStr, activity)}">
                </div>
            `;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        html += '</div>';
    }

    html += '</div>';

    // Legend
    html += `
        <div class="heatmap-legend">
            <span>No activity</span>
            <span class="heatmap-legend-item inactive" style="background-color: var(--heatmap-0);"></span>
            <span class="heatmap-legend-item" style="background-color: rgba(57, 211, 83, 0.4);"></span>
            <span class="heatmap-legend-item" style="background-color: rgba(57, 211, 83, 0.7);"></span>
            <span class="heatmap-legend-item" style="background-color: rgba(57, 211, 83, 1.0);"></span>
            <span>Active</span>
        </div>
    `;

    container.innerHTML = html;
}


/**
 * Format date for tooltip
 */
function formatDateForTooltip(dateStr, activity) {
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    if (!activity || !activity.hasActivity) {
        return `${formatted}: No activity`;
    }

    const count = activity.events.length;
    return `${formatted}: ${count} activit${count === 1 ? 'y' : 'ies'}`;
}


/**
 * Render recent activity feed
 */
function renderActivityFeed() {
    const container = document.getElementById('activity-feed');
    if (!container) return;

    // Sort by time descending
    recentActivities.sort((a, b) => b.time - a.time);

    // Take top 10
    const recent = recentActivities.slice(0, 10);

    if (recent.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent activity found.</p>';
        return;
    }

    let html = '<ul class="activity-feed-list">';

    recent.forEach(activity => {
        html += `
            <li class="activity-feed-item">
                <div class="activity-feed-icon">${activity.icon}</div>
                <div class="activity-feed-content">
                    <div class="activity-feed-text">${activity.text}</div>
                    <div class="activity-feed-time">${timeAgo(activity.time)}</div>
                </div>
            </li>
        `;
    });

    html += '</ul>';
    container.innerHTML = html;
}


/**
 * Format time as "X hours ago" style
 */
function timeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    return 'just now';
}


/**
 * Show loading state
 */
function showLoading() {
    const heatmap = document.getElementById('unified-heatmap');
    const feed = document.getElementById('activity-feed');

    if (heatmap) heatmap.innerHTML = '<p class="text-muted">Loading activity...</p>';
    if (feed) feed.innerHTML = '<p class="text-muted">Loading recent activity...</p>';
}


// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initActivity };
}
