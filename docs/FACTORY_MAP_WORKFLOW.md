# Factory Map - Workflow & Implementation Process

## Development Philosophy

Build a **working, functional system first** using programmatic PIXI Graphics, then replace with high-quality pixel art sprites created by design AI tools.

**Advantages:**
- Get immediate feedback on interactions and animations
- Test game mechanics before investing in art
- Provide working reference for artists/AI
- Iterate on functionality quickly
- Ensure technical feasibility

---

## Implementation Phases

### Phase 1: Core Foundation ✅ (Weeks 1-2)

**Goal:** Get the basic map rendering and factory placement working

**Tasks:**
- [x] Initialize PIXI.js application
- [x] Create USMapLayer with simplified USA outline
- [x] Place all 14 factories at correct coordinates
- [x] Implement basic pan/zoom controls
- [x] Create FactorySprite with isometric building
- [x] Add factory labels and basic styling

**Deliverables:**
- Navigable map of USA
- All factories visible and clickable
- Basic hover tooltips

**Testing Criteria:**
- Map renders without errors
- Can pan and zoom smoothly
- Factories appear in correct locations
- Click events fire properly

---

### Phase 2: Routes & Movement (Weeks 3-4)

**Goal:** Add delivery routes and animated trucks

**Tasks:**
- [ ] Implement RoutesLayer with bezier curves
- [ ] Create route states (scheduled, active, completed)
- [ ] Build TruckSprite with modular trailer design
- [ ] Implement truck movement along route paths
- [ ] Add route animations (dashing, pulsing)
- [ ] Connect routes to project data

**Deliverables:**
- Routes visible connecting factories to job sites
- Trucks animate along routes
- Route highlighting on factory hover

**Testing Criteria:**
- Trucks follow bezier curves smoothly
- Routes change color based on status
- Multiple trucks can be active simultaneously
- Performance acceptable with 20+ active routes

---

### Phase 3: Job Sites & Progression (Weeks 5-6)

**Goal:** Add construction sites with progressive stages

**Tasks:**
- [ ] Create JobSiteSprite with 5 stages
- [ ] Implement stage progression logic
- [ ] Add celebration particles on delivery
- [ ] Implement 60-day fade-out system
- [ ] Connect to project lifecycle data

**Job Site Stages:**
1. Dirt patch (project created)
2. Dirt + equipment (early progress)
3. Foundation visible (mid progress)
4. Modular building (online/delivered)
5. Completed building → fade after 60 days

**Deliverables:**
- Job sites appear at delivery locations
- Sites progress through visual stages
- Completion effects trigger correctly
- Old sites fade out appropriately

**Testing Criteria:**
- Stage transitions match project milestones
- Celebration particles look good
- No memory leaks from old sites
- Performance acceptable with 100+ sites

---

### Phase 4: Interactions & UI (Weeks 7-8)

**Goal:** Polish user interactions and add detail panels

**Tasks:**
- [ ] Implement hover tooltips for all elements
- [ ] Create click action menus
- [ ] Build factory detail panel (slides in from right)
- [ ] Build project detail panel
- [ ] Add PM portrait sidebar
- [ ] Implement keyboard shortcuts (1-9, arrows, etc.)
- [ ] Add route highlighting system
- [ ] Create quick action buttons

**Deliverables:**
- Rich tooltips on hover
- Detail panels with project info
- PM health visualization
- Full keyboard navigation
- Smooth UI transitions

**Testing Criteria:**
- Tooltips don't obscure important elements
- Panels load quickly (<500ms)
- Keyboard shortcuts work reliably
- PM portraits update correctly
- Permission system enforced

---

### Phase 5: Polish & Ambient (Weeks 9-10)

**Goal:** Add atmospheric elements and environmental effects

**Tasks:**
- [ ] Implement day/night cycle (toggleable)
- [ ] Add cloud animations
- [ ] Create bird flocks
- [ ] Add regional terrain features
  - Mountains (Rockies, Appalachians)
  - Rivers (Mississippi, etc.)
  - Forests (animated trees)
  - Deserts (heat shimmer, cacti)
- [ ] Integrate weather API
- [ ] Add sound effects and music (optional)
- [ ] Optimize LOD system

**Deliverables:**
- Dynamic day/night visual changes
- Ambient animations (clouds, birds)
- Weather effects (rain, snow)
- Regional character and detail
- Audio system (if requested)

**Testing Criteria:**
- Animations don't impact FPS significantly
- Day/night transition is smooth
- Weather effects are subtle, not distracting
- Regional details match geography

---

### Phase 6: Advanced Features & Refinement (Weeks 11-12)

**Goal:** Add finishing touches and optimize performance

