/*
  FILE: academic-structure.js
  REFERENCE: ACADEMIC-MASTER-V1
  PURPOSE: Single academic source consumed by the CMA Zone Home Page.
  EDITABLE AREAS: Approved CMA level/group/subject master.
  DEPENDENCIES: None.
  IMPORTANT NOTES:
  - The four Final Group 3 paper names below are taken from the supplied
    dashboard reference image and are only the currently supplied source data.
  - Other groups intentionally remain unconfigured until the approved
    academic master is supplied/connected. Do not invent syllabus names.
  LAST UPDATED: 2026-10-04
*/

window.CMA_ACADEMIC_MASTER = {
  levels: {
    Foundation: {
      groups: {
        "Foundation": { subjects: [] }
      }
    },

    Intermediate: {
      groups: {
        "Group 1": { subjects: [] },
        "Group 2": { subjects: [] }
      }
    },

    Final: {
      groups: {
        "Group 3": {
          subjects: [
            { id:"F3-P13", name:"SFM", paper:"Paper 13" },
            { id:"F3-P14", name:"Direct Tax", paper:"Paper 14" },
            { id:"F3-P15", name:"Strategic Cost Management", paper:"Paper 15" },
            { id:"F3-P16", name:"Corporate Financial Reporting", paper:"Paper 16" }
          ]
        },
        "Group 4": { subjects: [] }
      }
    }
  }
};
