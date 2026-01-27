# DRAFT - For Peer Review Before Distribution

**Reviewing with:** Crystal
**Purpose:** Gut check before deciding whether/how to share more broadly
**Please be honest:** Is this helpful? Tone-deaf? Worth pursuing? Bad timing?

---

# Thoughts on IT Infrastructure & Long-Term Risk

**FROM:** Matthew McDaniel
**DATE:** January 21, 2026
**STATUS:** DRAFT - Seeking feedback from trusted colleagues

---

## A Note on My Perspective

Before I get into the substance, I want to share where I'm coming from - because I think some people may see me as "the new PM with opinions" without knowing my background.

**Military:**
- Military Intelligence Analyst with a combat deployment to an active War Zone (Iraq)
- Trained to collect, synthesize, and present information so commanders could make better decisions faster

**Education & Construction:**
- B.S. in Construction Management, Cal State East Bay
- **Whiting-Turner Contracting** – Field PM using Procore on active commercial jobsites. I've used enterprise construction management software at scale, in the field, on real projects. I know what that visibility looks like when it works.
- **Mobile Modular** – PM at a direct competitor in the modular space. I've seen how other companies in this exact industry approach technology and project management.

I'm not a recent grad guessing at how things should work. I've used modern systems in high-stakes environments - both military and commercial construction. I've seen the difference between organizations with real-time information access and those piecing things together from spreadsheets and phone calls.

That experience taught me: **information is a force multiplier.**
- Fragmented information = slower decisions = missed opportunities
- Centralized, accessible data = faster decisions = competitive advantage
- Information locked in one person's head = single point of failure = operational risk

I'm not saying Sunbelt is doing it wrong. I'm saying I've seen what "different" looks like, and I think it's worth discussing.

---

## Why I'm Writing This

I recently presented a project management tool I built to IT leadership and the VP of Operations. The reception was polite but clear: Praxis is the path forward, and there's skepticism about alternative approaches.

I respect that decision. But I have some concerns I want to document - not to push my project, but because I think there are risks worth discussing. I'm sharing this draft with a few trusted colleagues first to get your honest feedback before deciding whether to formalize it.

**Crystal** - I especially value your perspective. You know the company, the players, and when it's worth raising something vs. letting it go. Please be blunt.

---

## What I Want to Be Clear About

### Praxis Works

Let me be unambiguous: **Praxis works.** The people who built it created something that handles real business complexity:

- Quoting logic and pricing calculations
- Customer and dealer relationships
- Building specifications and compliance requirements
- Cost tracking and financial data
- Years of institutional knowledge encoded into the system

This isn't a toy. It's a production system that runs a significant portion of the business. The people who built and maintain it should be proud of that.

**I am not saying Praxis is bad or that the team is incompetent.**

### My Concern Is Different

My concern isn't about what Praxis *does*. It's about:

1. **The platform it's built on** (Microsoft Access)
2. **The concentration of knowledge** (who can maintain it?)
3. **The trajectory of the technology industry** (where is this headed?)

These are platform and people risks, not logic or competence risks.

---

## The Three Risks

### Risk 1: Platform Trajectory

Microsoft Access is in maintenance mode. Microsoft's investment is in Power Platform (Power Apps, Power BI, Dataverse).

| Evidence | What It Suggests |
|----------|------------------|
| No significant Access features since 2016 | Platform is stable but not evolving |
| Power Platform marketed as "Access modernization path" | Microsoft sees Access as legacy |
| Access 2016/2019 extended support ends October 2025 | Only Microsoft 365 version remains supported |
| No mobile Access capability | Desktop-only in a mobile world |

**I'm not saying Access will disappear tomorrow.** Microsoft rarely kills products outright. But the pattern suggests that at some point - 3 years? 5 years? 10 years? - organizations on Access will face pressure to migrate.

**Question for the group:** Am I overreading this? Is Access-in-Microsoft-365 stable enough that this isn't a real concern?

### Risk 2: Knowledge Concentration

