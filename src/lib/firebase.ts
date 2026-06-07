"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { useBuilder, flushActiveBody, isMultiPage } from "@/store/useBuilder";
import { migrateBlocks } from "./blockMigrations";
import type {
  ChatMessage,
  Block,
  DesignSystem,
  BuilderMode,
  InterfaceType,
  ZoneLayout,
  ZoneId,
  Page,
} from "@/store/useBuilder";

// ── Firebase config ─────────────────────────────────────────────────────────
// Fill these in from Firebase Console → Project Settings → Your Apps → Web App
// and set the corresponding NEXT_PUBLIC_FIREBASE_* vars in .env.local
/* Exported so modules that don't use the full hook (useAutoSave) can
   short-circuit save attempts instead of waiting for saveProject to throw. */
export const isFirebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
const isConfigured = isFirebaseConfigured;

function getFirebaseInstances() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return { auth: getAuth(app), db: getFirestore(app) };
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface ProjectSnapshot {
  messages: ChatMessage[];
  blocks: Block[];
  /* Zone blocks - added v2 so auto-save can restore the full layout.
   * Optional so older Firestore docs (pre-v2) still deserialize cleanly. */
  headerBlocks?: Block[];
  sidebarBlocks?: Block[];
  footerBlocks?: Block[];
  /* Zone layout configs (flex/grid/stack + gap + wrap + padding).
     Added with the flexbox layout system; optional so older docs
     still deserialize - loadProject falls back to the store's
     default zoneLayouts when absent. */
  zoneLayouts?: Record<ZoneId, ZoneLayout>;
  designSystem: DesignSystem;
  mode: BuilderMode;
  density: string;
  interfaceType: InterfaceType;
  selectedComponents: string[];
  colorOverrides: Record<string, string>;
  /* Optional - the active template id so Regenerate-content knows
   * which prompt to send after a session reload. */
  activeTemplateId?: string | null;
  /* Multi-page (2026-06-07). LAZY-ADDITIVE: written ONLY for genuinely
   * multi-page canvases (pages.length > 1). Single-page docs omit these and
   * stay byte-identical to the pre-multi-page schema; `blocks` always carries
   * the active page's body so older clients still deserialize. */
  pages?: Page[];
  activePageId?: string | null;
}

/* Pure: build the Firestore snapshot from the current store state. Lazy-additive
   multi-page — only canvases with >1 page gain `pages`/`activePageId` (owner
   decision 2026-06-07). flushActiveBody syncs the live `blocks` mirror into the
   active page first, so an in-progress page edit is never lost to a stale copy. */
export function buildProjectSnapshot(s: ReturnType<typeof useBuilder.getState>): ProjectSnapshot {
  const snapshot: ProjectSnapshot = {
    messages: s.messages,
    blocks: s.blocks,
    headerBlocks: s.headerBlocks,
    sidebarBlocks: s.sidebarBlocks,
    footerBlocks: s.footerBlocks,
    zoneLayouts: s.zoneLayouts,
    designSystem: s.designSystem,
    mode: s.mode,
    density: s.density,
    interfaceType: s.interfaceType,
    selectedComponents: s.selectedComponents,
    colorOverrides: s.colorOverrides,
    activeTemplateId: s.activeTemplateId,
  };
  const flushed = flushActiveBody(s);
  if (isMultiPage(flushed.pages)) {
    snapshot.pages = flushed.pages;
    snapshot.activePageId = flushed.activePageId;
    /* Keep the legacy `blocks` field equal to the active page body so an old
       client (or the load path) still renders the right page. */
    snapshot.blocks = flushed.pages.find((p) => p.id === flushed.activePageId)?.body ?? s.blocks;
  }
  return snapshot;
}

/* Pure: derive the multi-page restore payload from a loaded snapshot, or null
   when the doc is single-page (leave the store lazy — seedPages handles it on
   first switch). Migrates each page body and guards a stale/absent activePageId
   by falling back to the first page. */
