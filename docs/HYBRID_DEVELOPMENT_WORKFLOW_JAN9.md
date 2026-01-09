# Sunbelt PM - Hybrid Development Workflow
## Parallel Development Strategy: Matthew + Agent
**Updated:** January 9, 2026

---

## 📋 Overview

This document outlines the hybrid development workflow for Sunbelt PM where:
- **Matthew (Claude Projects):** Fixes bugs, refines small features, maintains codebase quality
- **Agent (Claude Code):** Builds complete feature sets, rapid prototyping, autonomous development
- **Both:** Reference shared Project Knowledge, follow established patterns and instructions

---

## 🎯 Goals

1. **Faster development** - Parallel work increases velocity
2. **Clear boundaries** - Each party has defined scope
3. **Consistency** - Both follow same guidelines and patterns
4. **Quality control** - Features validated before integration
5. **Knowledge sharing** - Workflow maintains institutional knowledge

---

## 🔄 Workflow Phases

### Phase 1: Planning & Scope Definition
**Duration:** 30 mins | **Owner:** Matthew

- [ ] Define feature requirements clearly
- [ ] Identify components needed
- [ ] Review database schema changes (if any)
- [ ] Check existing patterns in codebase
- [ ] Create ticket/task for tracking
- [ ] Document any special considerations

**Output:** Feature specification shared with agent

---

### Phase 2: Agent Builds Feature (Claude Code)
**Duration:** Variable | **Owner:** Agent

**Agent should:**
- [ ] Reference Sunbelt PM Project instructions
- [ ] Use established component patterns
- [ ] Follow code comment nomenclature
- [ ] Include comprehensive error handling
- [ ] Build entire feature set end-to-end
- [ ] Test thoroughly before handoff
- [ ] Document any decisions made

**Checklist for agent:**
```
- ✅ File headers with comprehensive comments
- ✅ CSS variables used (not hardcoded colors)
- ✅ Toast notifications for user feedback
- ✅ Modal patterns follow existing style
- ✅ Database queries use Supabase patterns
- ✅ State organized by purpose (DATA, UI, FILTERS)
- ✅ Role-based access checks included
- ✅ All imports properly structured
```

**Communication:** Agent updates Matthew on progress/blockers every 2-3 hours

**Output:** Complete, tested feature code ready for review

---

### Phase 3: Matthew Reviews & Refines (Claude Projects)
**Duration:** 30-60 mins | **Owner:** Matthew

**Matthew reviews:**
- [ ] Code quality and consistency
- [ ] Alignment with project instructions
- [ ] Database schema accuracy
- [ ] UI/UX consistency with existing components
- [ ] Error handling coverage
- [ ] Performance implications
- [ ] Accessibility considerations

**Matthew makes adjustments:**
- [ ] Fix any inconsistencies
- [ ] Refine styling/spacing
- [ ] Add missing pieces
- [ ] Document decisions

**Output:** Production-ready code with approval

---

### Phase 4: Integration & Testing (Matthew)
**Duration:** 30 mins | **Owner:** Matthew

- [ ] Copy code to actual project structure
- [ ] Import statements corrected
- [ ] Any dependencies installed
- [ ] Local testing in full app context
- [ ] Git commit with clear message
- [ ] Documentation updated
- [ ] Add to PROJECT_STATUS.md

**Output:** Feature merged to main codebase, fully tested

---

### Phase 5: Post-Launch Polish (Matthew)
**Duration:** Ongoing | **Owner:** Matthew

- [ ] Monitor for edge cases
- [ ] Gather feedback if demoing
- [ ] Fix any issues found in real context
- [ ] Refine based on actual usage

---

## 📊 Current Feature Queue

### Active: Login Screen Enhancement (Claude Code) 🔄
| Task | Status | Complexity |
|------|--------|-----------|
| Center login form | 🔲 | Low |
| Sunbelt logo display | 🔲 | Low |
| Factory logo ring | 🔲 | Medium |
| Ring rotation animation | 🔲 | Medium |
| Convergence animation | 🔲 | High |
| Launch animation | 🔲 | High |
| Random animation selection | 🔲 | Low |