**Tasks:**
- [ ] Refine LOD system thresholds
- [ ] Implement permission-based filtering
- [ ] Add analytics integration
- [ ] Create historical playback mode (optional)
- [ ] Mobile responsiveness (if needed)
- [ ] Performance profiling and optimization
- [ ] Bug fixes and edge cases
- [ ] User acceptance testing

**Deliverables:**
- Smooth performance at all zoom levels
- Permission system fully functional
- Analytics tracking events
- Polished, production-ready system

**Testing Criteria:**
- 60 FPS maintained at medium zoom
- No console errors or warnings
- Memory usage stable over time
- Works on target devices/browsers

---

## Art Asset Creation Workflow

### Step 1: Working Prototype
Build functional system with PIXI Graphics (Phases 1-3)

### Step 2: Document Specifications
Create detailed sprite requirement docs (see FACTORY_MAP_SPRITE_SPECS.md)

### Step 3: Generate with AI
Use design AI tools to create pixel art assets:

**Tools:**
- Midjourney (style consistency)
- DALL-E 3 (via ChatGPT Plus)
- Stable Diffusion (free, customizable)

**Prompts:** (See design spec doc for detailed prompts)

### Step 4: Post-Processing
- Extract sprites from generated images
- Create sprite sheets / texture atlases
- Optimize file sizes (PNG compression)
- Generate JSON metadata

### Step 5: Integration
- Replace PIXI Graphics with Sprite instances
- Load texture atlases
- Update sprite dimensions
- Test animations with new assets

### Step 6: Iteration
- Gather feedback
- Refine problematic assets
- Ensure visual consistency
- Final polish pass

---

## Daily Development Workflow

### Morning Routine
1. Pull latest code from git
2. Review open issues/tasks
3. Run dev server: `npm run dev`
4. Verify map loads without errors
5. Pick highest priority task

### Development Loop
1. **Write code** - Implement feature
2. **Test locally** - Verify in browser
3. **Check console** - No errors/warnings
4. **Test interactions** - Click, hover, keyboard
5. **Check performance** - Monitor FPS
6. **Commit changes** - Descriptive message

### Testing Checklist
Before committing:
- [ ] Map renders correctly
- [ ] No console errors
- [ ] Hover tooltips work
- [ ] Click events fire
- [ ] Zoom/pan smooth
- [ ] Performance acceptable (>30 FPS)
- [ ] No visual glitches

### End of Day
1. Commit work in progress
2. Push to git
3. Update project board/tasks
4. Document any blockers
5. Plan next day's tasks

---

## Git Workflow

### Branch Strategy
```
main
├── dev (development branch)
└── feature/factory-animations
```

### Commit Message Format
```
<type>: <description>

Examples:
feat: Add truck movement along bezier paths
fix: Correct factory positioning for Atlanta
refactor: Extract route drawing into helper function
style: Improve factory sprite visual details
docs: Update technical architecture document
perf: Optimize LOD system for better performance
```

### Pull Request Process
1. Create feature branch
2. Implement feature
3. Test thoroughly
4. Create PR with description
5. Self-review changes
6. Merge to dev
7. Deploy to staging
8. Test on staging
9. Merge to main (production)

---

## Testing Strategy

### Manual Testing
**Every commit:**
- Load map in browser
- Pan and zoom around
- Click all factory types
- Hover over elements
- Try keyboard shortcuts
- Check console for errors

**Every feature:**
- Test happy path
- Test edge cases
- Test error handling
- Test with real data
- Test performance

### Automated Testing (Future)
```javascript
describe('FactorySprite', () => {
  it('should render with correct position', () => {
    const sprite = new FactorySprite(factoryData);
    expect(sprite.position.x).toBe(expected.x);
  });

  it('should emit hover event', () => {
    const sprite = new FactorySprite(factoryData);
    const handler = jest.fn();
    sprite.on('factory:hover', handler);
    sprite.emit('factory:hover', {});
    expect(handler).toHaveBeenCalled();
  });
});
```

### Performance Testing
Monitor these metrics:
- **FPS:** Target 60 at medium zoom, 30+ at max zoom
- **Memory:** Stable over time, no leaks
- **Load Time:** <3 seconds initial render
- **Interaction Latency:** <100ms response time

Tools:
- Chrome DevTools Performance tab
- PIXI.js stats plugin
- Memory profiler
- Network throttling

---

## Debugging Workflow

### Common Issues

#### "Nothing renders / black screen"
```javascript
// Check PIXI initialization
console.log('[Debug] PIXI app:', appRef.current);
console.log('[Debug] Stage children:', app.stage.children);

// Check layer creation
console.log('[Debug] Layers:', layersRef.current);

// Check sprite creation
console.log('[Debug] Factories:', factoriesLayer.factories);
```

