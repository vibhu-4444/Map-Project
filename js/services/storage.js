/**
 * Project Persistence & Sample Preset Library
 * Manages localStorage synchronization, project serialization, import/export, and ready-to-test blueprints.
 */

import { feetToMm } from '../core/units.js';
import { createDefaultProject } from '../core/types.js';

const STORAGE_KEY = 'ai_floorplan_projects_v1';
const ACTIVE_PROJ_KEY = 'ai_floorplan_active_id';

export class StorageService {
  /**
   * Retrieves all saved projects from local storage
   */
  static listProjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [this.createPreset35x50()];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [this.createPreset35x50()];
    } catch (e) {
      console.warn('Failed to parse localStorage projects:', e);
      return [this.createPreset35x50()];
    }
  }

  /**
   * Saves or updates a project
   */
  static saveProject(project) {
    if (!project || !project.id) return;
    project.modifiedAt = new Date().toISOString();

    const projects = this.listProjects();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = project;
    } else {
      projects.unshift(project);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    localStorage.setItem(ACTIVE_PROJ_KEY, project.id);
  }

  /**
   * Retrieves a single project by ID
   */
  static getProject(id) {
    const list = this.listProjects();
    return list.find(p => p.id === id) || null;
  }

  /**
   * Deletes a project
   */
  static deleteProject(id) {
    const list = this.listProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (localStorage.getItem(ACTIVE_PROJ_KEY) === id) {
      localStorage.removeItem(ACTIVE_PROJ_KEY);
    }
  }

  /**
   * Exports project as downloadable JSON file
   */
  static exportProjectFile(project) {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project.name || 'project').replace(/\s+/g, '_')}.floorplan.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Pre-built Preset 1: 30x40 Compact 2BHK (1200 sq.ft plot)
   */
  static createPreset30x40() {
    const proj = createDefaultProject('30×40 Compact 2BHK (East Facing)');
    proj.plot = {
      widthMm: feetToMm(30),
      lengthMm: feetToMm(40),
      orientation: 'east',
      roadFacing: 'east',
      setbacks: {
        frontMm: feetToMm(4),
        rearMm: feetToMm(3),
        leftMm: feetToMm(2.5),
        rightMm: feetToMm(2.5)
      }
    };
    proj.specification = {
      bedrooms: 2,
      bathrooms: { total: 2, attached: 1, common: 1 },
      kitchen: { priority: 'standard', style: 'open' },
      parking: { required: true, vehicleCount: 1, type: 'car' },
      poojaRoom: true,
      studyRoom: false,
      diningRoom: true,
      balcony: false,
      floorsCount: 1,
      vastuMode: 'vastu-aware',
      designPriority: 'family-oriented'
    };
    return proj;
  }

  /**
   * Pre-built Preset 2: 35x50 Modern 3BHK Residence (1750 sq.ft plot)
   */
  static createPreset35x50() {
    return createDefaultProject('35×50 Modern 3BHK Residence (North Facing)');
  }

  /**
   * Pre-built Preset 3: 40x60 Luxury Duplex Villa (2400 sq.ft plot)
   */
  static createPreset40x60() {
    const proj = createDefaultProject('40×60 Luxury Duplex Villa (North Facing)');
    proj.plot = {
      widthMm: feetToMm(40),
      lengthMm: feetToMm(60),
      orientation: 'north',
      roadFacing: 'north',
      setbacks: {
        frontMm: feetToMm(6),
        rearMm: feetToMm(4),
        leftMm: feetToMm(3.5),
        rightMm: feetToMm(3.5)
      }
    };
    proj.specification = {
      bedrooms: 4,
      bathrooms: { total: 4, attached: 3, common: 1 },
      kitchen: { priority: 'large', style: 'open' },
      parking: { required: true, vehicleCount: 2, type: 'car' },
      poojaRoom: true,
      studyRoom: true,
      diningRoom: true,
      balcony: true,
      floorsCount: 2,
      vastuMode: 'vastu-aware',
      designPriority: 'expansion-oriented'
    };
    return proj;
  }
}
