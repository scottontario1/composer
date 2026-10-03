// Bounded puzzle board. Slots have stable IDs derived from row/column (r03c07) that never
// renumber when the board grows. Each slot holds at most one entity (skill step or concept).
// Layout is presentation only: nothing here can change handoffs, links, notes, or readyOrder.

import { LIMITS, issue, isPlainObject } from "./schema.js";

const pad = n => String(n).padStart(2, "0");
export const slotId = (row, column) => `r${pad(row)}c${pad(column)}`;
const SLOT = /^r(\d{2})c(\d{2})$/;

export function parseSlot(id) {
  const m = typeof id === "string" && SLOT.exec(id);
  return m ? { row: Number(m[1]), column: Number(m[2]) } : null;
}

export const inBounds = (layout, id) => {
  const s = parseSlot(id);
  return !!s && s.row < layout.rows && s.column < layout.columns;
};

export function emptyLayout(rows = LIMITS.gridDefaultRows, columns = LIMITS.gridDefaultColumns) {
  return { rows, columns, occupants: {}, looseEntities: [], linkBends: {} };
}

// Row-major slot IDs for the current board.
export function slotIds(layout) {
  const ids = [];
  for (let r = 0; r < layout.rows; r++) for (let c = 0; c < layout.columns; c++) ids.push(slotId(r, c));
  return ids;
}

export const slotOf = (layout, entityId) => Object.keys(layout.occupants).find(k => layout.occupants[k] === entityId) ?? null;
export const freeSlots = layout => slotIds(layout).filter(id => !(id in layout.occupants));

// `entityIds` is every step and variable ID in the workspace. Each must be placed exactly once
// or listed in looseEntities (explicit overflow recovery). Nothing else may appear.
export function validateLayout(layout, entityIds, linkIds = [], path = "layout") {
  const out = [];
  if (!isPlainObject(layout)) return [issue("layout.shape", "Layout must be an object.", path)];
  const { rows, columns, occupants, looseEntities, linkBends } = layout;
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1 || rows > LIMITS.gridMaxRows || columns > LIMITS.gridMaxColumns)
    out.push(issue("layout.size", `Board must be 1–${LIMITS.gridMaxRows} rows by 1–${LIMITS.gridMaxColumns} columns.`, path));
  if (!isPlainObject(occupants) || !Array.isArray(looseEntities) || !isPlainObject(linkBends)) {
    out.push(issue("layout.shape", "Layout needs occupants, looseEntities, and linkBends.", path));
    return out;
  }
  const wanted = new Set(entityIds), seen = new Set();
  for (const [slot, entity] of Object.entries(occupants)) {
    if (!inBounds(layout, slot)) out.push(issue("layout.slot", `Slot ${slot} is outside the board.`, `${path}.occupants.${slot}`));
    if (!wanted.has(entity)) out.push(issue("layout.entity", `Slot ${slot} holds unknown entity ${entity}.`, `${path}.occupants.${slot}`));
    if (seen.has(entity)) out.push(issue("layout.duplicate", `Entity ${entity} occupies more than one slot.`, `${path}.occupants.${slot}`));
    seen.add(entity);
  }
  for (const entity of looseEntities) {
    if (!wanted.has(entity)) out.push(issue("layout.entity", `Unplaced list holds unknown entity ${entity}.`, path + ".looseEntities"));
    if (seen.has(entity)) out.push(issue("layout.duplicate", `Entity ${entity} is both placed and unplaced.`, path + ".looseEntities"));
    seen.add(entity);
  }
  for (const id of wanted) if (!seen.has(id)) out.push(issue("layout.missing", `Entity ${id} has no slot and is not in the unplaced list.`, path));
  const links = new Set(linkIds);
  for (const [id, bend] of Object.entries(linkBends)) {
    if (!links.has(id)) out.push(issue("layout.bend", `Bend for unknown link ${id}.`, `${path}.linkBends.${id}`));
    if (!Number.isFinite(bend) || Math.abs(bend) > 250) out.push(issue("layout.bend", `Bend for ${id} must be a number within ±250.`, `${path}.linkBends.${id}`));
  }
  return out;
}

