import React, { useEffect, useMemo, useState } from "react";

// Dr. Dwayne Jackson Podcast — Live Ops Site
// Single‑file React app with editable sections, localStorage persistence, and weekly tooling.
// Styling uses Tailwind. No external data or backend required.

// ------------- Helpers
const STORAGE_KEY = "drjackson_podcast_live_ops_v1";

function clsx(...v) {
  return v.filter(Boolean).join(" ");
}

function fmtDateISO(d) {
  // Return YYYY-MM-DD
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextTuesday(fromDate) {
  const d = new Date(fromDate);
  const day = d.getDay(); // 0 Sun 1 Mon 2 Tue
  const diff = (9 - day) % 7; // days until next Tuesday, 0 if Tuesday → next week
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
  return d;
}

function toLocalMidnightISO(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return fmtDateISO(d);
}

// CSV and download helpers
function csvLine(arr) {
  return arr
    .map((v) => {
      const s = String(v ?? "");
      const q = s.replace(/"/g, '""');
      return `"${q}"`;
    })
    .join(",");
}
function downloadFile(name, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// ------------- Default Data
const defaultState = {
  podcast: {
    releaseTimeLocal: "00:00", // 12:00 AM local
    cadence: "TUESDAY",
    items: [
      {
        date: "2025-10-28",
        episodeNumber: "Teaser",
        length: "~3–5 min",
        content: "Series teaser and show promise",
        potentialGuest: "N/A",
      },
      {
        date: "2025-11-04",
        episodeNumber: "1",
        length: "45–60 min",
        content: "Peptides for men, science, safety, protocols",
        potentialGuest: "TBD",
      },
      {
        date: "2025-11-11",
        episodeNumber: "2",
        length: "45–60 min",
        content: "Peptides for women, science, safety, protocols",
        potentialGuest: "TBD",
      },
    ],
  },
  platforms: [
    // Per-episode tracking rows live here
    // { episodeNumber: "1", date: "2025-11-04", platform: "Spotify", views: 0, awt: "00:00:00" }
  ],
  thumbs: {
    variants: [
      // { id: "A", episodeNumber: "1", hypothesis: "Bold text close-up", status: "Planned", ctr: 0, notes: "" }
    ],
  },
  socials: {
    startDate: "2025-10-28",
    posts: [
      // { id, date: "2025-10-28", platform: "Instagram", time: "08:00", copy: "", asset: "", status: "Planned" }
    ],
    suggestedWindows: {
      Instagram: ["08:00", "12:00", "19:00"],
      Facebook: ["08:00", "12:00", "19:00"],
      TikTok: ["12:00", "20:00"],
      X: ["07:30", "12:30", "18:30"],
      Snapchat: ["15:00", "20:30"],
      YouTube: ["09:00", "17:00"],
    },
  },
};

// ------------- Persistence hook
function usePersistedState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
}

// ------------- UI Components
function Section({ title, subtitle, children, actions }) {
  return (
    <section className="mb-8">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="bg-white rounded-2xl shadow p-4 border border-gray-100">{children}</div>
    </section>
  );
}

function TextInput({ value, onChange, placeholder, className, ...rest }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(
        "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
        className
      )}
      {...rest}
    />
  );
}

function Select({ value, onChange, options, className }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500",
        className
      )}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function IconButton({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 active:translate-y-[1px]"
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, title, className }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        "inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 shadow",
        className
      )}
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={clsx("px-2 py-1 rounded-lg text-xs font-medium", tones[tone])}>{children}</span>
  );
}