The people who understand Praxis deeply - the business logic, the VBA code, the data relationships, the workarounds and edge cases - are a small group.

This isn't a criticism. It's the natural result of a system built and maintained by a dedicated team over many years. But it creates key-person risk:

- What happens when those people retire?
- What happens if someone leaves unexpectedly?
- How do we hire replacements? (Access/VBA developers are increasingly rare)

**The business logic is valuable.** If it only exists in Praxis and in people's heads, that's a fragile situation regardless of technology choices.

**Question for the group:** Is this concern overblown? Is there documentation I'm not aware of? Is the knowledge more distributed than I realize?

### Risk 3: Future Exit Considerations

Sunbelt is PE-owned. At some point, Littlejohn will look to exit. Buyers evaluate technology infrastructure during due diligence:

- Modern systems → easier integration → higher value
- Legacy systems → migration costs → lower value
- Key-person dependencies → risk premium → lower value

I don't know when an exit might happen or what a buyer would prioritize. But I think it's worth considering how our IT infrastructure looks from the outside.

**Question for the group:** Am I overthinking this? Is IT infrastructure even a significant factor in modular construction M&A?

---

## What I'm NOT Proposing

Let me be clear about what I'm NOT saying:

- ❌ "Throw away Praxis" - That would be insane. Years of logic, data, and institutional knowledge.
- ❌ "Use my system instead" - It's a proof of concept, not a Praxis replacement.
- ❌ "The IT team doesn't know what they're doing" - They built something that works.
- ❌ "We need to act immediately" - This is about long-term planning, not crisis response.

---

## What I AM Wondering

1. **Should the business logic in Praxis be documented externally?**
   - Not to replace Praxis, but as insurance
   - If it only exists in the code and in people's heads, that's a risk
   - Documentation is valuable regardless of platform decisions

2. **Is there a succession plan for Praxis knowledge?**
   - Who's being trained to maintain it?
   - Is that documented anywhere?

3. **Has anyone evaluated what a Praxis migration would look like?**
   - Not to do it, just to understand the scope
   - What would it cost? How long would it take? What are the options?
   - Better to know this before it's urgent

4. **Is there appetite for any modernization, even incremental?**
   - Could new functionality be built in modern tools while Praxis stays?
   - Are there pain points that Praxis doesn't address well?
   - Is there a "both/and" path rather than "either/or"?

---

## What I Built (Context)

For context, here's what I was presenting:

- A project management dashboard built in React with a Supabase (PostgreSQL) backend
- The PM functionality is solid - based on my actual job
- The production/sales functionality is approximated - educated guesses based on plant walks, conversations, and observation
- It's a proof of concept showing what modern tools can do, not a finished product

I used an AI coding assistant (Claude Code) to accelerate development. This raised some concerns about security, which I understand but believe are addressable through code review.

**The tool itself isn't the point.** The point is: modern development approaches can produce useful software relatively quickly. Whether that's valuable to Sunbelt is a separate question.

---

## Questions for You All

1. **Is this worth raising, or should I let it go?**
   - Sometimes the right move is to drop it and move on
   - I don't want to be "that guy" who won't stop pushing

2. **Is my read on the risks accurate?**
   - Am I seeing problems that aren't there?
   - Am I missing context that would change my view?

3. **Is the tone right?**
   - Does this come across as constructive or confrontational?
   - Would you soften anything? Sharpen anything?

4. **Who else should see this (if anyone)?**
   - Is this something to raise formally?
   - Is it better as an informal conversation?
   - Should I just file it away and revisit in a year?

5. **Timing considerations?**
   - Is there something happening in the company that makes this good/bad timing?
   - Are there political dynamics I should be aware of?

---

## My Commitment

Whatever feedback you give, I'll respect it. If the consensus is "let it go," I'll let it go. I'm not on a crusade - I just wanted to think through this with people whose judgment I trust.

Thanks for taking the time to read this.

---

**Matthew**

---

*P.S. Crystal - seriously, please be blunt. I'd rather hear "this is a bad idea, drop it" from you now than learn it the hard way later.*