// --- Pure layout transforms. They return a new layout or throw an issue; callers validate. ---

const fail = (code, message) => { throw issue(code, message); };

// Put a new or loose entity into a slot (first free slot when slot is omitted; loose if board full).
export function place(layout, entityId, slot = null) {
  const next = { ...layout, occupants: { ...layout.occupants }, looseEntities: layout.looseEntities.filter(e => e !== entityId) };
  if (slotOf(next, entityId)) fail("layout.placed", `Entity ${entityId} is already on the board; use move.`);
  if (slot === null) {
    const free = freeSlots(next)[0];
    if (!free) { next.looseEntities.push(entityId); return next; }
    slot = free;
  }
  if (!inBounds(next, slot)) fail("layout.slot", `Slot ${slot} is outside the board.`);
  if (slot in next.occupants) fail("layout.occupied", `Slot ${slot} is occupied; choose swap or another slot.`);
  next.occupants[slot] = entityId;
  return next;
}

export function move(layout, entityId, toSlot) {
  const from = slotOf(layout, entityId);
  if (!from) return place(layout, entityId, toSlot);
  if (from === toSlot) return layout;
  if (!inBounds(layout, toSlot)) fail("layout.slot", `Slot ${toSlot} is outside the board.`);
  if (toSlot in layout.occupants) fail("layout.occupied", `Slot ${toSlot} is occupied; choose swap or another slot.`);
  const occupants = { ...layout.occupants };
  delete occupants[from];
  occupants[toSlot] = entityId;
  return { ...layout, occupants };
}

export function swap(layout, slotA, slotB) {
  if (!inBounds(layout, slotA) || !inBounds(layout, slotB)) fail("layout.slot", "Both slots must be on the board.");
  const occupants = { ...layout.occupants };
  const a = occupants[slotA], b = occupants[slotB];
  delete occupants[slotA]; delete occupants[slotB];
  if (b !== undefined) occupants[slotA] = b;
  if (a !== undefined) occupants[slotB] = a;
  return { ...layout, occupants };
}

// Take an entity off the board without deleting it; it becomes explicitly unplaced.
export function unplace(layout, entityId) {
  const from = slotOf(layout, entityId);
  if (!from) return layout;
  const occupants = { ...layout.occupants };
  delete occupants[from];
  return { ...layout, occupants, looseEntities: [...layout.looseEntities, entityId] };
}

// Remove an entity from layout entirely (used when the entity itself is deleted).
export function forget(layout, entityId) {
  const occupants = { ...layout.occupants };
  const from = slotOf(layout, entityId);
  if (from) delete occupants[from];
  return { ...layout, occupants, looseEntities: layout.looseEntities.filter(e => e !== entityId) };
}

// Grow or shrink. Shrinking is allowed only when the removed rows/columns are empty.
export function resize(layout, rows, columns) {
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1 || rows > LIMITS.gridMaxRows || columns > LIMITS.gridMaxColumns)
    fail("layout.size", `Board must be 1–${LIMITS.gridMaxRows} rows by 1–${LIMITS.gridMaxColumns} columns.`);
  for (const slot of Object.keys(layout.occupants)) {
    const { row, column } = parseSlot(slot);
    if (row >= rows || column >= columns) fail("layout.shrink", `Slot ${slot} is occupied; move it before shrinking the board.`);
  }
  return { ...layout, rows, columns };
}

// Deterministic initial placement for migration. `entities` are { id, x, y, domainRank };
// sorted by (y, x, domainRank, id) and assigned row-major. Overflow goes to looseEntities.
export function assignInitial(layout, entities) {
  const sorted = [...entities].sort((a, b) => a.y - b.y || a.x - b.x || a.domainRank - b.domainRank || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const free = freeSlots(layout);
  const next = { ...layout, occupants: { ...layout.occupants }, looseEntities: [...layout.looseEntities] };
  const mapping = {};
  for (const e of sorted) {
    const slot = free.shift();
    if (slot) { next.occupants[slot] = e.id; mapping[e.id] = slot; }
    else { next.looseEntities.push(e.id); mapping[e.id] = null; }
  }
  return { layout: next, mapping };
}
