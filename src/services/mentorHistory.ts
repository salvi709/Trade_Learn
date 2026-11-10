import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

export interface MentorAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}

export interface MentorMessage {
  id: string;
  sender: 'user' | 'mentor';
  text: string;
  time: string;
  createdAt: string;
  attachments?: MentorAttachment[];
  isEdited?: boolean;
}

export interface MentorConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  explanationMode?: 'eli15' | 'deep_dive';
}

// Storage helpers
function getStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    // Storage restricted
  }
  return null;
}

function getLocalConversations(uid: string): MentorConversation[] {
  const s = getStorage();
  if (!s) return [];
  try {
    const raw = s.getItem(`smll_mentor_convs_${uid}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // parse error
  }
  return [];
}

function setLocalConversations(uid: string, convs: MentorConversation[]): void {
  const s = getStorage();
  if (!s) return;
  try {
    s.setItem(`smll_mentor_convs_${uid}`, JSON.stringify(convs));
  } catch {
    // quota error
  }
}

function getLocalMessages(uid: string, convId: string): MentorMessage[] {
  const s = getStorage();
  if (!s) return [];
  try {
    const raw = s.getItem(`smll_mentor_msgs_${uid}_${convId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // parse error
  }
  return [];
}

function setLocalMessages(uid: string, convId: string, msgs: MentorMessage[]): void {
  const s = getStorage();
  if (!s) return;
  try {
    s.setItem(`smll_mentor_msgs_${uid}_${convId}`, JSON.stringify(msgs));
  } catch {
    // quota error
  }
}

function removeLocalConversation(uid: string, convId: string): void {
  const s = getStorage();
  if (!s) return;
  try {
    s.removeItem(`smll_mentor_msgs_${uid}_${convId}`);
  } catch {
    // ignore
  }
}

/**
 * Generate a clean, deterministic title from the user's first question.
 * Example: "What is a candlestick chart?" -> "What is a candlestick chart"
 * Max length: 42 chars or 7 words.
 */
export function generateConversationTitle(question: string): string {
  if (!question) return 'Market Conversation';
  const clean = question.replace(/[\r\n]+/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'Market Conversation';

  // Take first 7 words
  let title = words.slice(0, 7).join(' ');
  if (title.length > 42) {
    title = title.substring(0, 39).trim() + '...';
  } else {
    // Strip trailing punctuation like ?, !, .
    title = title.replace(/[?!.,;:—]+$/, '');
  }

  // Capitalize first character
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Check if the user is a real authenticated cloud user
 */
function isCloudUser(uid?: string): boolean {
  if (!uid) return false;
  return !uid.startsWith('local_') && uid !== 'guest';
}

/**
 * Fetch all conversations for a user, ordered by updatedAt descending.
 */
export async function fetchUserConversations(uid: string): Promise<MentorConversation[]> {
  const cached = getLocalConversations(uid);

  if (!isCloudUser(uid)) {
    return cached.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  try {
    const colRef = collection(db, 'users', uid, 'mentorConversations');
    const q = query(colRef, orderBy('updatedAt', 'desc'), limit(50));
    const snap = await Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Fetch conversations timeout')), 2000)
      ),
    ]);

    const remoteConvs: MentorConversation[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as MentorConversation;
      remoteConvs.push({
        id: docSnap.id,
        title: data.title || 'Market Conversation',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
        lastMessagePreview: data.lastMessagePreview || '',
        explanationMode: data.explanationMode || 'eli15',
      });
    });

    if (remoteConvs.length > 0) {
      setLocalConversations(uid, remoteConvs);
      return remoteConvs;
    }

    // If remote returned an empty array, it means user deleted all remote conversations
    setLocalConversations(uid, []);
    return [];
  } catch (error) {
    console.warn('Note: Using local cached conversations:', error);
    return cached;
  }
}

/**
 * Delete a single individual message from a conversation
 */
export async function deleteMentorMessage(
  uid: string,
  conversationId: string,
  messageId: string,
  currentMessages?: MentorMessage[]
): Promise<MentorMessage[]> {
  // Use provided currentMessages array if available, otherwise retrieve from storage cache
  const baseMsgs =
    currentMessages && currentMessages.length > 0
      ? currentMessages
      : getLocalMessages(uid, conversationId);

  const remaining = baseMsgs.filter((m) => m.id !== messageId);
  setLocalMessages(uid, conversationId, remaining);

  // Update conversation lastMessagePreview if needed
  const lastMsg = remaining[remaining.length - 1];
  const existingConvs = getLocalConversations(uid);
  const updatedConvs = existingConvs.map((c) => {
    if (c.id === conversationId) {
      return {
        ...c,
        lastMessagePreview: lastMsg ? lastMsg.text.substring(0, 70) : '',
        updatedAt: new Date().toISOString(),
      };
    }
    return c;
  });
  setLocalConversations(uid, updatedConvs);

  if (isCloudUser(uid)) {
    // Non-blocking fire-and-forget sync to Firestore with timeout safeguard
    Promise.race([
      (async () => {
        const msgDocRef = doc(
          db,
          'users',
          uid,
          'mentorConversations',
          conversationId,
          'messages',
          messageId
        );
        await deleteDoc(msgDocRef);
        await setDoc(
          doc(db, 'users', uid, 'mentorConversations', conversationId),
          {
            lastMessagePreview: lastMsg ? lastMsg.text.substring(0, 70) : '',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      })(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Cloud delete message timeout')), 1500)
      ),
    ]).catch((err) => {
      console.warn('Note on cloud message deletion:', err?.message || err);
    });
  }

  return remaining;
}


/**
 * Fetch all messages for a specific conversation, ordered chronologically.
 */
export async function fetchConversationMessages(
  uid: string,
  conversationId: string
): Promise<MentorMessage[]> {
  const cached = getLocalMessages(uid, conversationId);

  if (!isCloudUser(uid)) {
    return cached;
  }

  try {
    const colRef = collection(
      db,
      'users',
      uid,
      'mentorConversations',
      conversationId,
      'messages'
    );
    const q = query(colRef, orderBy('createdAt', 'asc'));
    const snap = await Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Fetch messages timeout')), 2000)
      ),
    ]);

    const remoteMsgs: MentorMessage[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as MentorMessage;
      remoteMsgs.push({
        id: docSnap.id,
        sender: data.sender || 'mentor',
        text: data.text || '',
        time: data.time || '',
        createdAt: data.createdAt || new Date().toISOString(),
        attachments: data.attachments || undefined,
        isEdited: !!data.isEdited,
      });
    });

    // Authoritatively synchronize remote messages to local cache so deleted messages stay deleted
    setLocalMessages(uid, conversationId, remoteMsgs);
    return remoteMsgs;
  } catch (error) {
    console.warn('Note: Using local cached messages for conversation:', error);
    return cached;
  }
}

