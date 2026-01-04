/**
 * =============================================================================
 * ACTIVITY.JS - Binary Heatmap & Activity Feed
 * =============================================================================
 * - Heatmap: Binary (Active/Inactive). Last 365 days ending TODAY.
 * - Feed: Timeline style.
 * - Data: GitHub Events + LeetCode Calendar/Recent.
 * =============================================================================
 */

const CONFIG = {
    github: {
        username: 'DigraJatin',
        apiUrl: 'https://api.github.com/users/DigraJatin/events/public'
    },
    leetcode: {
        username: 'jatindigra',
        calendarUrl: 'https://alfa-leetcode-api.onrender.com/userProfileCalendar/jatindigra',
        recentUrl: 'https://alfa-leetcode-api.onrender.com/jatindigra/acSubmission'
    }
};

let dailyActivity = {};
let recentFeed = [];

async function initActivity() {
    showLoading();
    initCalendarGrid();
    try {
        await Promise.all([fetchGitHubData(), fetchLeetCodeData()]);
    } catch (e) {
        console.error("Partial data fetch error:", e);
    }
    renderHeatmap();
    renderFeed();
}

/**
 * Empty calendar for last 365 days
 */
function initCalendarGrid() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 366; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyActivity[dateStr] = { active: false };
    }
}

function markActive(dateStr) {
    if (dailyActivity[dateStr]) dailyActivity[dateStr].active = true;
}

async function fetchGitHubData() {
    try {
        const res = await fetch(CONFIG.github.apiUrl);
        if (!res.ok) throw new Error("GitHub API failed");
        const events = await res.json();
        if (!Array.isArray(events)) return;

        events.forEach(event => {
            const dateStr = event.created_at.split('T')[0];
            const repo = event.repo.name;
            if (event.type === 'PushEvent') {
                markActive(dateStr);
                recentFeed.push({
                    text: `Committed to <strong>${repo}</strong>`,
                    time: new Date(event.created_at)
                });
            } else if (event.type === 'PullRequestEvent' && event.payload.action === 'opened') {
                markActive(dateStr);
                recentFeed.push({
                    text: `Opened PR in <strong>${repo}</strong>`,
                    time: new Date(event.created_at)
                });
            }
        });
    } catch (e) { console.error("GitHub fetch error:", e); }
}

async function fetchLeetCodeData() {
    try {
        const calRes = await fetch(CONFIG.leetcode.calendarUrl);
        const calData = await calRes.json();
        if (calData?.data?.matchedUser?.submissionCalendar) {
            const calendar = JSON.parse(calData.data.matchedUser.submissionCalendar);
            Object.keys(calendar).forEach(ts => {
                if (calendar[ts] > 0) {
                    const date = new Date(parseInt(ts) * 1000);
                    markActive(date.toISOString().split('T')[0]);
                }
            });
        }
    } catch (e) { console.error("LC Calendar error:", e); }

    try {
        const recentRes = await fetch(CONFIG.leetcode.recentUrl);
        const recentData = await recentRes.json();
        const submissions = recentData.submission || [];
        submissions.forEach(sub => {
            const date = new Date(parseInt(sub.timestamp) * 1000);
            markActive(date.toISOString().split('T')[0]);
            recentFeed.push({
                text: `Solved <strong>${sub.title}</strong> on LeetCode`,
                time: date
            });
        });
    } catch (e) { console.error("LC Recent error:", e); }
}

function renderHeatmap() {
    const container = document.getElementById('unified-heatmap');
    if (!container) return;

    // STRICT: Stop at today.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start roughly 52 weeks ago on a Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    let html = '<div class="heatmap">';
    const curr = new Date(startDate);

    // Loop week by week
    while (true) {
        html += '<div class="heatmap-week">';
        for (let d = 0; d < 7; d++) {
            // STOP condition: If curr > today, verify if we should just render empty or stop?
            // "Why are there empty squares in the very last?" -> User wants NO squares after today.
            // If we stop mid-week, flex layout might look jagged if row-based?
            // CSS is .heatmap-week { flex-direction: column }. So it's fine to have a short column.

            if (curr > today) {
                // Do not render anything more for this week
            } else {
                const dateStr = curr.toISOString().split('T')[0];
                const isActive = dailyActivity[dateStr] && dailyActivity[dateStr].active;
                const title = `${curr.toLocaleDateString()}: ${isActive ? 'Active' : 'Inactive'}`;
                html += `<div class="heatmap-day ${isActive ? 'active' : ''}" title="${title}"></div>`;
            }
            curr.setDate(curr.getDate() + 1);
        }
        html += '</div>';

        // If we have passed today, stop creating weeks
        if (curr > today) break;
    }

    html += '</div>';

    html += `
        <div class="heatmap-legend">
            <span>Inactive</span>
            <span class="heatmap-day" style="background-color: var(--heatmap-0);"></span>
            <span class="heatmap-day active"></span>
            <span>Active</span>
        </div>
    `;
    container.innerHTML = html;
}

function renderFeed() {
    const container = document.getElementById('activity-feed');
    if (!container) return;

    recentFeed.sort((a, b) => b.time - a.time);

    // Dedup (simple key)
    const unique = [];
    const seen = new Set();
    for (const item of recentFeed) {
        const key = item.text + item.time.toISOString();
        if (!seen.has(key)) { seen.add(key); unique.push(item); }
    }

    const displayItems = unique.slice(0, 10);
    if (displayItems.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent activity.</p>';
        return;
    }

    let html = '<div class="timeline-feed">';
    displayItems.forEach(item => {
        html += `
            <div class="timeline-item">
                <div class="timeline-content">
                    <div>${item.text}</div>
                    <span class="timeline-time">${timeAgo(item.time)}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function timeAgo(date) {
    const s = Math.floor((new Date() - date) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

function showLoading() {
    const h = document.getElementById('unified-heatmap');
    if (h) h.innerHTML = '<p class="text-muted">Loading...</p>';
}

document.addEventListener('DOMContentLoaded', initActivity);
