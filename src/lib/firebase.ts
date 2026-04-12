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
  getDocs,
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
  designSystem: DesignSystem;
  mode: BuilderMode;
  density: string;
  interfaceType: InterfaceType;
  selectedComponents: string[];
  colorOverrides: Record<string, string>;
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

  const {
    messages,
    blocks,
    designSystem,
    mode,
    density,
    interfaceType,
    selectedComponents,
    colorOverrides,
  } = useBuilder();

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

  async function saveProject(name: string): Promise<string> {
    if (!isConfigured) {
      setError("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* vars to .env.local.");
      throw new Error("Firebase not configured");
    }
    setSaving(true);
    setError(null);
    try {
      const { db } = getFirebaseInstances();
      const u = await ensureAuth();
      const snapshot: ProjectSnapshot = {
        messages,
        blocks,
        designSystem,
        mode,
        density,
        interfaceType,
        selectedComponents,
        colorOverrides,
      };
      const ref = await addDoc(collection(db, "projects"), {
        uid: u.uid,
        name,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        snapshot,
      });
      await fetchProjects(u.uid);
      return ref.id;
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
      designSystem: snapshot.designSystem,
      mode: snapshot.mode,
      density: snapshot.density,
      interfaceType: snapshot.interfaceType,
      selectedComponents: snapshot.selectedComponents,
      colorOverrides: snapshot.colorOverrides,
      hasOverrides: Object.keys(snapshot.colorOverrides).length > 0,
      onboardingStep: "ready",
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