/**
 * Create a new conversation doc.
 */
export async function createMentorConversation(
  uid: string,
  firstQuestion: string,
  explanationMode: 'eli15' | 'deep_dive' = 'eli15'
): Promise<MentorConversation> {
  const convId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();
  const title = generateConversationTitle(firstQuestion);

  const newConv: MentorConversation = {
    id: convId,
    title,
    createdAt: now,
    updatedAt: now,
    lastMessagePreview: firstQuestion.substring(0, 70),
    explanationMode,
  };

  // Update local cache immediately
  const existing = getLocalConversations(uid);
  setLocalConversations(uid, [newConv, ...existing]);

  if (isCloudUser(uid)) {
    void (async () => {
      try {
        const docRef = doc(db, 'users', uid, 'mentorConversations', convId);
        await setDoc(docRef, newConv);
      } catch (err) {
        console.warn('Could not persist new conversation to Firestore:', err);
      }
    })();
  }

  return newConv;
}

/**
 * Save a message into the conversation's subcollection and update conversation's updatedAt/lastMessagePreview.
 */
export async function saveMentorMessage(
  uid: string,
  conversationId: string,
  message: {
    id?: string;
    sender: 'user' | 'mentor';
    text: string;
    time: string;
    createdAt?: string;
    attachments?: MentorAttachment[];
    isEdited?: boolean;
  }
): Promise<MentorMessage> {
  const msgId = message.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = message.createdAt || new Date().toISOString();

  const fullMsg: MentorMessage = {
    id: msgId,
    sender: message.sender,
    text: message.text,
    time: message.time,
    createdAt: now,
    attachments: message.attachments,
    isEdited: message.isEdited,
  };

  // Update local messages cache
  const existingMsgs = getLocalMessages(uid, conversationId);
  const updatedMsgs = [...existingMsgs.filter((m) => m.id !== msgId), fullMsg];
  setLocalMessages(uid, conversationId, updatedMsgs);

  // Update conversation record
  const existingConvs = getLocalConversations(uid);
  const targetConv = existingConvs.find((c) => c.id === conversationId);
  const updatedConvs = existingConvs.map((c) => {
    if (c.id === conversationId) {
      return {
        ...c,
        updatedAt: now,
        lastMessagePreview: message.text.substring(0, 70),
      };
    }
    return c;
  });
  // Sort with most recent updated first
  updatedConvs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  setLocalConversations(uid, updatedConvs);

  if (isCloudUser(uid)) {
    void (async () => {
      try {
        const msgDocRef = doc(
          db,
          'users',
          uid,
          'mentorConversations',
          conversationId,
          'messages',
          msgId
        );
        const convDocRef = doc(db, 'users', uid, 'mentorConversations', conversationId);

        await setDoc(msgDocRef, fullMsg);
        await setDoc(
          convDocRef,
          {
            updatedAt: now,
            lastMessagePreview: message.text.substring(0, 70),
            title: targetConv?.title || 'Market Conversation',
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Could not persist mentor message to Firestore:', err);
      }
    })();
  }

  return fullMsg;
}

/**
 * Rename a conversation.
 */
export async function renameMentorConversation(
  uid: string,
  conversationId: string,
  newTitle: string
): Promise<void> {
  const cleanTitle = newTitle.trim() || 'Market Conversation';
  const now = new Date().toISOString();

  // Local cache
  const existingConvs = getLocalConversations(uid);
  const updatedConvs = existingConvs.map((c) => {
    if (c.id === conversationId) {
      return { ...c, title: cleanTitle, updatedAt: now };
    }
    return c;
  });
  setLocalConversations(uid, updatedConvs);

  if (isCloudUser(uid)) {
    try {
      const convDocRef = doc(db, 'users', uid, 'mentorConversations', conversationId);
      await setDoc(convDocRef, { title: cleanTitle, updatedAt: now }, { merge: true });
    } catch (err) {
      console.warn('Could not update conversation title in Firestore:', err);
    }
  }
}

/**
 * Delete a single conversation and all its nested messages.
 */
export async function deleteMentorConversation(
  uid: string,
  conversationId: string
): Promise<void> {
  // 1. Local cleanup immediately and synchronously
  const existingConvs = getLocalConversations(uid);
  setLocalConversations(
    uid,
    existingConvs.filter((c) => c.id !== conversationId)
  );
  removeLocalConversation(uid, conversationId);

  // 2. Cloud Firestore deletion: delete main conversation doc first so it vanishes from listing immediately
  if (isCloudUser(uid)) {
    try {
      const convDocRef = doc(db, 'users', uid, 'mentorConversations', conversationId);
      // Delete primary document first so queries immediately omit it
      await Promise.race([
        deleteDoc(convDocRef),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Delete conv doc timeout')), 2000)
        ),
      ]);

      // Clean up subcollection messages asynchronously in background
      void (async () => {
        try {
          const msgsCol = collection(
            db,
            'users',
            uid,
            'mentorConversations',
            conversationId,
            'messages'
          );
          const snap = await getDocs(msgsCol);
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.forEach((d) => batch.delete(d.ref));
            await batch.commit();
          }
        } catch (subErr) {
          console.warn('Subcollection cleanup note:', subErr);
        }
      })();
    } catch (err) {
      console.warn('Note on deleting conversation in Firestore:', err);
    }
  }
}

