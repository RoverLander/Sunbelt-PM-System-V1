# Demo Data Setup

Run these scripts **in order** to prepare the database for demo.

## Scripts

| Order | File | What it does |
|-------|------|--------------|
| 1 | `01_CLEAR_DATA.sql` | Clears all project data (keeps users) |
| 2 | `02_CREATE_PC_USER.sql` | Creates Juanita Earnest PC account |
| 3 | `03_IMPORT_PROJECTS.sql` | Imports 20 real projects from Excel |
| 4 | `04_GENERATE_SAMPLE_DATA.sql` | Creates tasks, RFIs, submittals, milestones |

## After Running SQL Scripts

**Create the PC user in Supabase Auth:**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Email: `juanita.earnest@phoenixmodular.com`
4. Set a password
5. User can now log in

## What Gets Created

### 20 Projects by Factory:
- **Phoenix** (4): PMI-6781, PMI-6798, DO-0521-1-25, PMI-6749-6763
- **Southeast** (8): SMM-21145, SMM-21003, SMM-21055, SMM-21056, SMM-21057, SMM-21054, SMM-21103, SMM-21020
- **SSI** (5): SSI-7669, SSI-7670, SSI-7671, SSI-7672, SSI-7547
- **Indicom** (1): 25B579-584
- **NWBS** (1): NWBS-25250
- **Promod** (1): SME-23038

### Project Status Mix:
- In Progress: ~8 projects
- Planning: ~8 projects
- PM Handoff: ~3 projects
- Critical health: 1 (Disney - past due)
- At Risk health: 3

### Sample Data per Project:
- **Tasks**: 5-8 each (mix of completed, in progress, not started, overdue)
- **RFIs**: 2-3 each (mix of draft, open, closed, urgent)
- **Submittals**: 2-3 each (mix of draft, under review, approved, rejected)
- **Milestones**: 4 each (sales handoff, drawings, production, delivery)

### PM Assignments:
- Candy Juhnke: 2 projects (primary), 6 projects (backup)
- Crystal Myers: 10 projects (primary), 1 project (backup)
- Matthew McDaniel: 3 projects (primary), 2 projects (backup)
- Hector Vazquez: 1 project (primary)
- Michael Caracciolo: 4 projects (primary), 2 projects (backup)

## Demo Highlights

Show these during demo:

1. **Critical Project**: SMM-21003 (Disney) - Past due, overdue tasks
2. **At Risk Projects**: SSI-7670, SMM-21020, SSI-7547 - Schedule concerns
3. **Multiple related projects**: VA modules (4 Kitchens To Go projects)
4. **Factory diversity**: Projects across all 6 factories
5. **Workflow tracking**: Tasks linked to workflow stations