### Phase 3: Core Polish (Matthew focus)
| Task | Status | Complexity |
|------|--------|-----------|
| Secondary PM in Edit Modal | 🔲 | Medium |
| Fix Status Squares counts | 🔲 | Low |
| Tasks Kanban/list toggle | 🔲 | Medium |
| Wider page layouts | 🔲 | Low |

### Phase 4: New Dashboards (Agent focus - future)
| Task | Status | Complexity | Est. Time |
|------|--------|-----------|-----------|
| **Project Coordinator Dashboard** | 🔲 | High | 4-6 hrs |
| Plant Manager Dashboard | 🔲 | High | 4-6 hrs |

---

## 🎯 CURRENT TASK: Login Screen Enhancement

### Assignment
**Owner:** Claude Code (Agent)  
**Reviewer:** Matthew  
**Priority:** High (UX Polish)

### Background
The current login screen is functional but plain. We want to create a memorable, branded experience that showcases all the Sunbelt family factories.

### Requirements

#### 1. Layout
- Login form centered horizontally AND vertically on screen
- Sunbelt logo large, centered above the form
- Factory logos arranged in a ring/circle around the Sunbelt logo
- Clean, professional dark theme (use existing CSS variables)

#### 2. Idle State Animation
- 15 factory logos in a circular arrangement
- Ring rotates slowly clockwise (~40 seconds per revolution)
- Logos slightly muted (60-70% opacity) so they don't overwhelm
- Sunbelt logo has subtle glow/pulse effect

#### 3. Login Animation (Random - 50/50)

**Option A: "Convergence"**
1. On login button click, ring rotation accelerates
2. Factory logos spiral inward like a whirlpool
3. Logos shrink and converge into Sunbelt logo center
4. Brief bright flash/pulse at center
5. Fade to white → dashboard loads

**Option B: "Launch"**
1. On login button click, ring rotation accelerates
2. Ring tilts backward (3D perspective effect)
3. Factory logos streak outward/upward with motion blur
4. Sunbelt logo scales up and zooms toward camera
5. Fade to dashboard

**Timing:**
- 0-300ms: Acceleration begins
- 300-800ms: Main animation
- 800-1200ms: Fade to dashboard
- Total: ~1.2 seconds

#### 4. Factory Logos
**15 factories (PNG files will be provided):**
1. AMT - AMTEX
2. BUSA - Britco USA
3. C&B - C&B Modular
4. IBI - Indicom Buildings
5. MRS - MR Steel
6. NWBS - Northwest Building Systems
7. PMI - Phoenix Modular
8. PRM - Pro-Mod Manufacturing
9. SMM - Southeast Modular
10. SNB - Sunbelt Modular (Corporate) - CENTER
11. SSI - Specialized Structures
12. WM-EAST - Whitley Manufacturing East
13. WM-EVERGREEN - Whitley Manufacturing Evergreen
14. WM-ROCHESTER - Whitley Manufacturing Rochester
15. WM-SOUTH - Whitley Manufacturing South

**Note:** PNG logos will be provided separately. For development, use placeholder circles with factory abbreviations.

### Technical Notes

#### File Location
- `src/components/auth/Login.jsx` - Main login component

#### CSS Variables to Use
```css
--bg-primary: #0f172a
--bg-secondary: #1e293b
--sunbelt-orange: #f97316
--sunbelt-orange-dark: #ea580c
--text-primary: #f1f5f9
--text-secondary: #94a3b8
```

#### Animation Libraries (Optional)
- CSS animations preferred for simplicity
- Framer Motion available if needed
- Keep bundle size in mind

#### Responsive Considerations
- Ring should scale appropriately on smaller screens
- Minimum viable on 1280x720
- Optimal on 1920x1080

### Acceptance Criteria

- [ ] Login form centered on screen
- [ ] Sunbelt logo prominently displayed
- [ ] Factory logos arranged in ring
- [ ] Ring rotates slowly in idle state
- [ ] Login triggers random animation (Convergence OR Launch)
- [ ] Animation is smooth (60fps)
- [ ] Transitions seamlessly to dashboard
- [ ] Works on 1080p laptop screens
- [ ] No console errors
- [ ] Follows existing code patterns

### Placeholders Until Logos Provided

