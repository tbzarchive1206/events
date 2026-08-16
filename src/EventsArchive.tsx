import { useEffect, useMemo, useState } from "react";

type RawNode = { id: string; name: string; mimeType: string; type: "file" | "folder"; size?: string | null; path: string[] };
export type RawArchive = { generatedAt: string; sourceFolderId: string; nodes: RawNode[] };
type MediaKind = "video" | "image" | "audio" | "other";
type Media = RawNode & { kind: MediaKind };
type ArchiveEvent = { id: string; title: string; date: string; year: number; month: number; members: string[]; media: Media[] };

const pageSize = 24;
const memberOrder = ["SANGYEON", "JACOB", "YOUNGHOON", "HYUNJAE", "JUYEON", "KEVIN", "Q", "SUNWOO", "ERIC", "HAKNYEON", "NEW"];
const memberPatterns: [string, RegExp][] = [
  ["SANGYEON", /SANGYEON|상연/iu], ["JACOB", /JACOB|제이콥/iu], ["YOUNGHOON", /YOUNGHOON|영훈/iu],
  ["HYUNJAE", /HYUNJAE|현재/iu], ["JUYEON", /JUYEON|주연/iu], ["KEVIN", /KEVIN|케빈/iu],
  ["Q", /(?:^|[^A-Z])Q(?:[^A-Z]|$)|CHANGMIN|창민|큐/iu], ["SUNWOO", /SUNWOO|선우/iu], ["ERIC", /ERIC|에릭/iu],
  ["HAKNYEON", /HAKNYEON|JUHAKNYEON|학년/iu], ["NEW", /(?:^|[^A-Z])NEW(?:[^A-Z]|$)|CHANHEE|찬희|(?:^|[^\p{L}\p{N}])뉴(?:[^\p{L}\p{N}]|$)/iu],
];
const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

const normalize = (value = "") => value.normalize("NFKD").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const cleanTitle = (value: string) => value.replace(/^\s*\d{6}\s*/u, "").trim();
const dateCode = (value: string) => value.match(/^\s*([12]\d{5})(?=\D|$)/u)?.[1] || "";
const membersOf = (value: string) => memberPatterns.filter(([, pattern]) => pattern.test(value)).map(([member]) => member);
const displayMember = (value: string) => value === "HAKNYEON" ? "HAKNYEON (2017–2025)" : value === "NEW" ? "NEW (2017–2026)" : value;
const formatDate = (value: string) => value ? `20${value.slice(0, 2)}.${value.slice(2, 4)}.${value.slice(4, 6)}` : "DATE UNKNOWN";
const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${encodeURIComponent(id)}`;
const fileUrl = (id: string) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;
const downloadUrl = (id: string) => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
const thumbnailUrl = (id: string) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`;
const kindOf = (mime = ""): MediaKind => mime.startsWith("video/") ? "video" : mime.startsWith("image/") ? "image" : mime.startsWith("audio/") ? "audio" : "other";

function buildEvents(data: RawArchive): ArchiveEvent[] {
  return data.nodes
    .filter((node) => node.type === "folder" && node.path.length === 1)
    .map((folder) => {
      const media = data.nodes
        .filter((node) => node.type === "file" && node.path[1] === folder.name)
        .map((node) => ({ ...node, kind: kindOf(node.mimeType) }));
      const date = dateCode(folder.name);
      return {
        id: folder.id,
        title: cleanTitle(folder.name),
        date,
        year: date ? 2000 + Number(date.slice(0, 2)) : 0,
        month: date ? Number(date.slice(2, 4)) : 0,
        members: membersOf(`${folder.name} ${media.map((item) => item.name).join(" ")}`),
        media,
      };
    })
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));
}

function representative(event: ArchiveEvent) {
  return event.media.find((item) => item.kind === "image") || event.media.find((item) => item.kind === "video") || null;
}