/**
 * Clear all conversations and messages for a user.
 */
export async function clearAllMentorConversations(uid: string): Promise<void> {
  const existingConvs = getLocalConversations(uid);
  existingConvs.forEach((c) => removeLocalConversation(uid, c.id));
  setLocalConversations(uid, []);

  if (isCloudUser(uid)) {
    try {
      const convsCol = collection(db, 'users', uid, 'mentorConversations');
      const convsSnap = await getDocs(convsCol);
      if (!convsSnap.empty) {
        const batch = writeBatch(db);
        for (const convDoc of convsSnap.docs) {
          batch.delete(convDoc.ref);
          try {
            const msgsSnap = await getDocs(
              collection(db, 'users', uid, 'mentorConversations', convDoc.id, 'messages')
            );
            msgsSnap.forEach((m) => batch.delete(m.ref));
          } catch {}
        }
        await batch.commit();
      }
    } catch (err) {
      console.warn('Note on clearing all conversations in Firestore:', err);
    }
  }
}


/**
 * Update an existing user message, prune all subsequent messages (to avoid orphaned replies),
 * and sync both local cache and Firestore. Returns the pruned messages array.
 */
export async function updateMentorMessageAndTruncate(
  uid: string,
  conversationId: string,
  messageId: string,
  newText: string,
  newAttachments?: MentorAttachment[]
): Promise<MentorMessage[]> {
  const existingMsgs = getLocalMessages(uid, conversationId);
  const targetIdx = existingMsgs.findIndex((m) => m.id === messageId);

  if (targetIdx === -1) {
    return existingMsgs;
  }

  const updatedTargetMsg: MentorMessage = {
    ...existingMsgs[targetIdx],
    text: newText,
    attachments: newAttachments ?? existingMsgs[targetIdx].attachments,
    isEdited: true,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // Truncate to include only messages up to the target edited message
  const truncatedMsgs = [...existingMsgs.slice(0, targetIdx), updatedTargetMsg];
  const discardedMsgs = existingMsgs.slice(targetIdx + 1);

  setLocalMessages(uid, conversationId, truncatedMsgs);

  // Update conversation lastMessagePreview and updatedAt
  const now = new Date().toISOString();
  const existingConvs = getLocalConversations(uid);
  const updatedConvs = existingConvs.map((c) => {
    if (c.id === conversationId) {
      return {
        ...c,
        updatedAt: now,
        lastMessagePreview: newText.substring(0, 70),
      };
    }
    return c;
  });
  setLocalConversations(uid, updatedConvs);

  if (isCloudUser(uid)) {
    try {
      const batch = writeBatch(db);
      // Update target message
      const targetDocRef = doc(db, 'users', uid, 'mentorConversations', conversationId, 'messages', messageId);
      batch.set(targetDocRef, updatedTargetMsg, { merge: true });

      // Delete subsequent discarded messages from Firestore
      for (const disc of discardedMsgs) {
        const discRef = doc(db, 'users', uid, 'mentorConversations', conversationId, 'messages', disc.id);
        batch.delete(discRef);
      }

      // Update conversation doc
      const convDocRef = doc(db, 'users', uid, 'mentorConversations', conversationId);
      batch.update(convDocRef, {
        updatedAt: now,
        lastMessagePreview: newText.substring(0, 70),
      });

      await batch.commit();
    } catch (err) {
      console.warn('Could not sync edited message truncation to Firestore:', err);
    }
  }

  return truncatedMsgs;
}

// ---------------------------------------------------------------------------
// ADMIN AI MENTOR ("ShareMarket Admin Intelligence") ISOLATED HISTORY
// ---------------------------------------------------------------------------

function getAdminLocalConvs(adminUid: string): MentorConversation[] {
  const s = getStorage();
  if (!s) return [];
  try {
    const raw = s.getItem(`smll_admin_intel_convs_${adminUid}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function setAdminLocalConvs(adminUid: string, convs: MentorConversation[]): void {
  const s = getStorage();
  if (!s) return;
  try {
    s.setItem(`smll_admin_intel_convs_${adminUid}`, JSON.stringify(convs));
  } catch {
    // ignore
  }
}

function getAdminLocalMsgs(adminUid: string, convId: string): MentorMessage[] {
  const s = getStorage();
  if (!s) return [];
  try {
    const raw = s.getItem(`smll_admin_intel_msgs_${adminUid}_${convId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function setAdminLocalMsgs(adminUid: string, convId: string, msgs: MentorMessage[]): void {
  const s = getStorage();
  if (!s) return;
  try {
    s.setItem(`smll_admin_intel_msgs_${adminUid}_${convId}`, JSON.stringify(msgs));
  } catch {
    // ignore
  }
}

export async function fetchAdminMentorConversations(adminUid: string): Promise<MentorConversation[]> {
  const cached = getAdminLocalConvs(adminUid);
  if (!isCloudUser(adminUid)) return cached;

  try {
    const colRef = collection(db, 'adminMentor', adminUid, 'conversations');
    const q = query(colRef, orderBy('updatedAt', 'desc'), limit(50));
    const snap = await Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)),
    ]);
    const remote: MentorConversation[] = [];
    snap.forEach((d) => remote.push({ id: d.id, ...(d.data() as any) }));
    setAdminLocalConvs(adminUid, remote);
    return remote;
  } catch (err) {
    console.warn('Admin convs fallback to cache:', err);
    return cached;
  }
}

export async function fetchAdminMentorMessages(adminUid: string, convId: string): Promise<MentorMessage[]> {
  const cached = getAdminLocalMsgs(adminUid, convId);
  if (!isCloudUser(adminUid)) return cached;

  try {
    const colRef = collection(db, 'adminMentor', adminUid, 'conversations', convId, 'messages');
    const q = query(colRef, orderBy('createdAt', 'asc'));
    const snap = await Promise.race([
      getDocs(q),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)),
    ]);
    const remote: MentorMessage[] = [];
    snap.forEach((d) => remote.push({ id: d.id, ...(d.data() as any) }));
    setAdminLocalMsgs(adminUid, convId, remote);
    return remote;
  } catch (err) {
    console.warn('Admin msgs fallback to cache:', err);
  }
  return cached;
}