#### "Factories not clickable"
```javascript
// Verify eventMode is set
sprite.eventMode = 'static';  // NOT 'passive' or undefined

// Check hitArea
sprite.hitArea = new PIXI.Rectangle(-40, -40, 80, 80);

// Verify event listeners
sprite.on('pointertap', handler);  // NOT 'click'
```

#### "Animations choppy / low FPS"
```javascript
// Check LOD system
console.log('[Debug] LOD level:', lodManager.currentTier);

// Disable expensive effects
// - Particle systems
// - Complex animations
// - High sprite counts

// Monitor draw calls
console.log('[Debug] Draw calls:', app.renderer.textureGC.count);
```

#### "Routes not appearing"
```javascript
// Check route data
console.log('[Debug] Routes:', routesLayer.routes);

// Verify positions
console.log('[Debug] From:', from, 'To:', to);

// Check Graphics API usage
graphics.rect(...).fill(...); // Chained, not separated
```

---

## Performance Optimization Checklist

### Graphics Optimization
- [ ] Use texture atlases for sprites
- [ ] Batch similar sprites together
- [ ] Cull off-screen sprites
- [ ] Use object pooling for particles
- [ ] Minimize draw state changes

### Animation Optimization
- [ ] LOD system active and tested
- [ ] Throttle expensive updates
- [ ] Use requestAnimationFrame wisely
- [ ] Disable animations when off-screen
- [ ] Limit particle counts

### Memory Optimization
- [ ] Destroy sprites when removed
- [ ] Clear event listeners
- [ ] Release texture references
- [ ] Monitor memory usage over time
- [ ] Profile for leaks

### Code Optimization
- [ ] Avoid creating objects in loops
- [ ] Cache frequently used values
- [ ] Use efficient data structures
- [ ] Minimize string concatenation
- [ ] Profile hot paths

---

## Documentation Standards

### Code Comments
```javascript
/**
 * FactorySprite - Interactive factory marker on the map
 *
 * Features:
 * - Isometric 3D building design
 * - Animated smoke from smokestacks
 * - Glowing windows when active
 * - Hover and click interactions
 *
 * States:
 * - Idle: Slow smoke, dark windows
 * - Active: Fast smoke, glowing windows, orange aura
 *
 * Events:
 * - factory:hover - Mouse enters bounds
 * - factory:click - User clicks factory
 */
export class FactorySprite extends PIXI.Container {
  // ...
}
```

### Function Comments
```javascript
/**
 * Update sprite position along bezier curve
 *
 * @param {number} progress - Position along curve (0.0 - 1.0)
 * @returns {void}
 */
updatePosition(progress) {
  // Implementation
}
```

### Inline Comments
```javascript
// Only for complex logic:
// Calculate quadratic bezier point using formula:
// B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
const x = (1-t)*(1-t)*from.x + 2*(1-t)*t*control.x + t*t*to.x;
```

---

## Collaboration Guidelines

### Code Reviews
Focus on:
- Correctness (does it work?)
- Performance (is it fast?)
- Maintainability (is it clear?)
- Consistency (matches style?)
- Testing (is it tested?)

### Communication
- Use descriptive commit messages
- Document decisions in comments
- Update technical docs when architecture changes
- Raise blockers early
- Share progress updates

### Knowledge Sharing
- Pair programming for complex features
- Code walkthroughs for new systems
- Brown bag sessions for best practices
- Document tribal knowledge

---

## Release Checklist

### Pre-Release
- [ ] All features implemented
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Performance targets met
- [ ] Browser compatibility verified
- [ ] Accessibility checked
- [ ] Documentation updated

### Release Process
1. Create release branch
2. Final QA testing
3. Update version number
4. Generate changelog
5. Tag release in git
6. Deploy to staging
7. Smoke test on staging
8. Deploy to production
9. Monitor for issues
10. Announce release

### Post-Release
- Monitor error logs
- Track performance metrics
- Gather user feedback
- Create follow-up issues
- Plan next sprint

---

## Maintenance & Support

### Monitoring
- Error tracking (Sentry, etc.)
- Performance monitoring
- User analytics
- API health checks

### Regular Tasks
- Review error logs daily
- Update dependencies monthly
- Performance audits quarterly
- Security patches as needed

### User Support
- Provide troubleshooting guide
- Create FAQ document
- Offer training sessions
- Collect feature requests

---

## Continuous Improvement

### Retrospectives
After each phase:
- What went well?
- What could be better?
- Action items for next phase

### Metrics to Track
- Development velocity
- Bug count
- User satisfaction
- Performance trends
- Code quality scores

### Learning Goals
- Master PIXI.js best practices
- Improve animation techniques
- Optimize for mobile
- Enhance accessibility
- Refine UX patterns

---

*Document Version: 1.0*
*Last Updated: 2026-01-11*
