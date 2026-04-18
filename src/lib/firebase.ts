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
import { useBuilder } from "@/store/useBuilder";
import type {
  ChatMessage,
  Block,
  DesignSystem,
  BuilderMode,
  InterfaceType,
} from "@/store/useBuilder";

// ── Firebase config ─────────────────────────────────────────────────────────
// Fill these in from Firebase Console → Project Settings → Your Apps → Web App
// and set the corresponding NEXT_PUBLIC_FIREBASE_* vars in .env.local
const isConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

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
  designSystem: DesignSystem;
  mode: BuilderMode;
  density: string;
  interfaceType: InterfaceType;
  selectedComponents: string[];
  colorOverrides: Record<string, string>;
  /* Optional - the active template id so Regenerate-content knows
   * which prompt to send after a session reload. */
  activeTemplateId?: string | null;
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

  const messages = useBuilder((s) => s.messages);
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const designSystem = useBuilder((s) => s.designSystem);
  const mode = useBuilder((s) => s.mode);
  const density = useBuilder((s) => s.density);
  const interfaceType = useBuilder((s) => s.interfaceType);
  const selectedComponents = useBuilder((s) => s.selectedComponents);
  const colorOverrides = useBuilder((s) => s.colorOverrides);
  const activeTemplateId = useBuilder((s) => s.activeTemplateId);

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
      const projectSnapshot: ProjectSnapshot = {
        messages,
        blocks,
        headerBlocks,
        sidebarBlocks,
        footerBlocks,
        designSystem,
        mode,
        density,
        interfaceType,
        selectedComponents,
        colorOverrides,
        activeTemplateId,
      };

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
    const { snapshot } = project;
    useBuilder.setState({
      messages: snapshot.messages,
      blocks: snapshot.blocks,
      headerBlocks: snapshot.headerBlocks ?? [],
      sidebarBlocks: snapshot.sidebarBlocks ?? [],
      footerBlocks: snapshot.footerBlocks ?? [],
      designSystem: snapshot.designSystem,
      mode: snapshot.mode,
      density: snapshot.density,
      interfaceType: snapshot.interfaceType,
      selectedComponents: snapshot.selectedComponents,
      colorOverrides: snapshot.colorOverrides,
      activeTemplateId: snapshot.activeTemplateId ?? null,
      hasOverrides: Object.keys(snapshot.colorOverrides).length > 0,
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