export async function createAdminMentorConversation(adminUid: string, firstQuestion: string): Promise<MentorConversation> {
  const convId = 'admin_conv_' + Date.now();
  const now = new Date().toISOString();
  const title = generateConversationTitle(firstQuestion) || 'Admin Analytics Intelligence';
  const newConv: MentorConversation = {
    id: convId,
    title,
    createdAt: now,
    updatedAt: now,
    lastMessagePreview: firstQuestion.substring(0, 70),
  };
  const list = [newConv, ...getAdminLocalConvs(adminUid)];
  setAdminLocalConvs(adminUid, list);

  if (isCloudUser(adminUid)) {
    // Non-blocking fire-and-forget sync to Firestore with timeout safeguard
    Promise.race([
      setDoc(doc(db, 'adminMentor', adminUid, 'conversations', convId), newConv),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Cloud sync timeout')), 1500)),
    ]).catch((err) => {
      console.warn('Admin conversation cloud sync notice:', err?.message || err);
    });
  }
  return newConv;
}

export async function saveAdminMentorMessage(adminUid: string, convId: string, message: MentorMessage): Promise<void> {
  const existing = getAdminLocalMsgs(adminUid, convId);
  setAdminLocalMsgs(adminUid, convId, [...existing, message]);

  const convs = getAdminLocalConvs(adminUid);
  const updated = convs.map((c) =>
    c.id === convId
      ? { ...c, updatedAt: new Date().toISOString(), lastMessagePreview: message.text.substring(0, 70) }
      : c
  );
  setAdminLocalConvs(adminUid, updated);

  if (isCloudUser(adminUid)) {
    // Non-blocking fire-and-forget sync to Firestore with timeout safeguard
    Promise.race([
      Promise.all([
        setDoc(doc(db, 'adminMentor', adminUid, 'conversations', convId, 'messages', message.id), message),
        setDoc(
          doc(db, 'adminMentor', adminUid, 'conversations', convId),
          {
            updatedAt: new Date().toISOString(),
            lastMessagePreview: message.text.substring(0, 70),
          },
          { merge: true }
        ),
      ]),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Cloud sync timeout')), 1500)),
    ]).catch((err) => {
      console.warn('Admin message cloud sync notice:', err?.message || err);
    });
  }
}