export function pagesRestoreFromSnapshot(
  snapshot: Pick<ProjectSnapshot, "pages" | "activePageId" | "blocks">,
  migrate: (b: Block[]) => Block[] = (b) => b,
): { pages: Page[]; activePageId: string } | null {
  if (!snapshot.pages || snapshot.pages.length === 0) return null;
  const pages = snapshot.pages.map((p) => ({ ...p, body: migrate(p.body ?? []) }));
  const activePageId =
    snapshot.activePageId && pages.some((p) => p.id === snapshot.activePageId)
      ? snapshot.activePageId
      : pages[0].id;
  return { pages, activePageId };
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  snapshot: ProjectSnapshot;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useCloudStorage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(isConfigured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* The canvas snapshot is built from useBuilder.getState() at save time (see
     buildProjectSnapshot) rather than from subscribed selectors — that keeps
     `blocks` and the multi-page `pages` consistent (read from one state object)
     and matches how useAutoSave already reads the store imperatively. */

  useEffect(() => {
    if (!isConfigured) return;
    const { auth } = getFirebaseInstances();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await fetchProjects(u.uid);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function ensureAuth(): Promise<User> {
    const { auth } = getFirebaseInstances();
    if (auth.currentUser) return auth.currentUser;
    const cred = await signInAnonymously(auth);
    return cred.user;
  }

  async function fetchProjects(uid: string) {
    try {
      const { db } = getFirebaseInstances();
      const q = query(
        collection(db, "projects"),
        where("uid", "==", uid),
        orderBy("updatedAt", "desc")
      );
      const snap = await getDocs(q);
      setProjects(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name as string,
          createdAt: (d.data().createdAt as Timestamp).toDate(),
          updatedAt: (d.data().updatedAt as Timestamp).toDate(),
          snapshot: d.data().snapshot as ProjectSnapshot,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch projects");
    }
  }

  /** Save or upsert a project.
   *
   *  - Called without `id`: creates a new Firestore doc via addDoc
   *    (legacy "Save as..." behaviour).
   *  - Called with `id`: upserts that id via setDoc, so repeated
   *    auto-saves update the same doc instead of creating duplicates.
   *
   *  When `refresh` is false (default true), skips the fetchProjects()
   *  round-trip - useful for high-frequency auto-saves where re-fetching
   *  the full list after every write is wasteful. */
  async function saveProject(
    name: string,
    opts?: { id?: string; refresh?: boolean }
  ): Promise<string> {
    if (!isConfigured) {
      setError("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* vars to .env.local.");
      throw new Error("Firebase not configured");
    }
    setSaving(true);
    setError(null);
    try {
      const { db } = getFirebaseInstances();
      const u = await ensureAuth();
      const projectSnapshot = buildProjectSnapshot(useBuilder.getState());

      let savedId: string;
      if (opts?.id) {
        /* Upsert path: preserve createdAt on updates by reading existing
         *  doc first, else stamp a fresh createdAt. */
        const ref = doc(db, "projects", opts.id);
        const existing = await getDoc(ref);
        const createdAt = existing.exists()
          ? (existing.data()?.createdAt as Timestamp | undefined) ?? Timestamp.now()
          : Timestamp.now();
        await setDoc(ref, {
          uid: u.uid,
          name,
          createdAt,
          updatedAt: Timestamp.now(),
          snapshot: projectSnapshot,
        });
        savedId = opts.id;
      } else {
        const ref = await addDoc(collection(db, "projects"), {
          uid: u.uid,
          name,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          snapshot: projectSnapshot,
        });
        savedId = ref.id;
      }

      if (opts?.refresh !== false) {
        await fetchProjects(u.uid);
      }
      return savedId;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }

  function loadProject(project: SavedProject) {
    try {
      const { snapshot } = project;
      /* Default the nullable fields before use. A legacy/malformed snapshot
         can be missing colorOverrides entirely, and Object.keys(undefined)
         below would otherwise throw and crash the whole builder. */
      const colorOverrides = snapshot.colorOverrides ?? {};
      /* Multi-page restore (lazy-additive): a doc with >1 page restores its
         pages + active page; a single-page (legacy) doc resets to the lazy
         empty state so a prior multi-page session can't leak stale pages into
         this one. seedPages re-derives the single page on first switch. */
      const pagesRestore = pagesRestoreFromSnapshot(snapshot, migrateBlocks);
      /* When multi-page, blocks must equal the ACTIVE page's body (pagesRestore
         already migrated it). Sourcing blocks from pagesRestore — not the
         snapshot's legacy blocks field — keeps the store consistent even if
         activePageId fell back to the first page (blocks === pages[active].body),
         so a later page switch can't save the wrong body over a real page. */
      const restoredActiveBody = pagesRestore?.pages.find((p) => p.id === pagesRestore.activePageId)?.body;
      useBuilder.setState({
        messages: snapshot.messages ?? [],
        blocks: restoredActiveBody ?? migrateBlocks(snapshot.blocks ?? []),
        headerBlocks: migrateBlocks(snapshot.headerBlocks ?? []),
        sidebarBlocks: migrateBlocks(snapshot.sidebarBlocks ?? []),
        footerBlocks: migrateBlocks(snapshot.footerBlocks ?? []),
        pages: pagesRestore?.pages ?? [],
        activePageId: pagesRestore?.activePageId ?? null,
        /* Restore zone layouts if present in the snapshot; otherwise
           fall through to whatever the store currently holds (the
           default config). Pre-flex-layout sessions deserialize with
           the defaults, which visually match the old 3-col behaviour
           once colSpan → width translation runs. */
        ...(snapshot.zoneLayouts ? { zoneLayouts: snapshot.zoneLayouts } : {}),
        designSystem: snapshot.designSystem,
        mode: snapshot.mode,
        density: snapshot.density,
        interfaceType: snapshot.interfaceType,
        selectedComponents: snapshot.selectedComponents ?? [],
        colorOverrides,
        activeTemplateId: snapshot.activeTemplateId ?? null,
        hasOverrides: Object.keys(colorOverrides).length > 0,
        onboardingStep: "ready",
        /* Reattach the loaded project as the current session so subsequent
         *  auto-saves update it in place instead of forking a copy. */
        currentSessionId: project.id,
        sessionTitle: project.name,
        lastSavedAt: project.updatedAt.getTime(),
        saveState: 'saved',
        saveError: null,
        /* Drawers + pending flows should close when loading a session */
        sessionsDrawerOpen: false,
        templatesDrawerOpen: false,
        pendingTemplateId: null,
        pendingFirstMessage: null,
        selectedBlockId: null,
        selectedBlockZone: null,
        previewOpen: true,
      });
    } catch (e) {
      /* Never let one bad session take down the builder. Surface the failure
         via saveError and leave the current canvas untouched. */
      console.error("loadProject failed:", e);
      useBuilder.setState({
        saveState: 'error',
        saveError: "Couldn't open that session — it may be from an older version.",
        sessionsDrawerOpen: false,
      });
    }
  }

  async function deleteProject(id: string) {
    try {
      const { db } = getFirebaseInstances();
      await deleteDoc(doc(db, "projects", id));
      if (user) await fetchProjects(user.uid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return {
    user,
    projects,
    loading,
    saving,
    error,
    configured: isConfigured,
    saveProject,
    loadProject,
    deleteProject,
    refreshProjects: () =>
      user ? fetchProjects(user.uid) : Promise.resolve(),
  };
}