```jsx
// Placeholder factory data
const FACTORIES = [
  { id: 'amt', name: 'AMTEX', abbrev: 'AMT', color: '#3b82f6' },
  { id: 'busa', name: 'Britco USA', abbrev: 'BUSA', color: '#8b5cf6' },
  // ... etc
];

// Placeholder logo component
const FactoryLogo = ({ factory, size = 48 }) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    background: factory.color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
    fontSize: size * 0.3
  }}>
    {factory.abbrev}
  </div>
);
```

### Handoff Checklist

When complete, provide:
- [ ] `Login.jsx` - Complete updated component
- [ ] Any new CSS if needed
- [ ] Any new utility files
- [ ] Notes on implementation decisions
- [ ] Known limitations or edge cases

---

## 🛠️ Reference Materials for Agent

**Always reference these when building:**

1. **Project Instructions**
   - Code comment nomenclature
   - Database conventions
   - Component patterns
   - CSS variables

2. **Existing Components**
   - `Login.jsx` - Current login (simple)
   - `PMDashboard.jsx` - Layout patterns
   - `Sidebar.jsx` - Animation examples

3. **CSS Variables**
   - Located in `App.css`
   - Dark theme is default
   - Orange is brand color

---

## 📝 Communication & Status Updates

### Daily Check-ins
**Time:** Morning (async)  
**Format:** Brief summary  
**Topics:**
- What was completed yesterday
- What's blocked (if anything)
- What's happening today
- Any clarifications needed

### When Blockers Arise
**Process:**
1. Agent flags issue immediately
2. Matthew reviews in Projects
3. Quick discussion/solution
4. Agent resumes with clarity

### Final Handoff
**Checklist:**
- [ ] All features working
- [ ] Comments complete
- [ ] No console errors
- [ ] Code review ready
- [ ] Dependencies documented
- [ ] Any gotchas noted

---

## ✅ Definition of Done

Feature is ready for Matthew review when:

1. **Code Quality**
   - [ ] Follows all project instructions
   - [ ] Comprehensive comments throughout
   - [ ] No console warnings/errors
   - [ ] Consistent styling

2. **Functionality**
   - [ ] All requirements met
   - [ ] No edge cases ignored
   - [ ] Error handling in place
   - [ ] Loading states shown

3. **Testing**
   - [ ] Manual testing done
   - [ ] Different roles tested
   - [ ] Mobile responsive
   - [ ] Data validation working

4. **Documentation**
   - [ ] Code comments clear
   - [ ] Any gotchas documented
   - [ ] Database changes noted
   - [ ] Dependencies listed

---

## 🚀 Expected Timeline

| Phase | Duration | Owner |
|-------|----------|-------|
| Planning | 30 min | Matthew |
| Agent Development | 2-4 hrs | Agent |
| Review & Refine | 30-60 min | Matthew |
| Integration | 30 min | Matthew |
| **Total** | **~4-6 hrs** | **Both** |

---

## 📚 How to Use This Workflow

### For Matthew (Bug Fixing)
1. Check current feature being built
2. Work on Phase 3 bugs/polish
3. Check in with agent progress
4. When feature code arrives → Review & integrate
5. Repeat

### For Agent (Feature Building)
1. Get feature spec from this document
2. Reference Project instructions
3. Build complete feature set
4. Test thoroughly
5. Hand off to Matthew for review
6. Make refinements if needed
7. Repeat

### For Both
1. **Follow project instructions** - Non-negotiable
2. **Communicate blockers early** - Don't wait
3. **Reference existing patterns** - Consistency matters
4. **Document decisions** - Future work depends on it
5. **Test edge cases** - Quality first

---

## 🔄 Next Steps

1. ✅ Create this workflow document
2. ⭐ **Claude Code:** Start Login Screen Enhancement
3. ⭐ **Matthew:** Continue Phase 3 bug fixes (Secondary PM, Status Squares)
4. ⭐ When login complete → Matthew reviews & integrates
5. ⭐ Move to next feature (Project Coordinator Dashboard)

---

## 📌 Notes

- This workflow assumes both Matthew and Agent are working async
- Clear documentation = faster iteration
- Ask for clarification early > Fix issues late
- Maintain quality over speed
- Factory logos will be provided - use placeholders until then

---

*Last Updated: January 9, 2026*  
*Current Task: Login Screen Enhancement (Claude Code)*