export async function deleteAdminMentorConversation(adminUid: string, convId: string): Promise<void> {
  // 1. Immediately delete from local storage
  const existing = getAdminLocalConvs(adminUid);
  setAdminLocalConvs(
    adminUid,
    existing.filter((c) => c.id !== convId)
  );
  const s = getStorage();
  s?.removeItem(`smll_admin_intel_msgs_${adminUid}_${convId}`);

  // 2. Cloud Firestore deletion: delete main conversation doc first with timeout race
  if (isCloudUser(adminUid)) {
    try {
      const convDocRef = doc(db, 'adminMentor', adminUid, 'conversations', convId);
      await Promise.race([
        deleteDoc(convDocRef),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Cloud delete timeout')), 2000)),
      ]);

      // Clean up subcollection messages asynchronously in background
      void (async () => {
        try {
          const msgsSnap = await getDocs(
            collection(db, 'adminMentor', adminUid, 'conversations', convId, 'messages')
          );
          if (!msgsSnap.empty) {
            const batch = writeBatch(db);
            msgsSnap.forEach((m) => batch.delete(m.ref));
            await batch.commit();
          }
        } catch (subErr) {
          console.warn('Admin subcollection cleanup note:', subErr);
        }
      })();
    } catch (err) {
      console.warn('Note on deleting admin conversation in Firestore:', err);
    }
  }
}

