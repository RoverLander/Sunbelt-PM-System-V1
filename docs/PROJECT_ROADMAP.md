# Project Roadmap

**Last Updated:** January 12, 2026

This document outlines planned features, improvements, and technical debt items for the Sunbelt PM System.

---

## Priority Levels

- **P0** - Critical / Immediate
- **P1** - High Priority / Next Sprint
- **P2** - Medium Priority / Near Term
- **P3** - Low Priority / Future Consideration

---

## Upcoming Features

### Factory Map Visualization (P1) 🚧

**Status:** Architecture pivot in progress - migrating to standalone implementation

**Standalone Repository**
- [ ] Create separate GitHub repo: `sunbelt-factory-map`
- [ ] Extract PIXI.js code from main app (layers, sprites, systems)
- [ ] Build vanilla JavaScript entry point
- [ ] Implement data fetching via Supabase API
- [ ] Deploy as standalone web app

**Core Features**
- [ ] Interactive USA map with 14 factory locations
- [ ] Real-time project status visualization
- [ ] Delivery routes and animated trucks
- [ ] Construction site progression tracking
- [ ] Zoom/pan controls (working!)
- [ ] LOD (Level of Detail) system for performance

**Visual Features**
- [ ] Studio Ghibli-style factory sprites (AI-generated)
- [ ] Animated smoke from factories
- [ ] Day/night cycle (optional)
- [ ] Weather effects (optional)
- [ ] Celebration particles on delivery completion

**Integration**
- [ ] Link from main app dashboard
- [ ] OR: Embed via iframe
- [ ] Authentication token passing
- [ ] Data sync with main Supabase database

**Documentation**
- ✅ Design specifications completed
- ✅ Sprite generation guides completed
- ✅ Standalone implementation plan completed
- [ ] Developer setup guide
- [ ] Deployment guide

**Timeline:** Estimated 1-2 weeks for MVP (8-12 hours focused development)

See: [FACTORY_MAP_STANDALONE_PLAN.md](FACTORY_MAP_STANDALONE_PLAN.md) for complete implementation details

---

### Notifications & Alerts (P1)

**Email Notifications**
- [ ] Task assignment notifications
- [ ] RFI/Submittal due date reminders (3 days, 1 day before)
- [ ] Overdue item alerts
- [ ] Status change notifications
- [ ] Daily/weekly digest option

**In-App Notifications**
- [ ] Notification bell in header
- [ ] Notification dropdown panel
- [ ] Mark as read functionality
- [ ] Notification preferences per user

### Real-Time Updates (P1)

- [ ] Supabase Realtime subscriptions
- [ ] Live project status updates
- [ ] Collaborative editing indicators ("User X is editing...")
- [ ] Instant task status sync across users

### Reporting & Analytics (P1)

**Dashboard Enhancements**
- [ ] Customizable dashboard widgets
- [ ] Date range filters for metrics
- [ ] Trend charts (projects over time)
- [ ] Factory comparison charts

**Export Reports**
- [ ] Project summary PDF export
- [ ] Task log Excel export
- [ ] Milestone report
- [ ] Custom date range reports
- [ ] Scheduled report generation

### Mobile Application (P2)

**React Native App**
- [ ] iOS and Android support
- [ ] Offline-first architecture
- [ ] Push notifications
- [ ] Camera integration for site photos
- [ ] Barcode/QR scanning for equipment
- [ ] GPS location tagging

**Mobile-Specific Features**
- [ ] Quick task creation
- [ ] Voice-to-text notes
- [ ] Photo markup tools
- [ ] Offline task queue

### Document Management (P2)

**Enhanced File System**
- [ ] Folder organization structure
- [ ] File versioning
- [ ] Document preview (PDF, images)
- [ ] Bulk upload
- [ ] Drag-and-drop upload zones

**Document Generation**
- [ ] Transmittal letter generation
- [ ] RFI response templates
- [ ] Submittal cover sheets
- [ ] Custom letterhead support

### Advanced Search (P2)

- [ ] Global search across all entities
- [ ] Search by file contents (OCR)
- [ ] Saved search filters
- [ ] Recent searches history
- [ ] Advanced filter builder

### Integration Capabilities (P2)

