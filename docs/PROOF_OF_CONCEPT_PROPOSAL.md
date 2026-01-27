# Sunbelt PM System: A Proof of Concept

## What This Is (And What It Isn't)

---

**TO:** For internal discussion
**FROM:** Matthew McDaniel
**DATE:** January 21, 2026
**STATUS:** Draft for peer review

---

## Where I'm Coming From

I have a B.S. in Construction Management from Cal State East Bay, and before transitioning to construction, I served as a Military Intelligence Analyst with combat deployments. My job was to take fragmented information from multiple sources, synthesize it into actionable intelligence, and present it so commanders could make decisions quickly and confidently.

That experience taught me that **information is a force multiplier**. The unit with better situational awareness - real-time visibility, accurate data, clear picture of what's happening - has a decisive advantage. The same principle applies in business: organizations that can see what's happening across their operations in real-time make better decisions than those piecing together information from spreadsheets, phone calls, and tribal knowledge.

That's the lens through which I built this system: How do we give leadership at every level the visibility they need to make good decisions fast?

---

## The Honest Context

I want to be transparent about what I built, what I know, and what I was guessing at.

### What Praxis Does Well

First, let me acknowledge: **Praxis is a serious piece of software.** The team that built it created something that handles real business complexity:

- Sophisticated quoting and pricing logic
- Customer and dealer relationship management
- Building specifications, compliance flags, and configuration options
- Cost tracking and financial calculations
- Years of business rules encoded and refined over time

This isn't a simple database - it's institutional knowledge made executable. The people who built and maintain it should be proud of what they've created.

### What I Know Well

- Project Management workflows (my daily job)
- PM pain points, handoff challenges, tracking needs
- What visibility would help me and my colleagues do our jobs better

### What I Approximated

- Production floor operations (based on plant walks, PGM conversations, observation)
- Sales pipeline workflows (based on interactions with sales team, seeing quotes come through)
- Factory-specific processes (educated guesses)

**I don't pretend to understand these areas as well as the people who do them every day.** The production and sales portions of what I built are demonstrations of capability, not accurate representations of how Sunbelt actually operates.

---

## The Point of This Project

This project was two things:

### 1. A Functional PM Tool (Built from Experience)
The project management side - tasks, RFIs, submittals, workflows, dashboards - is built from firsthand knowledge. I use these workflows. I know the pain points. This part is grounded in real experience.

### 2. A Capability Demonstration (For Discussion)
The production tracking, OEE calculations, crew management, sales pipeline - these demonstrate *what modern tools can do*, not *how Sunbelt should do it*. They're sketches, not blueprints.

The implicit question is:

> "If this is what one person can build with modern tools and educated guesses, what could we build if we actually partnered with the people who know these processes deeply?"

---

## What I'm NOT Saying

Let me be explicit about what this is NOT:

| NOT This | But Rather This |
|----------|-----------------|
| "Throw away Praxis" | "Here's what modern tools can do" |
| "My system is better" | "My system is a proof of concept" |
| "The business logic is wrong" | "I was guessing at business logic I don't fully know" |
| "IT doesn't know what they're doing" | "IT built something that works; I built something different" |
| "We need to change immediately" | "I think it's worth discussing the future" |

---

## What Building "For Real" Would Require

If Sunbelt ever wanted to build a modern system that truly captures how the business operates - whether as a Praxis replacement, extension, or parallel tool - here's what would be needed:

### The Most Important Input: People Who Know the Business

The technology is the easy part. The hard part is capturing what people know:

| Department | What They Know That I Don't |
|------------|----------------------------|
| **Sales / Praxis Team** | Quote logic, pricing rules, dealer structures, approval workflows, edge cases, why things are the way they are |
| **Production / Plant GMs** | Real station sequences, actual durations, QC requirements, scheduling constraints, crew dynamics |
| **Operations / PMs** | Project lifecycle nuances, handoff triggers, document requirements, what actually causes delays |
| **Finance** | Cost structures, budget categories, reporting needs, compliance requirements |

**This knowledge exists.** Much of it is in Praxis. Much of it is in people's heads. A real project would need to extract and document it - which is valuable work regardless of what technology platform it ends up in.

### Documentation That Would Help Any Future Effort

1. **Business Process Maps** - How does work actually flow?
2. **Business Rules** - What are the calculations, triggers, and logic?
3. **Data Dictionary** - What does each field mean? What are valid values?
4. **Exception Handling** - What are the edge cases? How are they handled?

