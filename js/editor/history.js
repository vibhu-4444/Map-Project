/**
 * Robust Undo/Redo State History Store
 * Implements immutable geometry snapshots with deep cloning and bounded memory.
 */

export class HistoryStore {
  constructor(maxSnapshots = 50) {
    this.maxSnapshots = maxSnapshots;
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Pushes a new project geometry state snapshot
   * @param {Object} projectState - Complete project data model
   */
  pushState(projectState) {
    // Deep clone state to guarantee immutability
    const snapshot = JSON.parse(JSON.stringify(projectState));
    this.undoStack.push(snapshot);

    if (this.undoStack.length > this.maxSnapshots) {
      this.undoStack.shift(); // Evict oldest
    }

    // Any new action clears redo future
    this.redoStack = [];
  }

  canUndo() {
    return this.undoStack.length > 1; // Needs at least 1 prior state to revert to
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Reverts to the previous state snapshot
   * @returns {Object|null} Reverted state or null
   */
  undo() {
    if (!this.canUndo()) return null;

    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);

    const previousState = this.undoStack[this.undoStack.length - 1];
    return JSON.parse(JSON.stringify(previousState));
  }

  /**
   * Restores a reverted state snapshot
   * @returns {Object|null} Restored state or null
   */
  redo() {
    if (!this.canRedo()) return null;

    const nextState = this.redoStack.pop();
    this.undoStack.push(nextState);

    return JSON.parse(JSON.stringify(nextState));
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