// ------------- Main App
export default function App() {
  const [data, setData] = usePersistedState(STORAGE_KEY, defaultState);

  // Exporters scoped to state
  function exportJSONAll() {
    downloadFile("dr_dwayne_jackson_podcast_live_ops.json", JSON.stringify(data, null, 2));
  }
  function exportPlatformsCSV() {
    const header = [
      "episodeNumber",
      "date",
      "platform",
      "views",
      "averageWatchTime",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
    ];
    const rows = data.platforms.map((r) => [
      r.episodeNumber,
      r.date,
      r.platform,
      r.views,
      r.awt,
      r.utm_source || "",
      r.utm_medium || "",
      r.utm_campaign || "",
      r.utm_content || "",
    ]);
    const csv = [csvLine(header), ...rows.map(csvLine)].join("\n");
    downloadFile("platform_tracking.csv", csv);
  }
  function exportSocialsCSV() {
    const header = [
      "date",
      "platform",
      "time",
      "copy",
      "asset",
      "status",
      "link",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
    ];
    const rows = data.socials.posts.map((p) => [
      p.date,
      p.platform,
      p.time,
      p.copy,
      p.asset,
      p.status,
      p.link || "",
      p.utm_source || "",
      p.utm_medium || "",
      p.utm_campaign || "",
      p.utm_content || "",
    ]);
    const csv = [csvLine(header), ...rows.map(csvLine)].join("\n");
    downloadFile("social_calendar.csv", csv);
  }

  // Derived maps
  const episodeDatesByNumber = useMemo(() => {
    const m = new Map();
    data.podcast.items.forEach((it) => m.set(String(it.episodeNumber), it.date));
    return m;
  }, [data.podcast.items]);

  // ----- Handlers
  function addPodcastRow(prefillNext = false) {
    const items = [...data.podcast.items].sort((a, b) => a.date.localeCompare(b.date));
    let date = fmtDateISO(new Date());
    let episodeNumber = String(items.length + 1);
    if (prefillNext && items.length > 0) {
      const last = items[items.length - 1];
      date = fmtDateISO(nextTuesday(last.date));
      episodeNumber = isNaN(Number(last.episodeNumber))
        ? String(items.filter((i) => !isNaN(Number(i.episodeNumber))).length + 1)
        : String(Number(last.episodeNumber) + 1);
    }
    const newRow = {
      date,
      episodeNumber,
      length: "45–60 min",
      content: "",
      potentialGuest: "",
    };
    setData({ ...data, podcast: { ...data.podcast, items: [...data.podcast.items, newRow] } });
  }

  function updatePodcastItem(idx, patch) {
    const items = data.podcast.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setData({ ...data, podcast: { ...data.podcast, items } });
  }

  function deletePodcastItem(idx) {
    const items = data.podcast.items.filter((_, i) => i !== idx);
    setData({ ...data, podcast: { ...data.podcast, items } });
  }

  function addPlatformRow(epNum = "", platform = "Spotify") {
    const ep = epNum || String(data.podcast.items.find((i) => !isNaN(Number(i.episodeNumber)))?.episodeNumber || "1");
    setData({
      ...data,
      platforms: [
        ...data.platforms,
        {
          episodeNumber: String(ep),
          date: episodeDatesByNumber.get(String(ep)) || fmtDateISO(new Date()),
          platform,
          views: 0,
          awt: "00:00:00",
        },
      ],
    });
  }

  function updatePlatformRow(idx, patch) {
    const rows = data.platforms.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setData({ ...data, platforms: rows });
  }

  function deletePlatformRow(idx) {
    const rows = data.platforms.filter((_, i) => i !== idx);
    setData({ ...data, platforms: rows });
  }

  function addThumbVariant() {
    const letter = String.fromCharCode(65 + data.thumbs.variants.length); // A, B, C...
    const v = {
      id: letter,
      episodeNumber: "1",
      hypothesis: "",
      status: "Planned",
      ctr: 0,
      notes: "",
    };
    setData({ ...data, thumbs: { ...data.thumbs, variants: [...data.thumbs.variants, v] } });
  }

  function updateThumbVariant(idx, patch) {
    const variants = data.thumbs.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    setData({ ...data, thumbs: { ...data.thumbs, variants } });
  }

  function deleteThumbVariant(idx) {
    const variants = data.thumbs.variants.filter((_, i) => i !== idx);
    setData({ ...data, thumbs: { ...data.thumbs, variants } });
  }

  function addSocialPostsForWeek(startDate) {
    // Generate one suggested post per platform using suggested windows
    const platforms = Object.keys(data.socials.suggestedWindows);
    const base = new Date(startDate);
    // create 7 days starting at base
    const posts = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const date = fmtDateISO(d);
      platforms.forEach((pf) => {
        const windows = data.socials.suggestedWindows[pf];
        const time = windows[i % windows.length];
        posts.push({
          id: `${date}_${pf}`,
          date,
          platform: pf,
          time,
          copy: "",
          asset: "",
          status: "Planned",
        });
      });
    }
    setData({ ...data, socials: { ...data.socials, posts: [...data.socials.posts, ...posts] } });
  }

  function updateSocialPost(id, patch) {
    const posts = data.socials.posts.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setData({ ...data, socials: { ...data.socials, posts } });
  }

  function deleteSocialPost(id) {
    const posts = data.socials.posts.filter((p) => p.id !== id);
    setData({ ...data, socials: { ...data.socials, posts } });
  }

  // On first load, normalize dates to local midnight and fix typographical issues
  useEffect(() => {
    // Optimization corrections: enforce local midnight release time for all dates
    const normalized = data.podcast.items.map((it) => ({ ...it, date: toLocalMidnightISO(it.date) }));
    if (JSON.stringify(normalized) !== JSON.stringify(data.podcast.items)) {
      setData({ ...data, podcast: { ...data.podcast, items: normalized } });
    }
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dr. Dwayne Jackson Podcast, Live Ops</h1>
          <div className="flex items-center gap-2">
            <Badge tone="green">Releases at 12:00 AM Local</Badge>
            <Badge tone="blue">Cadence, Tuesdays</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Podcast release log */}
        <Section
          title="Podcast Releases"
          subtitle="Dates, episode numbers, length, content focus, and potential guest."
          actions={
            <div className="flex gap-2">
              <IconButton onClick={() => addPodcastRow(true)} title="Add next Tuesday row">
                <span>➕</span>
                <span>Add Next Tuesday</span>
              </IconButton>
              <IconButton onClick={() => addPodcastRow(false)} title="Add blank row">
                <span>➕</span>
                <span>Add Blank</span>
              </IconButton>
            </div>
          }
        >
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Episode #</th>
                  <th className="py-2 pr-4">Length</th>
                  <th className="py-2 pr-4">Content</th>
                  <th className="py-2 pr-4">Potential Guest</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.podcast.items
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-2 pr-4 w-36">
                        <TextInput
                          value={row.date}
                          onChange={(v) => updatePodcastItem(idx, { date: v })}
                          placeholder="YYYY-MM-DD"
                        />
                      </td>
                      <td className="py-2 pr-4 w-28">
                        <TextInput
                          value={row.episodeNumber}
                          onChange={(v) => updatePodcastItem(idx, { episodeNumber: v })}
                          placeholder="#"
                        />
                      </td>
                      <td className="py-2 pr-4 w-32">
                        <TextInput
                          value={row.length}
                          onChange={(v) => updatePodcastItem(idx, { length: v })}
                          placeholder="e.g., 45–60 min"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <TextInput
                          value={row.content}
                          onChange={(v) => updatePodcastItem(idx, { content: v })}
                          placeholder="Topic focus"
                        />
                      </td>
                      <td className="py-2 pr-4 w-48">
                        <TextInput
                          value={row.potentialGuest}
                          onChange={(v) => updatePodcastItem(idx, { potentialGuest: v })}
                          placeholder="Guest"
                        />
                      </td>
                      <td className="py-2 pr-4 w-40">
                        <div className="flex gap-2">
                          <IconButton onClick={() => deletePodcastItem(idx)} title="Delete">
                            <span>🗑️</span>
                            <span>Delete</span>
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Optimization, all releases default to 12:00 AM in the local time zone. Tuesdays are enforced by tooling when you add the next row.
          </div>
        </Section>

        {/* Platform tracking */}
        <Section
          title="Platform Tracking"
          subtitle="Episode performance by platform, date, views, and average watch time."
          actions={
            <div className="flex gap-2">
              <PrimaryButton onClick={() => addPlatformRow()} title="Add row for next episode">
                Add Row
              </PrimaryButton>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Quick add by episode</label>
              <TextInput
                placeholder="Episode #"
                value={""}
                onChange={() => {}}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = e.currentTarget.value.trim();
                    addPlatformRow(val || undefined);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
            <div className="md:col-span-4 flex items-end">
              <div className="text-xs text-slate-500">Tip, views is platform native plays, AWT in HH:MM:SS.</div>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-4">Episode #</th>
                  <th className="py-2 pr-4">Release Date</th>
                  <th className="py-2 pr-4">Platform</th>
                  <th className="py-2 pr-4">Episode Views</th>
                  <th className="py-2 pr-4">Average Watch Time</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.platforms.map((r, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2 pr-4 w-28">
                      <TextInput
                        value={r.episodeNumber}
                        onChange={(v) => updatePlatformRow(idx, { episodeNumber: v })}
                      />
                    </td>
                    <td className="py-2 pr-4 w-36">
                      <TextInput value={r.date} onChange={(v) => updatePlatformRow(idx, { date: v })} />
                    </td>
                    <td className="py-2 pr-4 w-44">
                      <Select
                        value={r.platform}
                        onChange={(v) => updatePlatformRow(idx, { platform: v })}
                        options={["Spotify", "Apple Podcasts", "iHeartPodcasts", "YouTube", "Amazon Music", "RSS"]}
                      />
                    </td>
                    <td className="py-2 pr-4 w-32">
                      <TextInput
                        value={String(r.views)}
                        onChange={(v) => updatePlatformRow(idx, { views: Number(v.replace(/\D/g, "")) || 0 })}
                      />
                    </td>
                    <td className="py-2 pr-4 w-36">
                      <TextInput value={r.awt} onChange={(v) => updatePlatformRow(idx, { awt: v })} />
                    </td>
                    <td className="py-2 pr-4 w-40">
                      <IconButton onClick={() => deletePlatformRow(idx)} title="Delete">
                        <span>🗑️</span>
                        <span>Delete</span>
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Thumbnails and testing */}
        <Section
          title="Thumbnails and Testing"
          subtitle="Create variants, track status, and measure CTR."
          actions={<PrimaryButton onClick={addThumbVariant}>New Variant</PrimaryButton>}
        >
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Episode #</th>
                  <th className="py-2 pr-4">Hypothesis</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">CTR %</th>
                  <th className="py-2 pr-4">Notes</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.thumbs.variants.map((v, idx) => (
                  <tr key={v.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 w-16"><Badge tone="purple">{v.id}</Badge></td>
                    <td className="py-2 pr-4 w-24">
                      <TextInput value={v.episodeNumber} onChange={(x) => updateThumbVariant(idx, { episodeNumber: x })} />
                    </td>
                    <td className="py-2 pr-4">
                      <TextInput value={v.hypothesis} onChange={(x) => updateThumbVariant(idx, { hypothesis: x })} />
                    </td>
                    <td className="py-2 pr-4 w-40">
                      <Select
                        value={v.status}
                        onChange={(x) => updateThumbVariant(idx, { status: x })}
                        options={["Planned", "In Test", "Winner", "Retired"]}
                      />
                    </td>
                    <td className="py-2 pr-4 w-24">
                      <TextInput
                        value={String(v.ctr)}
                        onChange={(x) => updateThumbVariant(idx, { ctr: Number(x.replace(/[^0-9.]/g, "")) || 0 })}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <TextInput value={v.notes} onChange={(x) => updateThumbVariant(idx, { notes: x })} />
                    </td>
                    <td className="py-2 pr-4 w-40">
                      <IconButton onClick={() => deleteThumbVariant(idx)} title="Delete">
                        <span>🗑️</span>
                        <span>Delete</span>
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Socials calendar */}
        <Section
          title="Social Calendar"
          subtitle="Posting plan and optimization across Instagram, Facebook, TikTok, X, Snapchat, YouTube."
          actions={
            <div className="flex gap-2">
              <IconButton onClick={() => addSocialPostsForWeek(data.socials.startDate)}>
                <span>➕</span>
                <span>Generate Week From Start</span>
              </IconButton>
              <IconButton onClick={() => addSocialPostsForWeek(fmtDateISO(new Date()))}>
                <span>➕</span>
                <span>Generate Week From Today</span>
              </IconButton>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Calendar start date</label>
              <TextInput
                value={data.socials.startDate}
                onChange={(v) => setData({ ...data, socials: { ...data.socials, startDate: v } })}
              />
            </div>
            <div className="md:col-span-3 text-xs text-slate-500 flex items-end">
              Suggested windows are prefilled per platform. Edit per post as needed.
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Platform</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Copy</th>
                  <th className="py-2 pr-4">Asset</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.socials.posts
                  .slice()
                  .sort((a, b) => (a.date + a.platform).localeCompare(b.date + b.platform))
                  .map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 w-36">
                        <TextInput value={p.date} onChange={(v) => updateSocialPost(p.id, { date: v })} />
                      </td>
                      <td className="py-2 pr-4 w-40">
                        <Select
                          value={p.platform}
                          onChange={(v) => updateSocialPost(p.id, { platform: v })}
                          options={["Instagram", "Facebook", "TikTok", "X", "Snapchat", "YouTube"]}
                        />
                      </td>
                      <td className="py-2 pr-4 w-28">
                        <TextInput value={p.time} onChange={(v) => updateSocialPost(p.id, { time: v })} />
                      </td>
                      <td className="py-2 pr-4">
                        <TextInput value={p.copy} onChange={(v) => updateSocialPost(p.id, { copy: v })} />
                      </td>
                      <td className="py-2 pr-4 w-40">
                        <TextInput value={p.asset} onChange={(v) => updateSocialPost(p.id, { asset: v })} />
                      </td>
                      <td className="py-2 pr-4 w-40">
                        <Select
                          value={p.status}
                          onChange={(v) => updateSocialPost(p.id, { status: v })}
                          options={["Planned", "Scheduled", "Posted", "Needs Asset"]}
                        />
                      </td>
                      <td className="py-2 pr-4 w-40">
                        <IconButton onClick={() => deleteSocialPost(p.id)} title="Delete">
                          <span>🗑️</span>
                          <span>Delete</span>
                        </IconButton>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Utilities, UTM and Metadata Editors */}
        <Section
          title="Utilities"
          subtitle="Export or import and quick UTM helpers."
          actions={
            <div className="flex gap-2">
              <IconButton onClick={exportJSONAll} title="Export JSON">💾 Export JSON</IconButton>
              <IconButton onClick={exportPlatformsCSV} title="Export platforms CSV">⬇️ Platforms CSV</IconButton>
              <IconButton onClick={exportSocialsCSV} title="Export socials CSV">⬇️ Socials CSV</IconButton>
            </div>
          }
        >
          <div className="text-sm text-slate-600">Use the buttons above to download data for Sheets or BI dashboards.</div>
        </Section>

        <Section
          title="Episode Metadata Editor"
          subtitle="Tags and guest booking status for each release."
        >
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Episode #</th>
                  <th className="py-2 pr-4">Tags</th>
                  <th className="py-2 pr-4">Guest Booking</th>
                </tr>
              </thead>
              <tbody>
                {data.podcast.items
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((row, idx) => (
                    <tr key={`meta_${idx}`} className="border-b last:border-0">
                      <td className="py-2 pr-4 w-36">{row.date}</td>
                      <td className="py-2 pr-4 w-24">{row.episodeNumber}</td>
                      <td className="py-2 pr-4">
                        <TextInput
                          value={row.tags || ""}
                          onChange={(v) => updatePodcastItem(idx, { tags: v })}
                          placeholder="Comma separated"
                        />
                      </td>
                      <td className="py-2 pr-4 w-48">
                        <Select
                          value={row.guestBooking || "Planned"}
                          onChange={(v) => updatePodcastItem(idx, { guestBooking: v })}
                          options={["Planned","Invited","Confirmed","Recorded","N/A"]}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="UTM Builder, Platforms"
          subtitle="Edit UTM fields for platform rows without cluttering the main table."
        >
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-4">Ep</th>
                  <th className="py-2 pr-4">Platform</th>
                  <th className="py-2 pr-4">utm_source</th>
                  <th className="py-2 pr-4">utm_medium</th>
                  <th className="py-2 pr-4">utm_campaign</th>
                  <th className="py-2 pr-4">utm_content</th>
                </tr>
              </thead>
              <tbody>
                {data.platforms.map((r, idx) => (
                  <tr key={`utm_p_${idx}`} className="border-b last:border-0">
                    <td className="py-2 pr-4 w-20">{r.episodeNumber}</td>
                    <td className="py-2 pr-4 w-40">{r.platform}</td>
                    <td className="py-2 pr-4 w-40"><TextInput value={r.utm_source || ""} onChange={(v) => updatePlatformRow(idx, { utm_source: v })} /></td>
                    <td className="py-2 pr-4 w-40"><TextInput value={r.utm_medium || "podcast"} onChange={(v) => updatePlatformRow(idx, { utm_medium: v })} /></td>
                    <td className="py-2 pr-4 w-40"><TextInput value={r.utm_campaign || `ep${String(r.episodeNumber).toLowerCase()}`} onChange={(v) => updatePlatformRow(idx, { utm_campaign: v })} /></td>
                    <td className="py-2 pr-4 w-40"><TextInput value={r.utm_content || "default"} onChange={(v) => updatePlatformRow(idx, { utm_content: v })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="UTM Builder, Socials"
          subtitle="Set UTM and links for posts."
        >
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Platform</th>
                  <th className="py-2 pr-4">Link</th>
                  <th className="py-2 pr-4">utm_source</th>
                  <th className="py-2 pr-4">utm_medium</th>
                  <th className="py-2 pr-4">utm_campaign</th>
                  <th className="py-2 pr-4">utm_content</th>
                </tr>
              </thead>
              <tbody>
                {data.socials.posts.map((p) => (
                  <tr key={`utm_s_${p.id}`} className="border-b last:border-0">
                    <td className="py-2 pr-4 w-28">{p.date}</td>
                    <td className="py-2 pr-4 w-28">{p.platform}</td>
                    <td className="py-2 pr-4"><TextInput value={p.link || ""} onChange={(v) => updateSocialPost(p.id, { link: v })} /></td>
                    <td className="py-2 pr-4 w-32"><TextInput value={p.utm_source || p.platform?.toLowerCase() || ""} onChange={(v) => updateSocialPost(p.id, { utm_source: v })} /></td>
                    <td className="py-2 pr-4 w-32"><TextInput value={p.utm_medium || "social"} onChange={(v) => updateSocialPost(p.id, { utm_medium: v })} /></td>
                    <td className="py-2 pr-4 w-32"><TextInput value={p.utm_campaign || ""} onChange={(v) => updateSocialPost(p.id, { utm_campaign: v })} /></td>
                    <td className="py-2 pr-4 w-32"><TextInput value={p.utm_content || ""} onChange={(v) => updateSocialPost(p.id, { utm_content: v })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Footer tip */}
        <div className="text-xs text-slate-500 mt-8">
          Edits are saved in your browser. Use Add Next Tuesday to extend the release log. All dates are stored as YYYY-MM-DD at local midnight.
        </div>
      </main>
    </div>
  );
}
