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
                const commitMsg = event.payload.commits?.[0]?.message || 'Pushed commits';
                recentFeed.push({
                    type: 'commit',
                    repo: repo,
                    title: `Committed to ${repo}`,
                    desc: commitMsg,
                    time: new Date(event.created_at),
                    badge: 'Push',
                    badgeClass: 'badge-push'
                });
            } else if (event.type === 'PullRequestEvent') {
                markActive(dateStr);
                const action = event.payload.action;
                const prTitle = event.payload.pull_request?.title || 'Pull Request';
                // Only track open/close to avoid clutter
                if (action === 'opened' || action === 'closed') {
                    recentFeed.push({
                        type: 'pr',
                        repo: repo,
                        title: `${action === 'opened' ? 'Opened' : 'Closed'} PR in ${repo}`,
                        desc: prTitle,
                        time: new Date(event.created_at),
                        badge: action === 'opened' ? 'Open' : 'Closed',
                        badgeClass: action === 'opened' ? 'badge-open' : 'badge-merged'
                    });
                }
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
                type: 'leetcode',
                title: `Solved ${sub.title}`,
                desc: 'LeetCode Problem',
                time: date,
                badge: 'Medium', // API doesn't give difficulty, hardcoding for UI demo or assume Medium
                badgeClass: 'badge-lc'
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

    // Dedup
    const unique = [];
    const seen = new Set();
    for (const item of recentFeed) {
        const key = item.title + item.time.toISOString();
        if (!seen.has(key)) { seen.add(key); unique.push(item); }
    }

    const displayItems = unique.slice(0, 10);
    if (displayItems.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent activity.</p>';
        return;
    }

    let html = '<div class="timeline-feed">';
    displayItems.forEach(item => {
        // Define Icons based on type
        let iconHtml = '';
        if (item.type === 'pr') {
            iconHtml = `<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"></path></svg>`;
        } else if (item.type === 'commit') {
            iconHtml = `<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor"><path d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"></path></svg>`;
        } else if (item.type === 'leetcode') {
            // Updated LeetCode SVG - Proper centered and balanced
            iconHtml = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M13.483 0a1.374 1.374 0 0 0-.961.414l-9.774 9.774a1.362 1.362 0 0 0 0 1.927l9.774 9.774a1.362 1.362 0 0 0 1.927 0 1.362 1.362 0 0 0 0-1.927l-8.811-8.811 8.811-8.811A1.362 1.362 0 0 0 13.483 0zm4.27 4.27a1.362 1.362 0 0 0-.963.4l-7.387 7.387a1.362 1.362 0 0 0 0 1.927l7.387 7.387a1.362 1.362 0 0 0 1.927 0 1.362 1.362 0 0 0 0-1.927l-6.423-6.423 6.423-6.423a1.362 1.362 0 0 0-0.963-2.33z"/>
            </svg>`;
        }

        html += `
            <div class="timeline-item">
                <div class="activity-card card-type-${item.type}">
                    <div class="card-icon">
                        ${iconHtml}
                    </div>
                    <div class="card-content">
                        <div class="card-header">
                            <h4 class="card-title">${item.title}</h4>
                            <span class="card-badge ${item.badgeClass || ''}">${item.badge || ''}</span>
                        </div>
                        <p class="card-desc">${item.desc}</p>
                        <div class="card-meta">
                            <span>${timeAgo(item.time)}</span>
                           ${item.repo ? `<span>${item.repo}</span>` : ''} 
                        </div>
                    </div>
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
