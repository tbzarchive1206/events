import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import archiveData from "../app/data/archive.generated.json";
import { EventsArchive, type RawArchive } from "./EventsArchive";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><EventsArchive data={archiveData as RawArchive} /></StrictMode>,
);
