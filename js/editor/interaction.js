/**
 * Interactive 2D CAD Viewport Controller
 * Manages pointer events, coordinate transformation, room translation (dragging),
 * handle-based resizing, grid & edge snapping, and live validation triggers.
 */

import { Point2D, createRectanglePolygon } from '../core/geometry.js';
import { sqmmToSqFt } from '../core/units.js';

export class CanvasInteractionController {
  constructor(containerElement, renderer, stateStore, onGeometryChanged) {
    this.container = containerElement;
    this.renderer = renderer;
    this.stateStore = stateStore;
    this.onGeometryChanged = onGeometryChanged;

    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.dragTargetRoom = null;

    this.dragStartMouse = new Point2D(0, 0);
    this.dragInitialRoomPos = { x: 0, y: 0, width: 0, height: 0 };

    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };

    this.initEvents();
  }

  initEvents() {
    this.container.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    window.addEventListener('pointermove', this.handlePointerMove.bind(this));
    window.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
  }

  /**
   * Converts client screen mouse coordinates into exact SVG world millimeters (mm)
   */
  screenToWorld(clientX, clientY) {
    const svg = this.container.querySelector('svg');
    if (!svg) return new Point2D(0, 0);

    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
    return new Point2D(transformed.x, transformed.y);
  }

  handlePointerDown(e) {
    // Middle click or space+click for pan
    if (e.button === 1 || e.shiftKey) {
      this.isPanning = true;
      this.panStart = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }

    if (e.button !== 0) return; // Only primary left-click

    const worldPt = this.screenToWorld(e.clientX, e.clientY);
    const target = e.target;

    // 1. Check if clicking a resize handle
    if (target.classList.contains('handle-se') ||
        target.classList.contains('handle-sw') ||
        target.classList.contains('handle-ne') ||
        target.classList.contains('handle-nw')) {
      const roomGroup = target.closest('.room-element');
      const roomId = roomGroup?.getAttribute('data-room-id');
      const room = this.findRoom(roomId);

      if (room) {
        this.isResizing = true;
        this.resizeHandle = target.classList[0].replace('handle-', '');
        this.dragTargetRoom = room;
        this.dragStartMouse = worldPt;
        this.dragInitialRoomPos = { x: room.x, y: room.y, width: room.width, height: room.height };
        e.stopPropagation();
        return;
      }
    }

    // 2. Check if clicking a room to select or drag
    const roomElement = target.closest('.room-element');
    if (roomElement) {
      const roomId = roomElement.getAttribute('data-room-id');
      const room = this.findRoom(roomId);

      if (room) {
        this.stateStore.setSelectedRoomId(roomId);
        this.renderer.setSelectedObject(roomId);

        this.isDragging = true;
        this.dragTargetRoom = room;
        this.dragStartMouse = worldPt;
        this.dragInitialRoomPos = { x: room.x, y: room.y, width: room.width, height: room.height };

        // Re-render selection highlight
        this.triggerRedraw();
        e.stopPropagation();
        return;
      }
    }

    // 3. Clicked empty background: Deselect
    this.stateStore.setSelectedRoomId(null);
    this.renderer.setSelectedObject(null);
    this.triggerRedraw();
  }

  handlePointerMove(e) {
    if (this.isPanning) {
      // Pan viewport
      return;
    }

    if (!this.isDragging && !this.isResizing) return;
    if (!this.dragTargetRoom) return;

    const currentWorldPt = this.screenToWorld(e.clientX, e.clientY);
    const dx = currentWorldPt.x - this.dragStartMouse.x;
    const dy = currentWorldPt.y - this.dragStartMouse.y;

    const snapGrid = this.stateStore.settings?.snapToGrid ? (this.stateStore.settings?.gridSnapSizeMm || 304.8) : 1;

    if (this.isDragging) {
      // Move Room
      let newX = this.dragInitialRoomPos.x + dx;
      let newY = this.dragInitialRoomPos.y + dy;

      // Apply Snap to Grid
      if (snapGrid > 1) {
        newX = Math.round(newX / snapGrid) * snapGrid;
        newY = Math.round(newY / snapGrid) * snapGrid;
      }

      this.dragTargetRoom.x = newX;
      this.dragTargetRoom.y = newY;
      this.dragTargetRoom.polygon = createRectanglePolygon(newX, newY, this.dragTargetRoom.width, this.dragTargetRoom.height);

      this.updateDependentGeometry(this.dragTargetRoom);
      this.triggerRedraw();
    } else if (this.isResizing) {
      // Resize Room
      let newW = this.dragInitialRoomPos.width;
      let newH = this.dragInitialRoomPos.height;
      let newX = this.dragInitialRoomPos.x;
      let newY = this.dragInitialRoomPos.y;

      if (this.resizeHandle === 'se') {
        newW = Math.max(1200, this.dragInitialRoomPos.width + dx);
        newH = Math.max(1200, this.dragInitialRoomPos.height + dy);
      } else if (this.resizeHandle === 'sw') {
        newW = Math.max(1200, this.dragInitialRoomPos.width - dx);
        newH = Math.max(1200, this.dragInitialRoomPos.height + dy);
        newX = this.dragInitialRoomPos.x + (this.dragInitialRoomPos.width - newW);
      } else if (this.resizeHandle === 'ne') {
        newW = Math.max(1200, this.dragInitialRoomPos.width + dx);
        newH = Math.max(1200, this.dragInitialRoomPos.height - dy);
        newY = this.dragInitialRoomPos.y + (this.dragInitialRoomPos.height - newH);
      } else if (this.resizeHandle === 'nw') {
        newW = Math.max(1200, this.dragInitialRoomPos.width - dx);
        newH = Math.max(1200, this.dragInitialRoomPos.height - dy);
        newX = this.dragInitialRoomPos.x + (this.dragInitialRoomPos.width - newW);
        newY = this.dragInitialRoomPos.y + (this.dragInitialRoomPos.height - newH);
      }

      if (snapGrid > 1) {
        newW = Math.round(newW / snapGrid) * snapGrid;
        newH = Math.round(newH / snapGrid) * snapGrid;
        newX = Math.round(newX / snapGrid) * snapGrid;
        newY = Math.round(newY / snapGrid) * snapGrid;
      }

      this.dragTargetRoom.x = newX;
      this.dragTargetRoom.y = newY;
      this.dragTargetRoom.width = newW;
      this.dragTargetRoom.height = newH;
      this.dragTargetRoom.areaSqMm = newW * newH;
      this.dragTargetRoom.areaSqFt = Math.round(sqmmToSqFt(newW * newH) * 10) / 10;
      this.dragTargetRoom.polygon = createRectanglePolygon(newX, newY, newW, newH);

      this.updateDependentGeometry(this.dragTargetRoom);
      this.triggerRedraw();
    }
  }

  handlePointerUp() {
    if (this.isDragging || this.isResizing) {
      this.isDragging = false;
      this.isResizing = false;
      this.resizeHandle = null;
      this.dragTargetRoom = null;

      // Commit geometry change to history and trigger full app state updates
      if (this.onGeometryChanged) {
        this.onGeometryChanged();
      }
    }
    this.isPanning = false;
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const svg = this.container.querySelector('svg');
    if (!svg) return;

    const vb = svg.viewBox.baseVal;
    const mousePt = this.screenToWorld(e.clientX, e.clientY);

    const newW = vb.width / zoomFactor;
    const newH = vb.height / zoomFactor;
    const newX = mousePt.x - (mousePt.x - vb.x) / zoomFactor;
    const newY = mousePt.y - (mousePt.y - vb.y) / zoomFactor;

    svg.setAttribute('viewBox', `${newX} ${newY} ${newW} ${newH}`);
  }

  findRoom(roomId) {
    const floor = this.stateStore.getActiveFloor();
    return floor ? (floor.rooms || []).find(r => r.id === roomId) : null;
  }

  updateDependentGeometry(room) {
    // Re-synchronize walls and furniture attached to this room
    const floor = this.stateStore.getActiveFloor();
    if (!floor) return;

    // Update associated furniture positions relative to room
    if (floor.furniture) {
      const roomFurniture = floor.furniture.filter(f => f.roomId === room.id);
      for (const fn of roomFurniture) {
        fn.x = Math.max(room.x + 50, Math.min(room.x + room.width - fn.width - 50, fn.x));
        fn.y = Math.max(room.y + 50, Math.min(room.y + room.height - fn.length - 50, fn.y));
      }
    }
  }

  triggerRedraw() {
    const floor = this.stateStore.getActiveFloor();
    const plot = this.stateStore.getPlot();
    if (floor && plot) {
      this.renderer.render(floor, plot);
    }
  }
}