**Potential Integrations**
- [ ] Microsoft 365 (Outlook, Teams)
- [ ] Google Workspace
- [ ] Procore (construction management)
- [ ] QuickBooks (accounting)
- [ ] Smartsheet
- [ ] Slack notifications

**API Development**
- [ ] RESTful API endpoints
- [ ] API documentation
- [ ] Webhook support
- [ ] API key management

### Collaboration Features (P2)

- [ ] Comments/discussion threads on items
- [ ] @mention functionality
- [ ] Activity feed per project
- [ ] Team chat integration
- [ ] Shared project notes

### Time Tracking (P3)

- [ ] Time entry on tasks
- [ ] Timer functionality
- [ ] Time reports by project/user
- [ ] Labor cost tracking
- [ ] Timesheet approval workflow

### Resource Management (P3)

- [ ] Team capacity planning
- [ ] Resource allocation calendar
- [ ] Workload balancing suggestions
- [ ] Vacation/PTO tracking
- [ ] Skill matrix

### Quality Control (P3)

- [ ] QC checklist templates
- [ ] Inspection scheduling
- [ ] Deficiency tracking
- [ ] Photo documentation
- [ ] QC sign-off workflow

### Financial Features (P3)

- [ ] Budget tracking per project
- [ ] Change order management
- [ ] Invoice tracking
- [ ] Payment milestone linking
- [ ] Profit/loss reports

---

## Technical Improvements

### Performance (P1)

- [ ] Code splitting for faster initial load
- [ ] Lazy loading of tab content
- [ ] Image optimization and lazy loading
- [ ] Caching strategy for frequently accessed data
- [ ] Virtual scrolling for large lists

### Testing (P1)

- [ ] Unit tests for utility functions
- [ ] Component tests with React Testing Library
- [ ] Integration tests for critical flows
- [ ] E2E tests with Playwright/Cypress
- [ ] Test coverage reporting

### Code Quality (P2)

- [ ] TypeScript migration
- [ ] ESLint strict mode
- [ ] Prettier formatting
- [ ] Husky pre-commit hooks
- [ ] Component documentation (Storybook)

### Security (P1)

- [ ] Row Level Security audit
- [ ] Input sanitization review
- [ ] CSRF protection verification
- [ ] Security headers configuration
- [ ] Penetration testing

### Infrastructure (P2)

- [ ] CI/CD pipeline setup
- [ ] Staging environment
- [ ] Database backup automation
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring (Analytics)

### Accessibility (P2)

- [ ] WCAG 2.1 AA compliance audit
- [ ] Keyboard navigation improvements
- [ ] Screen reader testing
- [ ] Color contrast verification
- [ ] Focus management

---

## Technical Debt

### High Priority
- [ ] Consolidate duplicate modal components
- [ ] Extract common table/list components
- [ ] Standardize form validation patterns
- [ ] Reduce component prop drilling
- [ ] Clean up unused CSS variables

### Medium Priority
- [ ] Convert inline styles to CSS classes
- [ ] Implement proper error boundaries
- [ ] Add loading skeletons
- [ ] Optimize re-renders with memo/useMemo
- [ ] Split large components (ProjectDetails)

### Low Priority
- [ ] Remove console.log statements
- [ ] Add JSDoc comments
- [ ] Organize imports consistently
- [ ] Create shared constants file
- [ ] Refactor date handling utilities

---

## Version Planning

### v1.1.0 (Target: February 2026)
- Email notifications for assignments
- Excel export for tasks
- Performance optimizations
- Bug fixes from user feedback

### v1.2.0 (Target: March 2026)
- Real-time updates
- Comments/discussions
- Enhanced reporting
- Mobile-responsive improvements

### v1.3.0 (Target: April 2026)
- Document management enhancements
- Advanced search
- API foundation

### v2.0.0 (Target: Q3 2026)
- Mobile application release
- Full integration suite
- Advanced analytics
- Multi-language support

---

## Feedback & Requests

User feedback and feature requests are tracked through:
- GitHub Issues
- Internal feedback form
- Weekly PM meetings

---

## Notes

This roadmap is subject to change based on:
- Business priorities
- User feedback
- Resource availability
- Technical discoveries

Regular reviews occur monthly to adjust priorities.