This documentation would be valuable whether Sunbelt:
- Stays on Praxis forever
- Migrates to Power Platform someday
- Builds something custom
- Gets acquired and needs to integrate

---

## About the Tools I Used

I used an AI coding assistant (Claude Code) to help build this. I want to address that directly.

### What It Actually Is

Think of it like a very knowledgeable colleague who:
- Knows a lot about programming patterns and best practices
- Can write code quickly based on my descriptions
- Suggests approaches I might not have thought of
- Makes me more productive, not more capable of magic

### What It Actually Does

| I Describe | The Tool Helps With |
|------------|---------------------|
| "I need a dashboard showing project status by factory" | Suggesting component structure, writing the code, handling edge cases |
| "This should export to Excel" | Writing the export function using standard libraries |
| "How should I handle user authentication?" | Explaining options, recommending industry-standard approaches |

### What It Does NOT Do

- ❌ Know anything about Sunbelt's business (I had to describe everything)
- ❌ Make decisions about what to build (that's my judgment)
- ❌ Create hidden functionality (all code is visible and reviewable)
- ❌ Send data anywhere (it helps write code; the code runs on infrastructure we control)

### The Analogy

Using AI coding tools is like using a calculator for accounting. The calculator doesn't understand your business, doesn't make financial decisions, and doesn't send your numbers anywhere. It just makes the math faster. You still need an accountant who understands the business.

AI coding assistants make the coding faster. You still need someone who understands the business to direct what gets built and verify it's correct.

### Industry Context

This isn't fringe technology. Microsoft (GitHub Copilot), Google, Amazon, and most major tech companies have integrated AI coding assistants into their standard workflows. It's increasingly how software gets built.

### Open to Scrutiny

The complete source code is available for review. Every line, every file, every dependency. I welcome and encourage anyone to inspect it - whether internal IT staff or external security reviewers. There's nothing hidden because there's nothing to hide.

---

## What I Think Is Worth Discussing

Separate from my specific project, I think there are questions worth considering:

1. **Is institutional knowledge documented?**
   - Not to replace Praxis, but as insurance
   - What happens if key people leave unexpectedly?

2. **What's the long-term platform trajectory?**
   - Not urgent, but worth understanding
   - What would a migration look like if it ever became necessary?

3. **Are there pain points that current tools don't address well?**
   - Gaps that could be filled without replacing anything
   - "Both/and" rather than "either/or"

4. **How does our infrastructure look from the outside?**
   - Relevant for any future M&A considerations
   - What would a buyer see during due diligence?

These are honest questions, not rhetorical ones. I might be wrong about the importance of any of them.

---

## What I'm Asking For

Honestly? Just consideration.

- **Consider** that modern development tools have changed what's possible
- **Consider** that documenting institutional knowledge has value regardless of technology decisions
- **Consider** that the person raising concerns might be seeing something worth discussing, even if the proposed solution isn't right

I'm not asking anyone to abandon what works. I'm asking for a conversation about the future.

---

## Closing

I built this because I saw problems I wanted to solve in my own work. I extended it to other areas because I wanted to explore what was possible. I shared it because I thought it might spark useful discussion.

If the answer is "not now," "not this way," or "you're missing important context," I'm open to hearing that. I'd rather understand why I'm wrong than continue being wrong.

Thanks for taking the time to consider this.

---

**Matthew McDaniel**
Project Manager
matthew.mcdaniel@sunbeltmodular.com

---

## Appendix: What I Actually Built (Technical Summary)

For those interested in the technical details:

### Technology Stack
- **Frontend:** React 18, Vite, Lucide Icons
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Mobile:** Progressive Web App (works offline)

### Scope
- 8 role-based dashboards (VP, Director, PM, PC, Plant Manager, Sales Rep, Sales Manager, IT)
- 2 mobile PWA apps (Floor workers, Managers)
- 30+ database tables
- ~15,000 lines of code
- 100+ components

### What Works Well (PM Side)
- Project tracking and status management
- Task, RFI, and Submittal workflows
- Floor plan viewer with markers
- Calendar and timeline views
- Excel exports

### What's Approximated (Production/Sales Side)
- Production station flow and OEE calculations
- Crew scheduling and time tracking
- Sales pipeline and quote management
- These demonstrate capability but don't reflect actual Sunbelt processes

### Code Availability
Complete source code available for review upon request.
