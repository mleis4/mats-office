/*
 * ============================================================================
 * Program Name:   catalog.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Joins the JSON data files into one lookup so the 3D scene,
 *                 the Project Card and the 2D page all read the same content.
 *                 Hobbies are given the same field names as projects.
 * ============================================================================
 */

import aiseProjects from './aiseProjects.json';
import eeProjects from './eeProjects.json';
import hobbies from './hobbies.json';

export const CONTACT = {
  name: 'Mats Leis',
  tagline: 'Electrical & AI Systems Engineering · Western University',
  email: 'leismats@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mats-leis-4b9911271/',
  github: 'https://github.com/mleis4',
};

export const SECTIONS = [
  { id: 'bench', title: 'Hardware', subtitle: 'On the workbench', items: eeProjects.map((project) => ({ ...project, kind: 'Hardware' })) },
  { id: 'desk', title: 'Software', subtitle: 'On the monitor', items: aiseProjects.map((project) => ({ ...project, kind: 'Software' })) },
  {
    id: 'hobbies',
    title: 'Hobbies',
    subtitle: 'In the hobby corner',
    items: hobbies.map((hobby) => ({ ...hobby, kind: 'Hobby', station: 'hobbies', summary: hobby.blurb })),
  },
];

// id -> item, for the Project Card
export const ITEMS_BY_ID = Object.fromEntries(
  SECTIONS.flatMap((section) => section.items).map((item) => [item.id, item]),
);