function DriveThumbnail({ id, label }: { id?: string; label: string }) {
  const [failed, setFailed] = useState(!id);
  if (failed || !id) return <span className="generated-thumbnail" role="img" aria-label={`Generated preview: ${label}`}><span>{label}</span></span>;
  return <img src={thumbnailUrl(id)} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

function MediaTile({ media }: { media: Media }) {
  const visual = media.kind === "image" || media.kind === "video";
  return <figure className={`media-tile ${media.kind}-tile`}>
    <a className="media-visual" href={fileUrl(media.id)} target="_blank" rel="noreferrer">
      {visual ? <DriveThumbnail id={media.id} label={media.name} /> : <DriveThumbnail label={media.name} />}
      {media.kind === "video" && <span className="play-mark">VIDEO / GOOGLE DRIVE ↗</span>}
    </a>
    <div className="image-actions"><span className="file-name" title={media.name}>{media.name}</span><span className="file-action-links"><a href={fileUrl(media.id)} target="_blank" rel="noreferrer">VIEW ↗</a><a href={downloadUrl(media.id)} target="_blank" rel="noreferrer">DOWNLOAD ↓</a></span></div>
  </figure>;
}

function EventCard({ event, open }: { event: ArchiveEvent; open: () => void }) {
  const cover = representative(event);
  const firstVideo = event.media.find((item) => item.kind === "video");
  return <article className="card">
    <button className="thumb" onClick={open} aria-label={`Open ${event.title}`}>
      <DriveThumbnail id={cover?.id} label={event.title} />
      <span className="number">{formatDate(event.date)}</span><span className="photo-count">{event.media.length} FILES</span>
    </button>
    <div className="card-info"><span className="eyebrow">{event.members.map(displayMember).join(" · ") || "THE BOYZ EVENT"}</span><h2>{event.title}</h2>
      <div className="meta"><span>YEAR</span><strong>{event.year || "—"}</strong><span>MONTH</span><strong>{event.month ? monthNames[event.month - 1] : "—"}</strong><span>MEDIA</span><strong>{event.media.length} FILES</strong></div>
      <div className="card-actions">{firstVideo && <a href={fileUrl(firstVideo.id)} target="_blank" rel="noreferrer">WATCH ↗</a>}<button onClick={open}>OPEN EVENT →</button></div>
    </div>
  </article>;
}

function parseEventId() { return location.hash.match(/^#\/?event\/([^/]+)/u)?.[1] || ""; }

export function EventsArchive({ data }: { data: RawArchive }) {
  const events = useMemo(() => buildEvents(data), [data]);
  const [selectedId, setSelectedId] = useState(parseEventId);
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [sort, setSort] = useState("desc");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [shown, setShown] = useState(pageSize);
  useEffect(() => { const change = () => { setSelectedId(parseEventId()); window.scrollTo({ top: 0, behavior: "smooth" }); }; window.addEventListener("hashchange", change); return () => window.removeEventListener("hashchange", change); }, []);

  const selectedEvent = events.find((event) => event.id === selectedId);
  const years = [...new Set(events.map((event) => event.year).filter(Boolean))].sort((a, b) => b - a);
  const months = [...new Set(events.filter((event) => yearFilter === "all" || String(event.year) === yearFilter).map((event) => event.month).filter(Boolean))].sort((a, b) => b - a);
  const availableMembers = memberOrder.filter((member) => events.some((event) => event.members.includes(member)));
  const tokens = normalize(query).split(" ").filter(Boolean);
  const filtered = events.filter((event) => {
    if (yearFilter !== "all" && String(event.year) !== yearFilter) return false;
    if (monthFilter !== "all" && String(event.month) !== monthFilter) return false;
    if (memberFilter !== "all" && !event.members.includes(memberFilter)) return false;
    const haystack = normalize([event.date, formatDate(event.date), event.title, ...event.media.map((item) => item.name)].join(" "));
    return tokens.every((token) => haystack.includes(token));
  }).sort((a, b) => sort === "asc" ? (a.date || "").localeCompare(b.date || "") : (b.date || "").localeCompare(a.date || ""));
  const totalMedia = events.reduce((sum, event) => sum + event.media.length, 0);

  const openEvent = (event: ArchiveEvent) => { location.hash = `event/${event.id}`; setMediaFilter("all"); };
  const goHome = () => { location.hash = "home"; setSelectedId(""); };

  if (selectedEvent) {
    const media = selectedEvent.media.filter((item) => mediaFilter === "all" || item.kind === mediaFilter);
    return <main id="top"><Header events={events.length} media={totalMedia} updated={data.generatedAt} />
      <section className="event-page"><header className="member-gallery-head"><button onClick={goHome}>← ALL EVENTS</button><div><span>{formatDate(selectedEvent.date)} / EVENT</span><h2>{selectedEvent.title}</h2></div><a href={folderUrl(selectedEvent.id)} target="_blank" rel="noreferrer">OPEN FOLDER ↗</a></header>
        <div className="member-filters"><label>MEDIA TYPE<select value={mediaFilter} onChange={(event) => setMediaFilter(event.target.value)}><option value="all">ALL MEDIA</option><option value="video">VIDEO</option><option value="image">PHOTOS</option><option value="audio">AUDIO</option><option value="other">OTHER FILES</option></select></label><div className="blank-filter" /><p>{media.length} RESULTS</p></div>
        <div className="member-period"><p>MEDIA GALLERY</p><span>GOOGLE DRIVE SOURCE</span></div>
        {media.length ? <div className="media-grid">{media.map((item) => <MediaTile key={item.id} media={item} />)}</div> : <div className="empty"><strong>NO MEDIA</strong>THIS EVENT FOLDER IS CURRENTLY EMPTY.</div>}
      </section><Footer sourceId={data.sourceFolderId} /></main>;
  }

  return <main id="top"><Header events={events.length} media={totalMedia} updated={data.generatedAt} />
    <section className="controls"><div className="search"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setShown(pageSize); }} placeholder="SEARCH EVENT TITLE OR YYMMDD DATE…" aria-label="Search archive" />{query && <button className="clear" onClick={() => setQuery("")}>CLEAR</button>}</div>
      <div className="filter-row events-filter-row"><label>YEAR<select value={yearFilter} onChange={(event) => { const value = event.target.value; setYearFilter(value); if (value !== "all" && !events.some((item) => String(item.year) === value && String(item.month) === monthFilter)) setMonthFilter("all"); setShown(pageSize); }}><option value="all">ALL YEARS</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label><label>MONTH<select value={monthFilter} onChange={(event) => { setMonthFilter(event.target.value); setShown(pageSize); }}><option value="all">ALL MONTHS</option>{months.map((month) => <option key={month} value={month}>{String(month).padStart(2, "0")} · {monthNames[month - 1]}</option>)}</select></label><label>MEMBER<select value={memberFilter} onChange={(event) => { setMemberFilter(event.target.value); setShown(pageSize); }}><option value="all">ALL MEMBERS</option>{availableMembers.map((member) => <option key={member} value={member}>{displayMember(member)}</option>)}</select></label><label>SORT<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="desc">NEWEST FIRST</option><option value="asc">OLDEST FIRST</option></select></label></div>
    </section>
    <section className="archive-section"><div className="results-head"><p>{filtered.length} EVENTS · {query ? "SEARCH RESULTS" : "ARCHIVE"}</p><a href={folderUrl(data.sourceFolderId)} target="_blank" rel="noreferrer">OPEN SOURCE FOLDER ↗</a></div>{filtered.length ? <div className="cards">{filtered.slice(0, shown).map((event) => <EventCard key={event.id} event={event} open={() => openEvent(event)} />)}</div> : <div className="empty"><strong>NO RESULTS</strong>TRY AN EVENT TITLE OR YYMMDD DATE.</div>}{shown < filtered.length && <button className="load-more" onClick={() => setShown((value) => value + pageSize)}>LOAD MORE EVENTS ↓</button>}</section>
    <Footer sourceId={data.sourceFolderId} /></main>;
}

function Header({ events, media, updated }: { events: number; media: number; updated: string }) {
  return <header className="masthead"><div className="utility"><a className="brand" href="https://tbzarchive.com">THE BOYZ / FAN ARCHIVE</a><nav><span>EVENTS</span><span>/</span><a href="https://x.com/tbzarchive1206_" target="_blank" rel="noreferrer">TWITTER ↗</a></nav></div><a href="#home"><h1><span className="solid">EVENTS</span><span className="outline">ARCHIVE</span></h1></a><div className="stats"><p><strong>{events}</strong> EVENTS</p><i /><p><strong>{media.toLocaleString("en-US")}</strong> MEDIA FILES</p><i /><p>UPDATED <strong>{new Date(updated).toLocaleDateString("en-GB")}</strong></p></div></header>;
}

function Footer({ sourceId }: { sourceId: string }) { return <footer><span>© THE BOYZ FAN ARCHIVE</span><a href={folderUrl(sourceId)} target="_blank" rel="noreferrer">SOURCE FOLDER ↗</a><a href="#top">BACK TO TOP ↑</a></footer>; }