export async function deleteAdminMentorMessage(
  adminUid: string,
  convId: string,
  messageId: string,
  currentMessages?: MentorMessage[]
): Promise<MentorMessage[]> {
  const baseMsgs =
    currentMessages && currentMessages.length > 0
      ? currentMessages
      : getAdminLocalMsgs(adminUid, convId);

  const remaining = baseMsgs.filter((m) => m.id !== messageId);
  setAdminLocalMsgs(adminUid, convId, remaining);

  const lastMsg = remaining[remaining.length - 1];
  const convs = getAdminLocalConvs(adminUid);
  const updated = convs.map((c) =>
    c.id === convId
      ? { ...c, updatedAt: new Date().toISOString(), lastMessagePreview: lastMsg ? lastMsg.text.substring(0, 70) : '' }
      : c
  );
  setAdminLocalConvs(adminUid, updated);

  if (isCloudUser(adminUid)) {
    Promise.race([
      (async () => {
        const msgDocRef = doc(db, 'adminMentor', adminUid, 'conversations', convId, 'messages', messageId);
        await deleteDoc(msgDocRef);
        await setDoc(
          doc(db, 'adminMentor', adminUid, 'conversations', convId),
          {
            updatedAt: new Date().toISOString(),
            lastMessagePreview: lastMsg ? lastMsg.text.substring(0, 70) : '',
          },
          { merge: true }
        );
      })(),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Cloud timeout')), 1500)),
    ]).catch((err) => {
      console.warn('Note on cloud message deletion:', err?.message || err);
    });
  }

  return remaining;
}

export async function clearAllAdminMentorConversations(adminUid: string): Promise<void> {
  const existing = getAdminLocalConvs(adminUid);
  const s = getStorage();
  existing.forEach((c) => s?.removeItem(`smll_admin_intel_msgs_${adminUid}_${c.id}`));
  setAdminLocalConvs(adminUid, []);

  if (isCloudUser(adminUid)) {
    try {
      const snap = await getDocs(collection(db, 'adminMentor', adminUid, 'conversations'));
      if (!snap.empty) {
        const batch = writeBatch(db);
        for (const d of snap.docs) {
          batch.delete(d.ref);
          try {
            const msgs = await getDocs(collection(db, 'adminMentor', adminUid, 'conversations', d.id, 'messages'));
            msgs.forEach((m) => batch.delete(m.ref));
          } catch {}
        }
        await batch.commit();
      }
    } catch {
      // ignore
    }
  }
}


/**
 * Tactile Haptic Vibration Feedback Helper (safe on all platforms)
 */
export function triggerTactileHaptic(duration = 8): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Haptics not allowed or unsupported
    }
  }
}

